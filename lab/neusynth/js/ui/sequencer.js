/**
 * 16-Step Multi-Track Sequencer and Arpeggiator
 * Supports:
 * - Synth track with melodic note sequences & Arpeggiator
 * - 6 Drum tracks: Kick, Snare, Hi-Hat, Open Hat, Clap, Perc
 * - Concurrent sample-accurate lookahead scheduling via Web Audio clock
 * - Global tempo BPM, swing, velocity, and gate length
 */

export const ARP_MODES = ["up", "down", "updown", "random"];

export const DRUM_VOICES = ["kick", "snare", "hihat", "openhat", "clap", "perc"];

export class Sequencer {
  constructor(engine) {
    this.engine = engine;
    this.bpm = 124;
    this.isPlaying = false;
    this.isRecording = false;
    this.mode = "seq"; // "seq" | "arp"
    this.arpMode = "up";
    this.velocity = 1.0;
    this.gate = 0.75;
    this.swing = 0.15; // subtle groove swing

    this.currentTrack = "synth"; // "synth" | "kick" | "snare" | "hihat" | "openhat" | "clap" | "perc"

    // Multi-track pattern storage
    this.tracks = {
      synth: this._createSynthTrack(),
      kick: this._createDrumTrack([0, 4, 8, 12]),          // 4-on-the-floor
      snare: this._createDrumTrack([4, 12]),               // 2 & 4 backbeat
      hihat: this._createDrumTrack([0, 2, 4, 6, 8, 10, 12, 14]), // 8th notes
      openhat: this._createDrumTrack([2, 10]),             // Offbeats
      clap: this._createDrumTrack([12]),                  // Accent
      perc: this._createDrumTrack([6, 14])                 // Syncopated tom
    };

    // Keep backwards-compatible pointer to synth steps
    this.steps = this.tracks.synth;

    this.currentStep = -1;
    this.playheadStep = -1;
    this.stepRecordIndex = 0;

    this.lookahead = 25.0; // ms
    this.scheduleAheadTime = 0.1; // seconds
    this.nextNoteTime = 0.0;
    this.clockTimerId = null;

    this.arpNotes = [];
    this.arpIndex = 0;

    this.onStep = null; // (stepIndex, isPlaying, activeDrums)
    this.onPlayStateChange = null; // (isPlaying)
    this.onRecordStepChange = null; // (stepRecordIndex)
  }

  _createSynthTrack() {
    const defaultPitches = [60, 60, 63, 65, 67, 65, 63, 60, 72, 70, 67, 65, 63, 65, 67, 60];
    const steps = [];
    for (let i = 0; i < 16; i++) {
      steps.push({
        active: i % 2 === 0 || i === 7 || i === 15,
        note: defaultPitches[i] ?? 60,
        velocity: 0.9
      });
    }
    return steps;
  }

  _createDrumTrack(activeSteps = []) {
    const steps = [];
    for (let i = 0; i < 16; i++) {
      steps.push({
        active: activeSteps.includes(i),
        velocity: i % 4 === 0 ? 1.0 : 0.85
      });
    }
    return steps;
  }

  setTrack(trackName) {
    if (this.tracks[trackName]) {
      this.currentTrack = trackName;
      this.steps = this.tracks[trackName];
      return true;
    }
    return false;
  }

  loadGroove(grooveData) {
    if (!grooveData) return;
    if (grooveData.bpm) {
      this.setBpm(grooveData.bpm);
    }
    if (grooveData.synth && Array.isArray(grooveData.synth)) {
      this.tracks.synth = grooveData.synth.map((s) => ({ ...s }));
    }
    if (grooveData.drums) {
      for (const dVoice of DRUM_VOICES) {
        if (grooveData.drums[dVoice] && Array.isArray(grooveData.drums[dVoice])) {
          this.tracks[dVoice] = grooveData.drums[dVoice].map((s) => ({ ...s }));
        }
      }
    }
    this.steps = this.tracks[this.currentTrack] || this.tracks.synth;

    // If sequencer is actively running, cleanly align scheduling to step 0
    if (this.isPlaying && this.engine?.ctx) {
      this.engine.allNotesOff(true);
      this.currentStep = -1;
      this.playheadStep = -1;
      this.arpIndex = 0;
      this.nextNoteTime = this.engine.ctx.currentTime + 0.02;
    }
  }

