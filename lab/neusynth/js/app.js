import { SynthEngine } from "./audio/engine.js";
import { RotaryKnob } from "./ui/knob.js";
import { SynthScreen } from "./ui/screen.js";
import { Sequencer } from "./ui/sequencer.js";
import { SynthKeyboard } from "./ui/keyboard.js";

/**
 * Main Controller for NeuSynth Prime
 */
class NeuSynthApp {
  constructor() {
    this.engine = new SynthEngine();
    this.sequencer = new Sequencer(this.engine);
    this.knobs = {};
    this.screen = null;
    this.keyboard = null;

    this.init();
  }

  async init() {
    // 1. Initialize Cyber-OLED Screen
    const screenEl = document.getElementById("synthScreen");
    this.screen = new SynthScreen(screenEl, this.engine, this);

    // 2. Initialize Sequencer Callbacks
    this.sequencer.onStep = (stepIdx, isPlaying, activeDrums) => {
      this.keyboard?.highlightStep(stepIdx, isPlaying, activeDrums);
      if (this.screen.currentView === "sequencer") {
        this.screen.renderSequencerView();
      } else if (this.screen.currentView === "drums") {
        this.screen.renderDrumsView();
      }
    };

    this.sequencer.onPlayStateChange = (isPlaying) => {
      const playBtn = document.getElementById("btnPlayStop");
      if (playBtn) {
        playBtn.classList.toggle("playing", isPlaying);
        playBtn.innerHTML = isPlaying ? "❚❚ STOP" : "▶ PLAY";
      }
      if (this.screen.currentView === "sequencer") {
        this.screen.renderSequencerView();
      } else if (this.screen.currentView === "drums") {
        this.screen.renderDrumsView();
      }
    };

    // 3. Initialize Knobs & Encoders
    this._initKnobs();

    // 4. Initialize Core Switches & Presets
    this._initCoreControls();

    // 5. Initialize Keyboard & Sequencer Strip
    this.keyboard = new SynthKeyboard(this.engine, this);

    // 5b. Initialize Dedicated BPM & Tempo Controls
    this._initBpmControls();

    // 6. Initialize Header Controls & Theme
    this._initHeaderControls();

    // 7. Start Master VU Meter Animation
    this._startVuMeter();

    // 8. Auto-resume audio on first gesture
    const resumeAudio = () => {
      this.engine.resume().then(() => {
        const btn = document.getElementById("btnStartAudio");
        if (btn && this.engine.ctx?.state === "running") {
          btn.innerHTML = "<span>🔊</span> AUDIO ACTIVE";
          btn.classList.remove("btn-audio-wake");
        }
      });
    };
    window.addEventListener("pointerdown", resumeAudio, { once: true });
    window.addEventListener("mousedown", resumeAudio, { once: true });
    window.addEventListener("touchstart", resumeAudio, { once: true });
    window.addEventListener("keydown", resumeAudio, { once: true });

    this.updatePresetDisplay();

    // 9. Initialize Preset Browser Modal
    this._initPresetBrowser();

    // 9b. Initialize Local File Storage & Drag-and-Drop
    this._initFileStorage();

    // 10. URL parameters for tab, track, and theme
    if (typeof window !== "undefined" && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const initialTab = urlParams.get("tab");
      if (initialTab && ["scope", "effects", "envelope", "operators", "sequencer", "drums", "settings"].includes(initialTab)) {
        this.screen.setView(initialTab);
      }
      const initialTrack = urlParams.get("track");
      if (initialTrack && this.sequencer?.tracks[initialTrack]) {
        this.sequencer.setTrack(initialTrack);
        document.querySelectorAll(".seq-track-btn").forEach(b => b.classList.toggle("active", b.dataset.track === initialTrack));
        const badge = document.getElementById("seqTrackBadge");
        if (badge) badge.textContent = `TRACK: ${initialTrack.toUpperCase()}`;
        this.keyboard?._setupSequencerStrip();
      }
      const initialTheme = urlParams.get("theme");
      if (initialTheme === "light") {
        document.body.classList.add("light-theme");
        const themeBtn = document.getElementById("btnThemeToggle");
        if (themeBtn) themeBtn.innerHTML = "☀️ PORCELAIN";
      }
      const initialGenre = urlParams.get("genre");
      if (initialGenre) {
        this.selectedGenre = initialGenre.toUpperCase();
        document.querySelectorAll(".preset-genre-btn").forEach(b => b.classList.toggle("active", b.dataset.genre === this.selectedGenre));
        this._renderPresetCards();
      }
      const openBrowser = urlParams.get("browser") || urlParams.get("modal");
      if (openBrowser === "presets" || openBrowser === "1" || openBrowser === "true") {
        const modal = document.getElementById("presetModalBackdrop");
        if (modal) modal.hidden = false;
      }
      const openFile = urlParams.get("filemodal");
      if (openFile === "1" || openFile === "true") {
        this.openFileModal();
      }
      const openRec = urlParams.get("rec");
      if (openRec === "1" || openRec === "true") {
        if (!this.sequencer.isRecording) this.sequencer.toggleRecord();
        const stepParam = urlParams.get("step");
        if (stepParam !== null) {
          const stepNum = parseInt(stepParam, 10);
          if (!isNaN(stepNum)) {
            this.sequencer.setRecordStep(stepNum);
          }
        }
        this.keyboard?.updateRecCursor();
      }
      const modParam = urlParams.get("mod");
      if (modParam !== null) {
        const modVal = parseFloat(modParam);
        if (!isNaN(modVal)) {
          setTimeout(() => this.keyboard?.updateModWheel(modVal), 100);
        }
      }
    }
  }

