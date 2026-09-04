/**
 * Panoramic Cyber-OLED Screen Controller
 * Handles 6 panoramic studio views:
 * - SCOPE: Real-time dynamic oscilloscope & spectrum visualizer
 * - EFFECTS: Interactive 6-rack effects bay with status indicators & bypass
 * - ENVELOPE: Graphical ADSR curve visualizer for OP1-OP6
 * - OPERATORS: 6-column FM operator level/ratio matrix
 * - SEQUENCER: 16-step grid visualizer
 * - SETTINGS: Global hardware and MIDI configuration
 */

export class SynthScreen {
  constructor(screenEl, engine, app) {
    this.container = screenEl;
    this.engine = engine;
    this.app = app;

    this.currentView = "scope"; // "scope", "effects", "envelope", "operators", "sequencer", "settings"
    this.selectedFx = "filter";
    this.selectedOperator = 1;

    this._setupDOM();
    this._startVisualizer();
  }

  _setupDOM() {
    this.container.innerHTML = `
      <!-- Panoramic OLED Tab Bar -->
      <nav class="oled-tab-bar" role="tablist">
        <button class="oled-tab-btn active" data-tab="scope">SCOPE</button>
        <button class="oled-tab-btn" data-tab="effects">EFFECTS</button>
        <button class="oled-tab-btn" data-tab="envelope">ENVELOPE</button>
        <button class="oled-tab-btn" data-tab="operators">OPERATORS</button>
        <button class="oled-tab-btn" data-tab="sequencer">SEQUENCER</button>
        <button class="oled-tab-btn" data-tab="drums">DRUMS</button>
        <button class="oled-tab-btn" data-tab="settings">SETTINGS</button>
      </nav>

      <!-- Main OLED Body Content -->
      <div class="oled-body" id="oledBody"></div>

      <!-- Bottom Telemetry Footer -->
      <footer class="oled-footer">
        <span id="oledStatusLeft">VOICE: POLY • 8 VOICES</span>
        <span id="oledStatusRight">ALGO 5 • 3 CARRIERS</span>
      </footer>
    `;

    this.bodyEl = this.container.querySelector("#oledBody");
    this.statusLeftEl = this.container.querySelector("#oledStatusLeft");
    this.statusRightEl = this.container.querySelector("#oledStatusRight");

    // Tab buttons
    this.container.querySelectorAll(".oled-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.setView(btn.dataset.tab);
      });
    });

    this.render();
  }

  setView(tabName) {
    this.currentView = tabName;
    this.container.querySelectorAll(".oled-tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });
    this.render();
    if (this.app) {
      this.app.updateKnobMappings();
    }
  }

  updateTelemetry() {
    if (!this.statusLeftEl || !this.engine) return;
    const patch = this.engine.currentPatch;
    const algoId = patch.algorithm || 1;
    this.statusLeftEl.textContent = `PATCH: ${patch.name || "PRESET"} • ${this.engine.voiceMode.toUpperCase()}`;
    this.statusRightEl.textContent = `ALGORITHM #${algoId} • OCT: ${this.engine.octave >= 0 ? "+" : ""}${this.engine.octave}`;
  }

  render() {
    this.updateTelemetry();
    switch (this.currentView) {
      case "scope":
        this.renderScopeView();
        break;
      case "effects":
        this.renderEffectsView();
        break;
      case "envelope":
        this.renderEnvelopeView();
        break;
      case "operators":
        this.renderOperatorsView();
        break;
      case "sequencer":
        this.renderSequencerView();
        break;
      case "drums":
        this.renderDrumsView();
        break;
      case "settings":
        this.renderSettingsView();
        break;
      default:
        this.renderScopeView();
    }
  }

  /**
   * 1. SCOPE: Real-Time Oscilloscope & Spectrum
   */
  renderScopeView() {
    this.bodyEl.innerHTML = `
      <div class="view-scope">
        <canvas id="scopeCanvas" class="scope-canvas" width="460" height="120"></canvas>
        <div class="scope-telemetry">
          <span>SAMPLE RATE: 44.1 kHz</span>
          <span>FM MATRIX: 6 OPERATORS</span>
          <span>MASTER OUT: STEREO</span>
        </div>
      </div>
    `;
  }

  _startVisualizer() {
    const draw = () => {
      requestAnimationFrame(draw);
      if (this.currentView !== "scope") return;
      const canvas = document.getElementById("scopeCanvas");
      if (!canvas || !this.engine.analyser) return;

      const ctx = canvas.getContext("2d");
      const bufferLength = this.engine.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.engine.analyser.getByteTimeDomainData(dataArray);

      // Deep cyber background with slight fade
      ctx.fillStyle = "rgba(10, 16, 22, 0.4)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center grid line
      ctx.strokeStyle = "rgba(0, 240, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Draw neon wave line
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#00f0ff";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(0, 240, 255, 0.7)";
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };
    requestAnimationFrame(draw);
  }

  /**
   * 2. EFFECTS: 6 Studio Modules Rack
   */
  renderEffectsView() {
    const states = this.engine.effects?.states || {};
    const modules = [
      { id: "filter", name: "FILTER", param: `Cutoff: ${Math.round(states.filter?.cutoff || 4000)}Hz` },
      { id: "distortion", name: "DISTORTION", param: `Drive: ${Math.round((states.distortion?.drive || 0) * 100)}%` },
      { id: "chorus", name: "CHORUS", param: `Rate: ${(states.chorus?.rate || 1.2).toFixed(1)}Hz` },
      { id: "phaser", name: "PHASER", param: `Depth: ${Math.round((states.phaser?.depth || 0.7) * 100)}%` },
      { id: "delay", name: "PING-PONG DELAY", param: `Time: ${Math.round((states.delay?.time || 0.28) * 1000)}ms` },
      { id: "reverb", name: "STUDIO REVERB", param: `Decay: ${(states.reverb?.decay || 2.2).toFixed(1)}s` }
    ];

    let html = `<div class="view-effects">`;
    for (let m of modules) {
      const isEnabled = states[m.id]?.enabled;
      const isSelected = this.selectedFx === m.id;
      html += `
        <div class="fx-module-card ${isSelected ? 'selected' : ''}" data-fx="${m.id}">
          <div class="fx-card-top">
            <span class="fx-card-name">${m.name}</span>
            <span class="fx-card-led ${isEnabled ? 'lit' : ''}"></span>
          </div>
          <span class="fx-card-param">${m.param}</span>
        </div>
      `;
    }
    html += `</div>`;
    this.bodyEl.innerHTML = html;

    this.bodyEl.querySelectorAll(".fx-module-card").forEach((card) => {
      card.addEventListener("click", () => {
        const fxId = card.dataset.fx;
        if (this.selectedFx === fxId) {
          // Toggle bypass
          this.engine.effects.toggleEffect(fxId);
        } else {
          this.selectedFx = fxId;
        }
        this.renderEffectsView();
        if (this.app) this.app.updateKnobMappings();
      });
    });
  }

  /**
   * 3. ENVELOPE: Interactive Bezier ADSR Curve
   */
  renderEnvelopeView() {
    const op = this.engine.currentPatch.operators[this.selectedOperator - 1] || {};
    const a = op.attack || 0.01;
    const d = op.decay || 0.5;
    const s = op.sustain ?? 0.5;
    const r = op.release || 0.5;

    this.bodyEl.innerHTML = `
      <div class="view-envelope">
        <div class="env-op-selector">
          ${[1, 2, 3, 4, 5, 6].map(num => `
            <button class="env-op-btn ${num === this.selectedOperator ? 'active' : ''}" data-op="${num}">OP ${num}</button>
          `).join("")}
        </div>
        <canvas id="envCanvas" class="env-canvas" width="460" height="100"></canvas>
      </div>
    `;

    // Draw ADSR Curve on Canvas
    const canvas = document.getElementById("envCanvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height - 12;
      const padX = 14;
      const drawW = w - 28;

      const x0 = padX;
      const y0 = h;
      const x1 = padX + drawW * 0.22;
      const y1 = 8;
      const x2 = padX + drawW * 0.55;
      const y2 = y1 + (h - y1) * (1 - s);
      const x3 = padX + drawW * 0.76;
      const y3 = y2;
      const x4 = padX + drawW;
      const y4 = h;

      // Gradient Fill
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(0, 240, 255, 0.4)");
      grad.addColorStop(1, "rgba(0, 240, 255, 0.02)");

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x4, y4);
      ctx.lineTo(x0, y0);
      ctx.fillStyle = grad;
      ctx.fill();

      // Stroke Line
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x4, y4);
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(0, 240, 255, 0.8)";
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    this.bodyEl.querySelectorAll(".env-op-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectedOperator = parseInt(btn.dataset.op, 10);
        this.renderEnvelopeView();
        if (this.app) this.app.updateKnobMappings();
      });
    });
  }

  /**
   * 4. OPERATORS: 6-Column FM Operator Matrix
   */
  renderOperatorsView() {
    const ops = this.engine.currentPatch.operators || [];
    let html = `<div class="view-operators">`;
    for (let i = 0; i < 6; i++) {
      const op = ops[i] || { ratio: 1, level: 0.5 };
      const isSel = this.selectedOperator === i + 1;
      html += `
        <div class="op-col ${isSel ? 'selected' : ''}" data-op="${i + 1}">
          <span class="op-col-title">OP ${i + 1}</span>
          <div class="op-col-meter">
            <div class="op-col-fill" style="height: ${Math.round(op.level * 100)}%"></div>
          </div>
          <span class="op-col-ratio">×${op.ratio}</span>
        </div>
      `;
    }
    html += `</div>`;
    this.bodyEl.innerHTML = html;

    this.bodyEl.querySelectorAll(".op-col").forEach((col) => {
      col.addEventListener("click", () => {
        this.selectedOperator = parseInt(col.dataset.op, 10);
        this.renderOperatorsView();
        if (this.app) this.app.updateKnobMappings();
      });
    });
  }

  /**
   * 5. SEQUENCER: 16-Step Pattern Grid
   */
  renderSequencerView() {
    const seq = this.app?.sequencer;
    const currentStep = seq?.currentStep ?? -1;
    const isRecording = Boolean(seq?.isRecording);
    const recIndex = seq?.stepRecordIndex ?? 0;

    let grid = `<div class="seq-screen-grid">`;
    for (let i = 0; i < 16; i++) {
      const isCurrent = currentStep === i;
      const isRecTarget = isRecording && !seq?.isPlaying && recIndex === i;
      const step = seq?.steps[i];
      const heightPercent = step?.active ? Math.round(step.velocity * 100) : 10;
      grid += `
        <div class="seq-screen-col ${isCurrent ? 'current' : ''} ${isRecTarget ? 'rec-target' : ''}">
          <div class="seq-screen-fill" style="height: ${heightPercent}%; opacity: ${step?.active ? 1 : 0.2}"></div>
        </div>
      `;
    }
    grid += `</div>`;

    const statusText = seq?.isPlaying ? "ACTIVE" : (isRecording ? "RECORDING" : "IDLE");
    const playheadText = currentStep >= 0 
      ? `${currentStep + 1} / 16` 
      : (isRecording ? `REC STEP ${recIndex + 1}` : "STOPPED");

    this.bodyEl.innerHTML = `
      <div class="view-sequencer">
        <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:#8ab4f8; font-family:monospace;">
          <span>TEMPO: ${seq?.bpm || 124} BPM</span>
          <span>PLAYHEAD: ${playheadText}</span>
          <span style="color:${isRecording ? '#ff5566' : '#8ab4f8'}">STATUS: ${statusText}</span>
        </div>
        ${grid}
      </div>
    `;
  }

  /**
   * 6. DRUMS: 6-Voice Multi-Track Step Matrix
   */
  renderDrumsView() {
    const seq = this.app?.sequencer;
    const currentStep = seq?.playheadStep ?? seq?.currentStep ?? -1;
    const drumVoices = [
      { id: "kick", label: "KICK" },
      { id: "snare", label: "SNARE" },
      { id: "hihat", label: "CH" },
      { id: "openhat", label: "OH" },
      { id: "clap", label: "CLAP" },
      { id: "perc", label: "PERC" }
    ];

    let rowsHtml = "";
    for (const d of drumVoices) {
      const trackSteps = seq?.tracks?.[d.id] || [];
      let cellsHtml = "";
      for (let s = 0; s < 16; s++) {
        const stepObj = trackSteps[s];
        const isActive = stepObj?.active;
        const isCurrent = currentStep === s;
        const isBeatStart = s % 4 === 0;
        cellsHtml += `
          <div class="drum-matrix-cell ${isBeatStart ? 'beat-start' : ''} ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}" data-drum="${d.id}" data-step="${s}"></div>
        `;
      }
      rowsHtml += `
        <div class="drum-matrix-row" data-drum="${d.id}">
          <span class="drum-matrix-label">${d.label}</span>
          <div class="drum-matrix-steps">${cellsHtml}</div>
        </div>
      `;
    }

    const drumParams = this.engine.drums ? this.engine.drums.getParams() : { kickTune: 55, snareSnap: 0.6, hatDecay: 0.08, drumMix: 0.85 };

    this.bodyEl.innerHTML = `
      <div class="view-drums">
        <div class="drums-header-stats">
          <span>DRUMS: 6-VOICE</span>
          <span>TEMPO: ${seq?.bpm || 124} BPM</span>
          <span>MIX: ${Math.round((drumParams.drumMix ?? 0.85) * 100)}%</span>
          <span>STEP: ${currentStep >= 0 ? currentStep + 1 : "STOP"} / 16</span>
        </div>
        <div class="drum-matrix-grid">${rowsHtml}</div>
      </div>
    `;

    // Click to toggle drum step directly on matrix
    this.bodyEl.querySelectorAll(".drum-matrix-cell").forEach((cell) => {
      cell.addEventListener("click", () => {
        const drum = cell.dataset.drum;
        const step = parseInt(cell.dataset.step, 10);
        if (seq?.tracks?.[drum]?.[step]) {
          const s = seq.tracks[drum][step];
          s.active = !s.active;
          this.renderDrumsView();
          if (seq.currentTrack === drum) {
            this.app?.keyboard?._setupSequencerStrip();
          }
        }
      });
    });
  }

  /**
   * 7. SETTINGS: Global Configuration & MIDI
   */
  renderSettingsView() {
    this.bodyEl.innerHTML = `
      <div class="view-settings">
        <div class="setting-row"><span>MASTER TUNING</span> <span>440.0 Hz</span></div>
        <div class="setting-row"><span>POLYPHONY MODE</span> <span>${this.engine.voiceMode.toUpperCase()} (8 VOICES)</span></div>
        <div class="setting-row"><span>WEB MIDI INPUT</span> <span style="color:var(--accent-emerald)">ACTIVE / CONNECTED</span></div>
        <div class="setting-row"><span>AUDIO ENGINE</span> <span>WEB AUDIO 32-BIT FLOAT</span></div>
      </div>
    `;
  }
}
