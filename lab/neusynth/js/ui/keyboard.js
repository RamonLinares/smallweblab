/**
 * Pro 25-Key Piano Keyboard & 16-Step Sequencer Strip Controller
 * Provides:
 * - 16-step sequencer strip with interactive toggle pads and chase LED lighting
 * - 25-key Neumorphic piano keyboard (2 full octaves: C3 to C5) with illuminated light-pipes
 * - Touch & mouse glissando swipe
 * - Computer QWERTY keyboard integration
 * - Web MIDI hardware auto-detection
 */

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function midiToNoteName(midi) {
  if (midi == null || isNaN(midi) || midi < 0) return "—";
  const name = NOTE_NAMES[midi % 12];
  const oct = Math.floor(midi / 12) - 2;
  return `${name}${oct}`;
}

export class SynthKeyboard {
  constructor(engine, app) {
    this.engine = engine;
    this.app = app;
    this.heldMidiNotes = new Set();
    this.isMouseDown = false;
    this.isHoldActive = false;

    // 15 White Keys (C3 to C5)
    this.whiteKeys = [
      { midi: 60, note: "C3", key: "A" },
      { midi: 62, note: "D3", key: "S" },
      { midi: 64, note: "E3", key: "D" },
      { midi: 65, note: "F3", key: "F" },
      { midi: 67, note: "G3", key: "G" },
      { midi: 69, note: "A3", key: "H" },
      { midi: 71, note: "B3", key: "J" },
      { midi: 72, note: "C4", key: "K" },
      { midi: 74, note: "D4", key: "L" },
      { midi: 76, note: "E4", key: ";" },
      { midi: 77, note: "F4", key: "'" },
      { midi: 79, note: "G4", key: "" },
      { midi: 81, note: "A4", key: "" },
      { midi: 83, note: "B4", key: "" },
      { midi: 84, note: "C5", key: "" }
    ];

    // 10 Black Keys (Accidentals)
    this.blackKeys = [
      { midi: 61, note: "C#3", key: "W", left: "4.6%" },
      { midi: 63, note: "D#3", key: "E", left: "11.3%" },
      { midi: 66, note: "F#3", key: "T", left: "24.6%" },
      { midi: 68, note: "G#3", key: "Y", left: "31.3%" },
      { midi: 70, note: "A#3", key: "U", left: "38.0%" },
      { midi: 73, note: "C#4", key: "O", left: "51.3%" },
      { midi: 75, note: "D#4", key: "P", left: "58.0%" },
      { midi: 78, note: "F#4", key: "", left: "71.3%" },
      { midi: 80, note: "G#4", key: "", left: "78.0%" },
      { midi: 82, note: "A#4", key: "", left: "84.6%" }
    ];

    // QWERTY Key mappings
    this.qwertyMap = {
      "KeyA": 60, "KeyW": 61, "KeyS": 62, "KeyE": 63, "KeyD": 64,
      "KeyF": 65, "KeyT": 66, "KeyG": 67, "KeyY": 68, "KeyH": 69,
      "KeyU": 70, "KeyJ": 71, "KeyK": 72, "KeyO": 73, "KeyL": 74,
      "KeyP": 75, "Semicolon": 76, "Quote": 77
    };

    this._setupTrackTabs();
    this._setupSequencerStrip();
    this._setupDrumPads();
    this._setupPianoKeys();
    this._setupWingsAndMod();
    this._attachMouseAndTouch();
    this._attachComputerKeyboard();
    this._setupWebMidi();

    if (this.app?.sequencer) {
      this.app.sequencer.onRecordStepChange = () => {
        this.updateRecCursor();
      };
    }
  }