  _initKnobs() {
    // MASTER HERO KNOB
    const masterEl = document.getElementById("knobMaster");
    const masterValEl = document.getElementById("masterValue");
    if (masterEl) {
      this.knobs.master = new RotaryKnob(masterEl, {
        min: 0,
        max: 100,
        defaultValue: 75,
        unit: "%",
        name: "Master Volume",
        onChange: (val) => {
          this.engine.setMasterVolume(val / 100);
          if (masterValEl) masterValEl.textContent = `${Math.round(val)}%`;
        }
      });
    }

    // ALGORITHM KNOB
    const algoEl = document.getElementById("knobAlgorithm");
    const algoBadge = document.getElementById("algoValue");
    const algoDisp = document.getElementById("algoNumberDisplay");
    if (algoEl) {
      this.knobs.algorithm = new RotaryKnob(algoEl, {
        min: 1,
        max: 8,
        step: 1,
        defaultValue: 5,
        unit: "",
        name: "Algorithm",
        onChange: (val) => {
          const num = Math.round(val);
          this.engine.setAlgorithm(num);
          if (algoBadge) algoBadge.textContent = `ALGO ${num} / 8`;
          if (algoDisp) algoDisp.textContent = `#${num}`;
          this.screen.render();
        }
      });
    }

    // 4 MACRO ENCODERS
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`paramKnob${i}`);
      if (el) {
        this.knobs[`param${i}`] = new RotaryKnob(el, {
          min: 0,
          max: 100,
          defaultValue: 50,
          name: `Macro ${i}`,
          onChange: (val, norm) => {
            this._handleMacroChange(i, val, norm);
          }
        });
      }
    }

    this.updateKnobMappings();
  }

  _initCoreControls() {
    // Preset Prev/Next
    const prevBtn = document.getElementById("btnPresetPrev");
    const nextBtn = document.getElementById("btnPresetNext");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        const count = this.engine.presets.length;
        const newIdx = (this.engine.currentPresetIndex - 1 + count) % count;
        this.loadPreset(newIdx);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const count = this.engine.presets.length;
        const newIdx = (this.engine.currentPresetIndex + 1) % count;
        this.loadPreset(newIdx);
      });
    }

    // Voice Mode Switches
    const polyBtn = document.getElementById("btnVoicePoly");
    const monoBtn = document.getElementById("btnVoiceMono");
    if (polyBtn && monoBtn) {
      polyBtn.addEventListener("click", () => {
        this.engine.setVoiceMode("poly");
        polyBtn.classList.add("active");
        monoBtn.classList.remove("active");
        this.screen.render();
      });
      monoBtn.addEventListener("click", () => {
        this.engine.setVoiceMode("mono");
        monoBtn.classList.add("active");
        polyBtn.classList.remove("active");
        this.screen.render();
      });
    }

    // Octave Switches
    const octDown = document.getElementById("btnOctDown");
    const octUp = document.getElementById("btnOctUp");
    if (octDown) octDown.addEventListener("click", () => this.shiftOctave(-1));
    if (octUp) octUp.addEventListener("click", () => this.shiftOctave(1));

    // Transport: Play/Stop, Rec, Arp, Save
    const playBtn = document.getElementById("btnPlayStop");
    if (playBtn) playBtn.addEventListener("click", () => this.sequencer.togglePlay());

    const recBtn = document.getElementById("btnRecToggle");
    if (recBtn) {
      recBtn.addEventListener("click", () => {
        const isRec = this.sequencer.toggleRecord();
        recBtn.classList.toggle("active", isRec);
        this.keyboard?.updateRecCursor();
      });
    }

    // Step-Recording Toolbar Controls
    const btnRecPrev = document.getElementById("btnRecPrevStep");
    if (btnRecPrev) {
      btnRecPrev.addEventListener("click", () => {
        this.sequencer.prevRecordStep();
      });
    }

    const btnRecSkip = document.getElementById("btnRecSkipStep");
    if (btnRecSkip) {
      btnRecSkip.addEventListener("click", () => {
        this.sequencer.skipStep(true);
      });
    }

    const btnRecNext = document.getElementById("btnRecNextStep");
    if (btnRecNext) {
      btnRecNext.addEventListener("click", () => {
        this.sequencer.nextRecordStep();
      });
    }

    const btnRecClear = document.getElementById("btnRecClearStep");
    if (btnRecClear) {
      btnRecClear.addEventListener("click", () => {
        this.sequencer.clearRecordStep();
      });
    }

    const arpBtn = document.getElementById("btnArpToggle");
    if (arpBtn) {
      arpBtn.addEventListener("click", () => {
        this.sequencer.mode = this.sequencer.mode === "arp" ? "seq" : "arp";
        arpBtn.classList.toggle("active", this.sequencer.mode === "arp");
      });
    }
  }

  loadPreset(index, withGroove = null) {
    const patch = this.engine.loadPreset(index);
    if (!patch) return;

    // Determine if groove should be loaded
    const shouldLoadGroove = withGroove !== null ? withGroove : this.autoLoadGroove;
    if (shouldLoadGroove && patch.groove) {
      this.sequencer.loadGroove(patch.groove);
      if (patch.groove.bpm) this.setBpm(patch.groove.bpm);
      this.keyboard?._setupSequencerStrip();
    }

    this.updatePresetDisplay();
    const algoNum = this.engine.currentPatch.algorithm || 1;
    if (this.knobs.algorithm) this.knobs.algorithm.setValue(algoNum, false);
    const algoBadge = document.getElementById("algoValue");
    const algoDisp = document.getElementById("algoNumberDisplay");
    if (algoBadge) algoBadge.textContent = `ALGO ${algoNum} / 8`;
    if (algoDisp) algoDisp.textContent = `#${algoNum}`;

    this.screen.render();
    this.updateKnobMappings();
    this._highlightActivePresetCard();
  }

  updatePresetDisplay() {
    const preset = this.engine.presets[this.engine.currentPresetIndex];
    const el = document.getElementById("headerPresetName");
    if (el && preset) {
      el.textContent = `${preset.code} • ${preset.name}`;
    }
  }

  setBpm(bpm) {
    const val = Math.max(40, Math.min(260, Math.round(bpm)));
    this.sequencer.setBpm(val);

    const bpmVal = document.getElementById("seqBpmVal");
    if (bpmVal) bpmVal.textContent = val;

    const bpmInput = document.getElementById("seqBpmInput");
    if (bpmInput) bpmInput.value = val;

    const bpmBadge = document.getElementById("seqBpmBadge");
    if (bpmBadge) bpmBadge.textContent = `${val} BPM`;

    // Sync Macro 1 knob if currently on sequencer view
    if (this.screen?.currentView === "sequencer" && this.knobs.param1) {
      const norm = Math.max(0, Math.min(1, (val - 50) / 170));
      this.knobs.param1.setValue(norm * 100, false);
    }

    // Refresh OLED screen if in sequencer or drums view so tempo readout updates
    if (this.screen?.currentView === "sequencer") {
      this.screen.renderSequencerView();
    } else if (this.screen?.currentView === "drums") {
      this.screen.renderDrumsView();
    }
  }

  _initBpmControls() {
    const btnDown = document.getElementById("btnBpmDown");
    const btnUp = document.getElementById("btnBpmUp");
    const wrap = document.getElementById("seqBpmDisplayWrap");
    const valEl = document.getElementById("seqBpmVal");
    const inputEl = document.getElementById("seqBpmInput");
    const tapBtn = document.getElementById("btnTapTempo");

    // Stepper buttons (- / +)
    if (btnDown) {
      btnDown.addEventListener("click", (e) => {
        const step = e.shiftKey ? 5 : 1;
        this.setBpm(this.sequencer.bpm - step);
      });
    }

    if (btnUp) {
      btnUp.addEventListener("click", (e) => {
        const step = e.shiftKey ? 5 : 1;
        this.setBpm(this.sequencer.bpm + step);
      });
    }

    // Direct input on click / double-click
    if (wrap && valEl && inputEl) {
      const openEdit = () => {
        valEl.style.display = "none";
        inputEl.style.display = "inline-block";
        inputEl.value = this.sequencer.bpm;
        inputEl.focus();
        inputEl.select();
      };

      const closeEdit = () => {
        const parsed = parseInt(inputEl.value, 10);
        if (!isNaN(parsed)) {
          this.setBpm(parsed);
        }
        inputEl.style.display = "none";
        valEl.style.display = "inline-block";
      };

      valEl.addEventListener("click", openEdit);
      inputEl.addEventListener("blur", closeEdit);
      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          closeEdit();
        } else if (e.key === "Escape") {
          inputEl.style.display = "none";
          valEl.style.display = "inline-block";
        }
      });

      // Mouse wheel to adjust tempo
      wrap.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? (e.shiftKey ? 5 : 1) : -(e.shiftKey ? 5 : 1);
        this.setBpm(this.sequencer.bpm + delta);
      }, { passive: false });

      // Click & drag horizontally/vertically to scrub tempo
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let startBpm = 0;

      wrap.addEventListener("mousedown", (e) => {
        if (e.target === inputEl) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startBpm = this.sequencer.bpm;
        document.body.style.cursor = "ew-resize";
      });

      window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const delta = Math.round((e.clientX - startX) * 0.5 - (e.clientY - startY) * 0.5);
        this.setBpm(startBpm + delta);
      });

      window.addEventListener("mouseup", () => {
        if (isDragging) {
          isDragging = false;
          document.body.style.cursor = "";
        }
      });
    }

    // Tap Tempo
    if (tapBtn) {
      let tapTimes = [];
      tapBtn.addEventListener("click", () => {
        const now = performance.now();
        tapTimes = tapTimes.filter((t) => now - t < 2500);
        tapTimes.push(now);

        // Visual flash feedback
        tapBtn.classList.add("tapped");
        setTimeout(() => tapBtn.classList.remove("tapped"), 120);

        if (tapTimes.length >= 2) {
          const intervals = [];
          for (let i = 1; i < tapTimes.length; i++) {
            intervals.push(tapTimes[i] - tapTimes[i - 1]);
          }
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          const computedBpm = Math.round(60000 / avgInterval);
          if (computedBpm >= 40 && computedBpm <= 260) {
            this.setBpm(computedBpm);
          }
        }
      });
    }
  }

  _initPresetBrowser() {
    this.selectedGenre = "ALL";
    this.presetSearchQuery = "";
    this.autoLoadGroove = true;

    const modalBackdrop = document.getElementById("presetModalBackdrop");
    const openBtn = document.getElementById("btnOpenPresetBrowser");
    const headerDisplay = document.getElementById("headerPresetName");
    const closeBtn = document.getElementById("btnClosePresetBrowser");
    const searchInput = document.getElementById("inputPresetSearch");
    const grooveCheck = document.getElementById("chkAutoLoadGroove");

    const openModal = () => {
      if (modalBackdrop) {
        modalBackdrop.hidden = false;
        this._renderPresetCards();
        if (searchInput) {
          searchInput.value = "";
          this.presetSearchQuery = "";
          setTimeout(() => searchInput.focus(), 60);
        }
      }
    };

    const closeModal = () => {
      if (modalBackdrop) modalBackdrop.hidden = true;
    };

    if (openBtn) openBtn.addEventListener("click", openModal);
    if (headerDisplay) headerDisplay.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    if (modalBackdrop) {
      modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) closeModal();
      });
    }

    window.addEventListener("keydown", (e) => {
      if (e.code === "Escape" && modalBackdrop && !modalBackdrop.hidden) {
        closeModal();
      }
    });

    if (grooveCheck) {
      grooveCheck.addEventListener("change", (e) => {
        this.autoLoadGroove = e.target.checked;
      });
    }

    // Genre filter pills
    const genrePills = document.querySelectorAll(".preset-genre-btn");
    genrePills.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectedGenre = btn.dataset.genre || "ALL";
        genrePills.forEach((b) => b.classList.toggle("active", b === btn));
        this._renderPresetCards();
      });
    });

    // Search input
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.presetSearchQuery = e.target.value.trim().toLowerCase();
        this._renderPresetCards();
      });
    }

    this._renderPresetCards();
  }

  _getGenreClass(genre) {
    if (!genre) return "classics";
    const g = genre.toLowerCase();
    if (g.includes("trance")) return "euro-trance";
    if (g.includes("dark")) return "dark-beats";
    if (g.includes("techno")) return "techno";
    if (g.includes("synthwave")) return "synthwave";
    return "classics";
  }

  _renderPresetCards() {
    const grid = document.getElementById("presetCardsGrid");
    const countLabel = document.getElementById("presetCountLabel");
    if (!grid) return;

    const presets = this.engine.presets;
    const currentIdx = this.engine.currentPresetIndex;

    const filtered = presets.filter((p) => {
      const matchGenre = this.selectedGenre === "ALL" || p.genre === this.selectedGenre;
      const matchSearch =
        !this.presetSearchQuery ||
        p.name.toLowerCase().includes(this.presetSearchQuery) ||
        p.genre.toLowerCase().includes(this.presetSearchQuery) ||
        (p.desc && p.desc.toLowerCase().includes(this.presetSearchQuery)) ||
        p.code.includes(this.presetSearchQuery);
      return matchGenre && matchSearch;
    });

    if (countLabel) {
      countLabel.textContent = `SHOWING ${filtered.length} OF ${presets.length} PRESETS`;
    }

    grid.innerHTML = "";
    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px 20px; color: var(--text-dim); font-size: 0.85rem;">No presets match "${this.presetSearchQuery}". Try another search term or click "ALL".</div>`;
      return;
    }

    filtered.forEach((preset) => {
      const originalIdx = presets.indexOf(preset);
      const isCurrent = originalIdx === currentIdx;
      const genreClass = this._getGenreClass(preset.genre);

      const card = document.createElement("div");
      card.className = `preset-card ${isCurrent ? 'current-active' : ''}`;
      card.dataset.index = originalIdx;
      card.innerHTML = `
        <div class="preset-card-top">
          <span class="preset-card-code">${preset.code}</span>
          <span class="genre-badge ${genreClass}">${preset.genre}</span>
        </div>
        <h3 class="preset-card-title">${preset.name}</h3>
        <p class="preset-card-desc">${preset.desc || ""}</p>
        <div class="preset-card-meta">
          <span>${preset.tempo ? `${preset.tempo} BPM` : '124 BPM'}</span>
          <span>ALGO #${preset.algorithm || 1}</span>
          <span>${(preset.voiceMode || 'poly').toUpperCase()}</span>
        </div>
        <div class="preset-card-actions">
          <button class="preset-action-btn btn-load-sound" data-action="sound" title="Load synthesizer sound only">
            SOUND ONLY
          </button>
          <button class="preset-action-btn btn-load-groove" data-action="groove" title="Load sound + matching drum beat & tempo">
            FULL GROOVE ⚡
          </button>
        </div>
      `;

      card.querySelector(".btn-load-sound")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.loadPreset(originalIdx, false);
      });

      card.querySelector(".btn-load-groove")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.loadPreset(originalIdx, true);
        if (!this.sequencer.isPlaying) {
          this.sequencer.togglePlay();
        }
      });

      card.addEventListener("click", () => {
        this.loadPreset(originalIdx, this.autoLoadGroove);
      });

      grid.appendChild(card);
    });
  }

  _highlightActivePresetCard() {
    const currentIdx = this.engine.currentPresetIndex;
    document.querySelectorAll(".preset-card").forEach((c) => {
      c.classList.toggle("current-active", parseInt(c.dataset.index, 10) === currentIdx);
    });
  }

  shiftOctave(delta) {
    const oct = this.engine.shiftOctave(delta);
    const display = document.getElementById("octaveDisplay");
    if (display) {
      display.textContent = `${oct >= 0 ? "+" : ""}${oct}`;
    }
    this.screen.render();
  }

  _handleMacroChange(macroIndex, val, norm) {
    const view = this.screen.currentView;

    if (view === "effects") {
      const fx = this.screen.selectedFx;
      if (fx === "filter") {
        if (macroIndex === 1) {
          const freq = 20 * Math.pow(18000 / 20, norm);
          this.engine.effects.setFilterParam("cutoff", freq);
        } else if (macroIndex === 2) {
          this.engine.effects.setFilterParam("resonance", 0.2 + norm * 19.8);
        } else if (macroIndex === 3) {
          const types = ["lowpass", "highpass", "bandpass"];
          this.engine.effects.setFilterParam("type", types[Math.min(2, Math.floor(norm * 3))]);
        } else if (macroIndex === 4) {
          this.engine.effects.setFilterParam("envAmount", norm);
        }
      } else if (fx === "distortion") {
        if (macroIndex === 1) this.engine.effects.setDistortionParam("drive", norm);
        else if (macroIndex === 2) this.engine.effects.setDistortionParam("tone", 200 + norm * 9800);
        else if (macroIndex === 4) this.engine.effects.setDistortionParam("mix", norm);
      } else if (fx === "chorus") {
        if (macroIndex === 1) this.engine.effects.setChorusParam("rate", 0.1 + norm * 6);
        else if (macroIndex === 2) this.engine.effects.setChorusParam("depth", norm);
        else if (macroIndex === 4) this.engine.effects.setChorusParam("mix", norm);
      } else if (fx === "phaser") {
        if (macroIndex === 1) this.engine.effects.setPhaserParam("rate", 0.05 + norm * 5);
        else if (macroIndex === 2) this.engine.effects.setPhaserParam("depth", norm);
        else if (macroIndex === 3) this.engine.effects.setPhaserParam("feedback", norm * 0.88);
        else if (macroIndex === 4) this.engine.effects.setPhaserParam("mix", norm);
      } else if (fx === "delay") {
        if (macroIndex === 1) this.engine.effects.setDelayParam("time", 0.03 + norm * 1.2);
        else if (macroIndex === 2) this.engine.effects.setDelayParam("feedback", norm * 0.88);
        else if (macroIndex === 3) this.engine.effects.setDelayParam("tone", 400 + norm * 9600);
        else if (macroIndex === 4) this.engine.effects.setDelayParam("mix", norm);
      } else if (fx === "reverb") {
        if (macroIndex === 1) this.engine.effects.setReverbParam("decay", 0.4 + norm * 5.0);
        else if (macroIndex === 4) this.engine.effects.setReverbParam("mix", norm);
      }
      this.screen.renderEffectsView();
    } else if (view === "envelope") {
      const op = this.engine.currentPatch.operators[this.screen.selectedOperator - 1];
      if (op) {
        if (macroIndex === 1) op.attack = Math.max(0.002, norm * 2.5);
        else if (macroIndex === 2) op.decay = Math.max(0.01, norm * 3.5);
        else if (macroIndex === 3) op.sustain = norm;
        else if (macroIndex === 4) op.release = Math.max(0.02, norm * 4.0);
      }
      this.screen.renderEnvelopeView();
    } else if (view === "operators") {
      const op = this.engine.currentPatch.operators[this.screen.selectedOperator - 1];
      if (op) {
        if (macroIndex === 1) {
          const ratios = [0.25, 0.5, 1, 1.414, 2, 2.828, 3, 3.5, 4, 5, 7, 8, 9, 12, 16];
          op.ratio = ratios[Math.min(ratios.length - 1, Math.floor(norm * ratios.length))];
        } else if (macroIndex === 2) {
          op.level = norm;
        } else if (macroIndex === 3) {
          op.detune = Math.round((norm - 0.5) * 50);
        } else if (macroIndex === 4) {
          op.feedback = norm;
        }
      }
      this.screen.renderOperatorsView();
    } else if (view === "sequencer") {
      if (macroIndex === 1) {
        const bpm = Math.round(50 + norm * 170);
        this.setBpm(bpm);
      }
    } else if (view === "drums") {
      if (macroIndex === 1) {
        // Kick Tune: 35 to 110 Hz
        const tune = 35 + norm * 75;
        this.engine.drums.setParam("kickTune", tune);
      } else if (macroIndex === 2) {
        // Snare Snap: 0.1 to 1.0
        this.engine.drums.setParam("snareSnap", 0.1 + norm * 0.9);
      } else if (macroIndex === 3) {
        // Hat Decay: 0.02 to 0.35s
        this.engine.drums.setParam("hatDecay", 0.02 + norm * 0.33);
      } else if (macroIndex === 4) {
        // Drum Bus Mix: 0 to 1.5
        this.engine.drums.setParam("drumMix", norm * 1.5);
      }
      this.screen.renderDrumsView();
    } else {
      // Default: Quick Master Tone & Filter
      if (macroIndex === 1) {
        const freq = 20 * Math.pow(18000 / 20, norm);
        this.engine.effects.setFilterParam("cutoff", freq);
      } else if (macroIndex === 2) {
        this.engine.effects.setFilterParam("resonance", 0.2 + norm * 19.8);
      } else if (macroIndex === 3) {
        this.engine.effects.setDistortionParam("drive", norm);
      } else if (macroIndex === 4) {
        this.engine.effects.setReverbParam("mix", norm);
      }
    }
  }

  updateKnobMappings() {
    const view = this.screen.currentView;
    const labels = ["MACRO 1", "MACRO 2", "MACRO 3", "MACRO 4"];
    const modeBadge = document.getElementById("macroModeBadge");

    if (view === "effects") {
      const fx = this.screen.selectedFx;
      if (modeBadge) modeBadge.textContent = `FX • ${fx.toUpperCase()}`;
      if (fx === "filter") labels[0] = "CUTOFF", labels[1] = "RES", labels[2] = "TYPE", labels[3] = "ENV";
      else if (fx === "delay") labels[0] = "TIME", labels[1] = "FEEDBK", labels[2] = "TONE", labels[3] = "MIX";
      else if (fx === "distortion") labels[0] = "DRIVE", labels[1] = "TONE", labels[2] = "CRV", labels[3] = "MIX";
      else if (fx === "chorus") labels[0] = "RATE", labels[1] = "DEPTH", labels[2] = "WIDTH", labels[3] = "MIX";
      else if (fx === "phaser") labels[0] = "RATE", labels[1] = "DEPTH", labels[2] = "FEEDBK", labels[3] = "MIX";
      else if (fx === "reverb") labels[0] = "DECAY", labels[1] = "DAMP", labels[2] = "PRE", labels[3] = "MIX";
    } else if (view === "envelope") {
      if (modeBadge) modeBadge.textContent = `ENV • OP${this.screen.selectedOperator}`;
      labels[0] = "ATTACK", labels[1] = "DECAY", labels[2] = "SUSTAIN", labels[3] = "RELEASE";
    } else if (view === "operators") {
      if (modeBadge) modeBadge.textContent = `OP • OP${this.screen.selectedOperator}`;
      labels[0] = "RATIO", labels[1] = "LEVEL", labels[2] = "DETUNE", labels[3] = "FEEDBK";
    } else if (view === "sequencer") {
      if (modeBadge) modeBadge.textContent = "SEQUENCER";
      labels[0] = "TEMPO", labels[1] = "VELOCITY", labels[2] = "GATE", labels[3] = "SWING";
      if (this.knobs.param1) {
        const norm = Math.max(0, Math.min(1, (this.sequencer.bpm - 50) / 170));
        this.knobs.param1.setValue(norm * 100, false);
      }
    } else if (view === "drums") {
      if (modeBadge) modeBadge.textContent = "DRUM BUS";
      labels[0] = "KICK TUNE", labels[1] = "SNARE SNAP", labels[2] = "HAT DECAY", labels[3] = "DRUM MIX";
    } else {
      if (modeBadge) modeBadge.textContent = "PERFORMANCE";
      labels[0] = "CUTOFF", labels[1] = "RESONANCE", labels[2] = "DRIVE", labels[3] = "REVERB";
    }

    for (let i = 1; i <= 4; i++) {
      const lbl = document.getElementById(`knobLabel${i}`);
      if (lbl) lbl.textContent = labels[i - 1];
    }
  }

  _initHeaderControls() {
    const themeBtn = document.getElementById("btnThemeToggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("light-theme");
        const isLight = document.body.classList.contains("light-theme");
        themeBtn.textContent = isLight ? "☀️ PORCELAIN" : "🌙 OBSIDIAN";
      });
    }

    const startAudioBtn = document.getElementById("btnStartAudio");
    if (startAudioBtn) {
      startAudioBtn.addEventListener("click", async () => {
        await this.engine.resume();
        startAudioBtn.innerHTML = "<span>🔊</span> AUDIO ACTIVE";
        startAudioBtn.classList.remove("btn-audio-wake");
      });
    }
  }

  _startVuMeter() {
    const vuL = document.getElementById("vuFillL");
    const vuR = document.getElementById("vuFillR");

    const updateVu = () => {
      requestAnimationFrame(updateVu);
      if (!this.engine.analyser || !vuL || !vuR) return;

      const buffer = new Uint8Array(this.engine.analyser.frequencyBinCount);
      this.engine.analyser.getByteTimeDomainData(buffer);

      // Compute RMS
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        const val = (buffer[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / buffer.length);
      const percent = Math.min(100, Math.round(rms * 400));

      vuL.style.height = `${Math.max(8, percent)}%`;
      vuR.style.height = `${Math.max(8, Math.round(percent * 0.95))}%`;
    };
    requestAnimationFrame(updateVu);
  }

  showToast(message, type = "success") {
    let toast = document.getElementById("neuToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "neuToast";
      toast.className = "neu-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `neu-toast visible ${type}`;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove("visible");
    }, 3500);
  }

  openFileModal() {
    const modal = document.getElementById("fileModalBackdrop");
    const nameInput = document.getElementById("inputExportFilename");
    if (nameInput) {
      nameInput.value = this.engine.currentPatch.name || "Custom_Preset";
    }
    if (modal) {
      modal.hidden = false;
      modal.style.display = "flex";
    }
  }

  closeFileModal() {
    const modal = document.getElementById("fileModalBackdrop");
    if (modal) {
      modal.hidden = true;
      modal.style.display = "none";
    }
  }

  exportPresetToFile(customName = null, includeGroove = true) {
    const patch = this.engine.getPatchSnapshot();
    const name = (customName && customName.trim()) || patch.name || "NeuSynth_Preset";
    patch.name = name;
    patch.format = "NeuSynth-Preset";
    patch.version = "1.0";
    patch.schemaVersion = 1;
    patch.exportedAt = new Date().toISOString();

    if (includeGroove && this.sequencer) {
      patch.groove = {
        bpm: this.sequencer.bpm,
        synth: this.sequencer.tracks.synth,
        drums: {
          kick: this.sequencer.tracks.kick,
          snare: this.sequencer.tracks.snare,
          hihat: this.sequencer.tracks.hihat,
          openhat: this.sequencer.tracks.openhat,
          clap: this.sequencer.tracks.clap,
          perc: this.sequencer.tracks.perc
        }
      };
    }

    const safeFilename = name.trim().replace(/[^a-zA-Z0-9_\-\s]/g, "").replace(/\s+/g, "_") + ".json";
    const jsonStr = JSON.stringify(patch, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast(`Saved "${safeFilename}" to your computer!`);
    this.closeFileModal();
  }

  exportBankToFile() {
    const current = this.engine.getPatchSnapshot();
    const bank = {
      format: "NeuSynth-Bank",
      version: "1.0",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      userPresets: this.engine.userPresets,
      currentPreset: current
    };
    const dateStr = new Date().toISOString().slice(0, 10);
    const safeFilename = `NeuSynth_Bank_Backup_${dateStr}.json`;
    const blob = new Blob([JSON.stringify(bank, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast(`Exported sound bank backup "${safeFilename}"!`);
    this.closeFileModal();
  }

  loadPresetFromData(data, sourceFilename = "") {
    if (!data || typeof data !== "object") {
      throw new Error("File content is not a valid JSON object");
    }

    // Sound bank restore
    if (data.format === "NeuSynth-Bank" && data.userPresets) {
      const count = Object.keys(data.userPresets).length;
      this.engine.userPresets = { ...this.engine.userPresets, ...data.userPresets };
      try {
        localStorage.setItem("neusynth_user_presets", JSON.stringify(this.engine.userPresets));
      } catch (e) {}
      if (data.currentPreset) {
        this.loadPresetFromData(data.currentPreset, "Restored Patch");
      }
      this.showToast(`Restored ${count} preset(s) to your Sound Library!`);
      this._renderPresetCards();
      this.closeFileModal();
      return true;
    }

    // Validate patch fields
    if (!data.operators && !data.algorithm && !data.format) {
      throw new Error("File is not a recognized NeuSynth patch");
    }

    const fallbackName = sourceFilename.replace(/\.json$/i, "").replace(/[_-]/g, " ") || "Custom Preset";
    const patchName = data.name || fallbackName;
    data.name = patchName;

    // Load into synth engine
    this.engine.loadCustomPatch(data);

    // If groove is included, load groove into sequencer & tempo
    if (data.groove) {
      this.sequencer.loadGroove(data.groove);
      if (data.groove.bpm) {
        this.setBpm(data.groove.bpm);
      }
      this.keyboard?._setupSequencerStrip();
    }

    // Refresh UI
    this.updatePresetDisplay();
    const algoNum = this.engine.currentPatch.algorithm || 1;
    if (this.knobs.algorithm) this.knobs.algorithm.setValue(algoNum, false);
    const algoBadge = document.getElementById("algoValue");
    const algoDisp = document.getElementById("algoNumberDisplay");
    if (algoBadge) algoBadge.textContent = `ALGO ${algoNum} / 8`;
    if (algoDisp) algoDisp.textContent = `#${algoNum}`;

    this.screen.render();
    this.updateKnobMappings();

    // Persist to user presets
    this.engine.saveUserPreset();
    this._renderPresetCards();

    this.showToast(`Loaded "${patchName}" from file!`);
    this.closeFileModal();
    return true;
  }

  _readAndLoadFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const data = JSON.parse(text);
        this.loadPresetFromData(data, file.name);
      } catch (err) {
        console.error("Preset load error:", err);
        this.showToast(`Failed to load: ${err.message}`, "error");
      }
    };
    reader.onerror = () => {
      this.showToast("Failed to read file from disk", "error");
    };
    reader.readAsText(file);
  }

  _initFileStorage() {
    const saveBtn = document.getElementById("btnSavePreset");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.openFileModal());
    }

    const closeBtn = document.getElementById("btnCloseFileModal");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeFileModal());
    }

    const modalBackdrop = document.getElementById("fileModalBackdrop");
    if (modalBackdrop) {
      modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) this.closeFileModal();
      });
    }

    // Download / Export button in modal
    const downloadBtn = document.getElementById("btnDownloadPresetFile");
    const nameInput = document.getElementById("inputExportFilename");
    const chkGroove = document.getElementById("chkIncludeGrooveInExport");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => {
        const name = nameInput ? nameInput.value : null;
        const incGroove = chkGroove ? chkGroove.checked : true;
        this.exportPresetToFile(name, incGroove);
      });
    }

    // Browse local file in modal
    const browseBtn = document.getElementById("btnBrowseLocalFile");
    const fileInput = document.getElementById("fileInputPreset");
    if (browseBtn && fileInput) {
      browseBtn.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) this._readAndLoadFile(file);
        fileInput.value = "";
      });
    }

    // Dropzone in modal
    const dropzone = document.getElementById("fileDropzone");
    if (dropzone) {
      dropzone.addEventListener("click", () => fileInput?.click());
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("drag-active");
      });
      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("drag-active");
      });
      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("drag-active");
        const file = e.dataTransfer?.files?.[0];
        if (file) this._readAndLoadFile(file);
      });
    }

    // Full bank backup & restore
    const exportBankBtn = document.getElementById("btnExportFullBank");
    if (exportBankBtn) {
      exportBankBtn.addEventListener("click", () => this.exportBankToFile());
    }

    const importBankBtn = document.getElementById("btnImportFullBank");
    const bankInput = document.getElementById("fileInputBank");
    if (importBankBtn && bankInput) {
      importBankBtn.addEventListener("click", () => bankInput.click());
      bankInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) this._readAndLoadFile(file);
        bankInput.value = "";
      });
    }

    // Quick File buttons in Preset Browser Modal
    const quickImportBtn = document.getElementById("btnQuickImportFile");
    const quickExportBtn = document.getElementById("btnQuickExportFile");
    const globalFileInput = document.getElementById("globalFileInputPreset");

    if (quickImportBtn && globalFileInput) {
      quickImportBtn.addEventListener("click", () => globalFileInput.click());
      globalFileInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) this._readAndLoadFile(file);
        globalFileInput.value = "";
      });
    }

    if (quickExportBtn) {
      quickExportBtn.addEventListener("click", () => {
        this.exportPresetToFile(this.engine.currentPatch.name || "NeuSynth_Preset", true);
      });
    }

    // Full Window Drag and Drop
    const overlay = document.getElementById("windowDropOverlay");
    let dragCounter = 0;

    window.addEventListener("dragenter", (e) => {
      e.preventDefault();
      dragCounter++;
      if (overlay) overlay.classList.add("active");
    });

    window.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    window.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0 && overlay) {
        dragCounter = 0;
        overlay.classList.remove("active");
      }
    });

    window.addEventListener("drop", (e) => {
      e.preventDefault();
      dragCounter = 0;
      if (overlay) overlay.classList.remove("active");
      const file = e.dataTransfer?.files?.[0];
      if (file && (file.name.endsWith(".json") || file.type.includes("json"))) {
        this._readAndLoadFile(file);
      }
    });

    // ESC to close file modal
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeFileModal();
      }
    });
  }
}

// Instantiate on DOM load
window.addEventListener("DOMContentLoaded", () => {
  window.neuSynth = new NeuSynthApp();
});