  getCurrentTrackSteps() {
    return this.tracks[this.currentTrack] || this.tracks.synth;
  }

  secondsPerStep() {
    return 60.0 / this.bpm / 4.0;
  }

  setBpm(val) {
    this.bpm = Math.max(40, Math.min(260, Math.round(val)));
  }

  setVelocity(val) {
    this.velocity = Math.max(0, Math.min(1, val));
  }

  setGate(val) {
    this.gate = Math.max(0.05, Math.min(1, val));
  }

  setSwing(val) {
    this.swing = Math.max(0, Math.min(1, val));
  }

  setArpMode(mode) {
    if (ARP_MODES.includes(mode)) this.arpMode = mode;
  }

  cycleArpMode() {
    const idx = ARP_MODES.indexOf(this.arpMode);
    this.arpMode = ARP_MODES[(idx + 1) % ARP_MODES.length];
    return this.arpMode;
  }

  toggleStep(index, track = this.currentTrack) {
    const t = this.tracks[track];
    if (!t || !t[index]) return false;
    t[index].active = !t[index].active;
    return t[index].active;
  }

  togglePlay() {
    if (this.isPlaying) this.stop();
    else this.play();
  }

  play() {
    if (this.isPlaying) return;
    const ctx = this.engine.ctx;
    if (!ctx) return;
    this.engine.resume();
    this.isPlaying = true;
    this.currentStep = -1;
    this.playheadStep = -1;
    this.arpIndex = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;

    this.clockTimerId = setInterval(() => this._scheduler(), this.lookahead);
    if (this.onPlayStateChange) this.onPlayStateChange(true);
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.clockTimerId) {
      clearInterval(this.clockTimerId);
      this.clockTimerId = null;
    }
    this.currentStep = -1;
    this.playheadStep = -1;
    this.engine.releaseSequencerVoices();
    if (this.onStep) this.onStep(-1, false, []);
    if (this.onPlayStateChange) this.onPlayStateChange(false);
  }

  toggleRecord() {
    this.isRecording = !this.isRecording;
    if (this.isRecording && this.stepRecordIndex >= 16) {
      this.stepRecordIndex = 0;
    }
    if (this.onRecordStepChange) this.onRecordStepChange(this.stepRecordIndex);
    return this.isRecording;
  }

  setRecordStep(stepIndex) {
    this.stepRecordIndex = Math.max(0, Math.min(15, Math.floor(stepIndex)));
    if (this.onRecordStepChange) this.onRecordStepChange(this.stepRecordIndex);
    return this.stepRecordIndex;
  }

  skipStep(asRest = true) {
    const idx = this.stepRecordIndex;
    const synthStep = this.tracks.synth[idx];
    if (asRest && synthStep) {
      synthStep.active = false;
    }
    this.stepRecordIndex = (idx + 1) % 16;
    if (this.onRecordStepChange) this.onRecordStepChange(this.stepRecordIndex);
    return this.stepRecordIndex;
  }

  nextRecordStep() {
    this.stepRecordIndex = (this.stepRecordIndex + 1) % 16;
    if (this.onRecordStepChange) this.onRecordStepChange(this.stepRecordIndex);
    return this.stepRecordIndex;
  }

  prevRecordStep() {
    this.stepRecordIndex = (this.stepRecordIndex - 1 + 16) % 16;
    if (this.onRecordStepChange) this.onRecordStepChange(this.stepRecordIndex);
    return this.stepRecordIndex;
  }

  clearRecordStep() {
    const idx = this.stepRecordIndex;
    const synthStep = this.tracks.synth[idx];
    if (synthStep) {
      synthStep.active = false;
    }
    if (this.onRecordStepChange) this.onRecordStepChange(this.stepRecordIndex);
    return this.stepRecordIndex;
  }

  recordNote(midiNote) {
    if (!this.isRecording) return -1;
    const idx = this.isPlaying && this.playheadStep >= 0 ? this.playheadStep : this.stepRecordIndex;
    const synthSteps = this.tracks.synth;
    if (synthSteps[idx]) {
      synthSteps[idx].note = midiNote;
      synthSteps[idx].active = true;
    }
    if (!this.isPlaying) {
      this.stepRecordIndex = (idx + 1) % 16;
      if (this.onRecordStepChange) this.onRecordStepChange(this.stepRecordIndex);
    }
    return idx;
  }

  _scheduler() {
    const ctx = this.engine.ctx;
    if (!ctx) return;
    while (this.nextNoteTime < ctx.currentTime + this.scheduleAheadTime) {
      this._scheduleStep(this.nextNoteTime);
      this._advanceStep();
    }
  }

  _advanceStep() {
    this.nextNoteTime += this.secondsPerStep();
    this.currentStep = (this.currentStep + 1) % 16;
  }

  _scheduleStep(time) {
    const stepIdx = (this.currentStep + 1) % 16;
    const stepLen = this.secondsPerStep();
    // Swing pushes every off-beat 16th late by up to half a step
    const t = time + (stepIdx % 2 === 1 ? this.swing * stepLen * 0.5 : 0);

    // Collect which drum voices trigger on this step for UI flashing
    const activeDrumsOnStep = [];
    for (const dVoice of DRUM_VOICES) {
      if (this.tracks[dVoice] && this.tracks[dVoice][stepIdx]?.active) {
        activeDrumsOnStep.push(dVoice);
      }
    }

    const delay = Math.max(0, (t - this.engine.ctx.currentTime) * 1000);
    setTimeout(() => {
      if (!this.isPlaying) return;
      this.playheadStep = stepIdx;
      if (this.onStep) this.onStep(stepIdx, true, activeDrumsOnStep);
    }, delay);

    // 1. Schedule Synth Track / Arp
    const duration = Math.max(0.02, stepLen * this.gate);
    if (this.mode === "arp") {
      const note = this._nextArpNote();
      if (note !== null) {
        this.engine.playNote(note, 0.9 * this.velocity, t, duration);
      }
    } else {
      const step = this.tracks.synth[stepIdx];
      if (step && step.active) {
        this.engine.playNote(step.note, step.velocity * this.velocity, t, duration);
      }
    }

    // 2. Schedule All 6 Drum Voices Concurrently
    for (const dVoice of DRUM_VOICES) {
      const dStep = this.tracks[dVoice]?.[stepIdx];
      if (dStep && dStep.active) {
        this.engine.triggerDrum(dVoice, dStep.velocity * this.velocity, t);
      }
    }
  }

  _nextArpNote() {
    const notes = this.arpNotes;
    const n = notes.length;
    if (n === 0) return null;
    if (n === 1) return notes[0];

    let note;
    switch (this.arpMode) {
      case "down":
        note = notes[n - 1 - (this.arpIndex % n)];
        break;
      case "updown": {
        const cycle = 2 * n - 2;
        const i = this.arpIndex % cycle;
        note = i < n ? notes[i] : notes[cycle - i];
        break;
      }
      case "random":
        note = notes[Math.floor(Math.random() * n)];
        break;
      default:
        note = notes[this.arpIndex % n];
    }
    this.arpIndex++;
    return note;
  }

  setArpNotes(notes) {
    this.arpNotes = [...notes].sort((a, b) => a - b);
    if (this.arpNotes.length === 0) this.arpIndex = 0;
  }
}