  _setupTrackTabs() {
    const tabBtns = document.querySelectorAll(".seq-track-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const track = btn.dataset.track;
        if (this.app?.sequencer) {
          this.app.sequencer.setTrack(track);
          tabBtns.forEach((b) => b.classList.toggle("active", b.dataset.track === track));
          const badge = document.getElementById("seqTrackBadge");
          if (badge) badge.textContent = `TRACK: ${track.toUpperCase()}`;
          this._setupSequencerStrip();
          if (this.app.screen?.currentView === "sequencer") {
            this.app.screen.renderSequencerView();
          } else if (this.app.screen?.currentView === "drums") {
            this.app.screen.renderDrumsView();
          }
        }
      });
    });
  }

  _setupSequencerStrip() {
    const stripGrid = document.getElementById("seqStripGrid");
    if (!stripGrid) return;

    const currentSteps = this.app?.sequencer?.getCurrentTrackSteps() || [];
    const isSynth = !this.app?.sequencer || this.app.sequencer.currentTrack === "synth";
    const isRecording = Boolean(this.app?.sequencer?.isRecording);
    const recIndex = this.app?.sequencer?.stepRecordIndex ?? 0;

    stripGrid.innerHTML = "";
    for (let i = 0; i < 16; i++) {
      const step = currentSteps[i];
      const pad = document.createElement("div");
      const isRecCur = isRecording && i === recIndex;
      pad.className = `seq-step-pad ${step?.active ? 'active' : ''} ${isRecCur ? 'rec-cursor' : ''}`;
      pad.dataset.step = i;

      let noteText = "—";
      if (isSynth) {
        noteText = (step && step.active && step.note !== undefined) ? midiToNoteName(step.note) : "—";
      } else {
        noteText = step?.active ? "TRIG" : "—";
      }

      pad.innerHTML = `
        <span class="step-number">${i + 1}</span>
        <span class="step-note-name">${noteText}</span>
        <div class="step-indicator-led"></div>
      `;

      pad.addEventListener("click", () => {
        if (this.app?.sequencer?.isRecording) {
          // If already on this step, toggle active state (toggle rest / note)
          if (this.app.sequencer.stepRecordIndex === i && step) {
            step.active = !step.active;
          } else {
            // Jump recording cursor to clicked step
            this.app.sequencer.setRecordStep(i);
          }
        } else {
          if (step) {
            step.active = !step.active;
          }
        }
        this.updateRecCursor();
        if (this.app.screen?.currentView === "sequencer") {
          this.app.screen.renderSequencerView();
        } else if (this.app.screen?.currentView === "drums") {
          this.app.screen.renderDrumsView();
        }
      });

      stripGrid.appendChild(pad);
    }

    this.updateRecCursor();
  }

  updateRecCursor() {
    const isRec = Boolean(this.app?.sequencer?.isRecording);
    const recControls = document.getElementById("seqRecControls");
    const recBadge = document.getElementById("seqRecBadge");
    const recBtn = document.getElementById("btnRecToggle");

    if (recBtn) {
      recBtn.classList.toggle("active", isRec);
    }

    if (recControls) {
      recControls.style.display = isRec ? "flex" : "none";
    }

    const currentStepIdx = this.app?.sequencer?.stepRecordIndex ?? 0;
    const isSynth = !this.app?.sequencer || this.app.sequencer.currentTrack === "synth";
    const currentSteps = this.app?.sequencer?.getCurrentTrackSteps() || [];
    const currentStepObj = currentSteps[currentStepIdx];

    if (recBadge && isRec) {
      let noteStr = "REST (—)";
      if (isSynth) {
        noteStr = (currentStepObj && currentStepObj.active && currentStepObj.note !== undefined)
          ? midiToNoteName(currentStepObj.note)
          : "REST (—)";
      } else {
        noteStr = currentStepObj?.active ? "TRIG" : "REST (—)";
      }
      recBadge.textContent = `● REC STEP ${currentStepIdx + 1}: ${noteStr}`;
    }

    // Synchronize all pads: .rec-cursor, .active, and note labels
    document.querySelectorAll(".seq-step-pad").forEach((pad) => {
      const stepIdx = parseInt(pad.dataset.step, 10);
      const step = currentSteps[stepIdx];

      // Highlight active REC cursor
      if (isRec && stepIdx === currentStepIdx) {
        pad.classList.add("rec-cursor");
      } else {
        pad.classList.remove("rec-cursor");
      }

      // Step active state
      pad.classList.toggle("active", Boolean(step?.active));

      // Note label
      const noteEl = pad.querySelector(".step-note-name");
      if (noteEl && step) {
        if (isSynth) {
          noteEl.textContent = (step.active && step.note !== undefined) ? midiToNoteName(step.note) : "—";
        } else {
          noteEl.textContent = step.active ? "TRIG" : "—";
        }
      }
    });

    if (this.app?.screen?.currentView === "sequencer") {
      this.app.screen.renderSequencerView();
    }
  }

  _setupDrumPads() {
    const pads = document.querySelectorAll(".drum-pad-btn");
    pads.forEach((pad) => {
      const drumVoice = pad.dataset.drum;
      const handleTrigger = (e) => {
        e.preventDefault();
        this.triggerDrumPad(drumVoice, pad);
      };
      pad.addEventListener("pointerdown", handleTrigger);
    });
  }

  triggerDrumPad(drumVoice, padEl = null, velocity = 0.95) {
    this.engine.resume();
    this.engine.triggerDrum(drumVoice, velocity);
    if (!padEl) {
      padEl = document.querySelector(`.drum-pad-btn[data-drum="${drumVoice}"]`);
    }
    if (padEl) {
      padEl.classList.add("triggered");
      setTimeout(() => padEl.classList.remove("triggered"), 120);
    }
  }

  _setupPianoKeys() {
    const whiteContainer = document.getElementById("whiteKeysLayer");
    const blackContainer = document.getElementById("blackKeysLayer");

    // Build White Keys
    if (whiteContainer) {
      whiteContainer.innerHTML = "";
      this.whiteKeys.forEach((k) => {
        const keyEl = document.createElement("div");
        keyEl.className = "white-key";
        keyEl.dataset.midi = k.midi;
        keyEl.innerHTML = `
          <div class="key-slit"></div>
          <span class="key-label-note">${k.note}</span>
          ${k.key ? `<span class="key-label-kbd">${k.key}</span>` : ""}
        `;
        whiteContainer.appendChild(keyEl);
      });
    }

    // Build Black Keys
    if (blackContainer) {
      blackContainer.innerHTML = "";
      this.blackKeys.forEach((k) => {
        const keyEl = document.createElement("div");
        keyEl.className = "black-key";
        keyEl.dataset.midi = k.midi;
        keyEl.style.left = k.left;
        keyEl.innerHTML = `
          <div class="key-slit"></div>
          <span class="key-label-note">${k.note}</span>
          ${k.key ? `<span class="key-label-kbd">${k.key}</span>` : ""}
        `;
        blackContainer.appendChild(keyEl);
      });
    }
  }

  _setupWingsAndMod() {
    // OP1 - OP6 wing buttons
    document.querySelectorAll(".op-wing-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const opNum = parseInt(btn.dataset.op, 10);
        if (this.app?.screen) {
          this.app.screen.selectedOperator = opNum;
          if (["envelope", "operators"].includes(this.app.screen.currentView)) {
            this.app.screen.render();
          } else {
            this.app.screen.setView("operators");
          }
        }
      });
    });

    // Glide toggle
    const glideBtn = document.getElementById("btnGlideToggle");
    if (glideBtn) {
      glideBtn.addEventListener("click", () => {
        const isGlide = this.engine.glide > 0;
        this.engine.glide = isGlide ? 0 : 0.06;
        glideBtn.classList.toggle("active", !isGlide);
      });
    }

    // Hold toggle
    const holdBtn = document.getElementById("btnHoldToggle");
    if (holdBtn) {
      holdBtn.addEventListener("click", () => {
        this.isHoldActive = !this.isHoldActive;
        holdBtn.classList.toggle("active", this.isHoldActive);
        if (!this.isHoldActive) {
          this.releaseAllHeldNotes();
        }
      });
    }

    // Performance Modulation Strip (Mod Wheel for Filter Cutoff / Brightness)
    const modStrip = document.getElementById("modStrip");
    const modThumb = document.getElementById("modStripThumb");
    const modFill = document.getElementById("modStripFill");

    if (modStrip && modThumb) {
      let isDragging = false;
      const thumbHeight = 20;
      const topPadding = 4;
      const bottomPadding = 4;

      this.updateModWheel = (norm) => {
        norm = Math.max(0, Math.min(1, norm));
        const rect = modStrip.getBoundingClientRect();
        const height = rect.height > 0 ? rect.height : 96;
        const maxTravel = height - thumbHeight - topPadding - bottomPadding;
        const currentY = Math.round((1 - norm) * maxTravel);

        modThumb.style.transform = `translateY(${currentY}px)`;
        if (modFill) {
          modFill.style.height = `${Math.round(norm * 100)}%`;
        }

        // Modulate Filter Cutoff (musically sweeping from warm/deep to wide-open harmonic brilliance)
        const baseCutoff = this.engine.currentPatch?.filter?.cutoff || 3500;
        const modCutoff = Math.min(20000, Math.max(60, baseCutoff * Math.pow(2.2, (norm - 0.5) * 3.5)));
        this.engine.effects.setFilterParam("cutoff", modCutoff);
      };

      const handlePointer = (e) => {
        const rect = modStrip.getBoundingClientRect();
        const maxTravel = rect.height - thumbHeight - topPadding - bottomPadding;
        if (maxTravel <= 0) return;

        const rawOffset = e.clientY - rect.top - topPadding - (thumbHeight / 2);
        const clampedOffset = Math.max(0, Math.min(maxTravel, rawOffset));
        const norm = 1 - (clampedOffset / maxTravel);
        this.updateModWheel(norm);
      };

      modStrip.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        this.engine.resume();
        isDragging = true;
        try {
          modStrip.setPointerCapture(e.pointerId);
        } catch (_) {}
        handlePointer(e);
      });

      modStrip.addEventListener("pointermove", (e) => {
        if (!isDragging) return;
        handlePointer(e);
      });

      const stopDrag = (e) => {
        if (!isDragging) return;
        isDragging = false;
        try {
          modStrip.releasePointerCapture(e.pointerId);
        } catch (_) {}
      };

      modStrip.addEventListener("pointerup", stopDrag);
      modStrip.addEventListener("pointercancel", stopDrag);

      // Double-click resets to neutral middle
      modStrip.addEventListener("dblclick", () => {
        this.updateModWheel(0.5);
      });

      // Initialize at neutral position
      setTimeout(() => this.updateModWheel(0.5), 60);
    }
  }

  _attachMouseAndTouch() {
    const handleDown = (el) => {
      this.engine.resume();
      const midi = parseInt(el.dataset.midi, 10);
      if (!isNaN(midi)) {
        this.triggerNoteOn(midi, el);
      }
    };

    const handleUp = (el) => {
      if (this.isHoldActive) return;
      const midi = parseInt(el.dataset.midi, 10);
      if (!isNaN(midi)) {
        this.triggerNoteOff(midi, el);
      }
    };

    window.addEventListener("mouseup", () => {
      if (this.isMouseDown) {
        this.isMouseDown = false;
        if (!this.isHoldActive) {
          this.releaseAllHeldNotes();
        }
      }
    });

    const allKeys = document.querySelectorAll(".white-key, .black-key");
    allKeys.forEach((key) => {
      key.addEventListener("mousedown", (e) => {
        this.isMouseDown = true;
        handleDown(key);
      });

      key.addEventListener("mouseenter", () => {
        if (this.isMouseDown) {
          handleDown(key);
        }
      });

      key.addEventListener("mouseleave", () => {
        if (this.isMouseDown) {
          handleUp(key);
        }
      });

      key.addEventListener("mouseup", () => {
        handleUp(key);
      });

      // Touch
      key.addEventListener("touchstart", (e) => {
        e.preventDefault();
        handleDown(key);
      }, { passive: false });

      key.addEventListener("touchend", (e) => {
        e.preventDefault();
        handleUp(key);
      }, { passive: false });
    });
  }

  _attachComputerKeyboard() {
    window.addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.repeat) return;

      // Drum Hotkeys 1-6
      const drumKeys = {
        "Digit1": "kick",
        "Digit2": "snare",
        "Digit3": "hihat",
        "Digit4": "openhat",
        "Digit5": "clap",
        "Digit6": "perc"
      };

      if (drumKeys[e.code]) {
        e.preventDefault();
        this.triggerDrumPad(drumKeys[e.code]);
        return;
      }

      const midi = this.qwertyMap[e.code];
      if (midi !== undefined) {
        const el = document.querySelector(`.white-key[data-midi="${midi}"], .black-key[data-midi="${midi}"]`);
        this.triggerNoteOn(midi, el);
      }

      // Step-recording keyboard shortcuts (Right/Tab = rest/skip, Left = prev, Delete/Backspace = clear)
      if (this.app?.sequencer?.isRecording) {
        if (e.code === "ArrowRight" || e.code === "Tab") {
          e.preventDefault();
          this.app.sequencer.skipStep(true);
          return;
        } else if (e.code === "ArrowLeft") {
          e.preventDefault();
          this.app.sequencer.prevRecordStep();
          return;
        } else if (e.code === "Delete" || e.code === "Backspace") {
          e.preventDefault();
          this.app.sequencer.clearRecordStep();
          return;
        }
      }

      if (e.code === "KeyZ") {
        this.app?.shiftOctave(-1);
      } else if (e.code === "KeyX") {
        this.app?.shiftOctave(1);
      } else if (e.code === "Space") {
        e.preventDefault();
        this.app?.sequencer?.togglePlay();
      }
    });

    window.addEventListener("keyup", (e) => {
      if (this.isHoldActive) return;
      const midi = this.qwertyMap[e.code];
      if (midi !== undefined) {
        const el = document.querySelector(`.white-key[data-midi="${midi}"], .black-key[data-midi="${midi}"]`);
        this.triggerNoteOff(midi, el);
      }
    });
  }

  _setupWebMidi() {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(
        (midiAccess) => {
          this._initMidiInputs(midiAccess);
          midiAccess.onstatechange = () => this._initMidiInputs(midiAccess);
        },
        () => console.log("Web MIDI access declined or unavailable")
      );
    }
  }

  _initMidiInputs(midiAccess) {
    for (let input of midiAccess.inputs.values()) {
      input.onmidimessage = (msg) => this._handleMidiMessage(msg);
    }
  }

  _handleMidiMessage(event) {
    const [command, note, velocity] = event.data;
    const cmd = command >> 4;

    if (cmd === 9 && velocity > 0) {
      // Note On
      const el = document.querySelector(`.white-key[data-midi="${note}"], .black-key[data-midi="${note}"]`);
      this.triggerNoteOn(note, el, velocity / 127);
    } else if (cmd === 8 || (cmd === 9 && velocity === 0)) {
      // Note Off
      const el = document.querySelector(`.white-key[data-midi="${note}"], .black-key[data-midi="${note}"]`);
      this.triggerNoteOff(note, el);
    } else if (cmd === 14) {
      // Pitch Bend
      const val = (event.data[2] << 7) + event.data[1];
      const norm = (val - 8192) / 8192;
      for (let voice of this.engine.voices) {
        for (let op of voice.ops) {
          op.osc.detune.setValueAtTime(norm * 200, this.engine.ctx.currentTime);
        }
      }
    } else if (cmd === 11 && note === 1) {
      // CC 1: Hardware Modulation Wheel
      this.updateModWheel?.(velocity / 127);
    }
  }

  triggerNoteOn(midi, el, velocity = 0.95) {
    this.engine.resume();
    this.engine.noteOn(midi, velocity);
    this.heldMidiNotes.add(midi);

    // Record into sequencer if REC active
    if (this.app?.sequencer?.isRecording) {
      this.app.sequencer.recordNote(midi);
      this.updateRecCursor();
      if (this.app.screen?.currentView === "sequencer") {
        this.app.screen.renderSequencerView();
      }
    }

    if (this.app?.sequencer?.mode === "arp") {
      this.app.sequencer.setArpNotes(Array.from(this.heldMidiNotes));
    }

    if (el) {
      el.classList.add("pressed");
    }
  }

  triggerNoteOff(midi, el) {
    this.engine.noteOff(midi);
    this.heldMidiNotes.delete(midi);

    if (this.app?.sequencer?.mode === "arp") {
      this.app.sequencer.setArpNotes(Array.from(this.heldMidiNotes));
    }

    if (el) {
      el.classList.remove("pressed");
    }
  }

  releaseAllHeldNotes() {
    for (let midi of this.heldMidiNotes) {
      this.engine.noteOff(midi);
    }
    this.heldMidiNotes.clear();
    document.querySelectorAll(".white-key.pressed, .black-key.pressed").forEach((k) => {
      k.classList.remove("pressed");
    });
  }

  highlightStep(stepIndex, isPlaying, activeDrums = []) {
    // 1. Highlight in Sequencer Strip
    document.querySelectorAll(".seq-step-pad.chase").forEach((p) => {
      p.classList.remove("chase");
    });

    if (isPlaying && stepIndex >= 0 && stepIndex < 16) {
      const pad = document.querySelector(`.seq-step-pad[data-step="${stepIndex}"]`);
      if (pad) {
        pad.classList.add("chase");
      }

      // 2. Highlight corresponding note on piano keyboard (for synth track)
      const synthStep = this.app?.sequencer?.tracks?.synth?.[stepIndex];
      if (synthStep && synthStep.active) {
        document.querySelectorAll(".white-key.seq-lit, .black-key.seq-lit").forEach(k => k.classList.remove("seq-lit"));
        const keyEl = document.querySelector(`.white-key[data-midi="${synthStep.note}"], .black-key[data-midi="${synthStep.note}"]`);
        if (keyEl) {
          keyEl.classList.add("seq-lit");
          setTimeout(() => keyEl.classList.remove("seq-lit"), 180);
        }
      }

      // 3. Highlight drum pads for voices triggering on this step
      if (activeDrums && activeDrums.length > 0) {
        for (const dVoice of activeDrums) {
          const drumPad = document.querySelector(`.drum-pad-btn[data-drum="${dVoice}"]`);
          if (drumPad) {
            drumPad.classList.add("triggered");
            setTimeout(() => drumPad.classList.remove("triggered"), 100);
          }
        }
      }
    }
  }
}
