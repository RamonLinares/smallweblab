import { FM_ALGORITHMS } from "./algorithms.js";
import { SynthEffects } from "./effects.js";
import { SYNTH_PRESETS } from "./presets.js";
import { DrumEngine } from "./drums.js";

const USER_PRESETS_KEY = "neusynth_user_presets";
const LEGACY_PATCH_KEY = "neusynth_custom_patch";

export const DEFAULT_OPERATOR = Object.freeze({
  ratio: 1, detune: 0, level: 0.5, attack: 0.01, decay: 0.5, sustain: 0.5, release: 0.5, feedback: 0
});
export const DEFAULT_LFO = Object.freeze({ rate: 2.4, depth: 0, shape: "sine", dest: "pitch" });

const clone = (o) => JSON.parse(JSON.stringify(o));

/**
 * Evaluate a piecewise-linear envelope (array of [time, value]) at time t.
 * Used to know where an envelope currently sits so we can hold it without clicks
 * on browsers that lack AudioParam.cancelAndHoldAtTime.
 */
function envValueAt(points, t) {
  if (!points || points.length === 0) return 0;
  if (t <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [t1, v1] = points[i];
    if (t <= t1) {
      const [t0, v0] = points[i - 1];
      const f = (t - t0) / Math.max(1e-6, t1 - t0);
      return v0 + (v1 - v0) * f;
    }
  }
  return points[points.length - 1][1];
}

/** Cancel future automation on a param and hold its value at `time`. */
function holdParam(param, time, fallbackValue) {
  if (typeof param.cancelAndHoldAtTime === "function") {
    param.cancelAndHoldAtTime(time);
  } else {
    param.cancelScheduledValues(time);
    param.setValueAtTime(fallbackValue, time);
  }
}

/**
 * FM Voice instance: 6 operators for a single musical note.
 */
class Voice {
  constructor(ctx, voiceIndex, engine) {
    this.ctx = ctx;
    this.voiceIndex = voiceIndex;
    this.engine = engine;
    this.activeNote = null;
    this.startTime = 0;
    this.isReleasing = false;
    this.owner = null; // "key" | "seq"
    this.feedbackOpIndex = 5;
    this._idleTimer = null;

    this.output = this.ctx.createGain();
    this.output.gain.value = 0.5;

    this.ops = [];
    for (let i = 0; i < 6; i++) {
      this.ops.push(this._createOperator(i));
    }
  }

  _createOperator(index) {
    const osc = this.ctx.createOscillator();
    osc.type = "sine";

    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);

    // Self-feedback path. Web Audio requires a DelayNode inside any cycle and
    // clamps it to one render quantum, so this is "short delayed feedback".
    const feedbackDelay = this.ctx.createDelay(0.05);
    feedbackDelay.delayTime.value = 128 / this.ctx.sampleRate;
    const feedbackGain = this.ctx.createGain();
    feedbackGain.gain.value = 0;

    feedbackDelay.connect(feedbackGain);
    feedbackGain.connect(osc.frequency);

    osc.start();

    return { index, osc, gain, feedbackDelay, feedbackGain, isCarrier: false, envPoints: [] };
  }

  reconnectAlgorithm(algoId) {
    const algo = FM_ALGORITHMS[algoId] || FM_ALGORITHMS[1];
    const now = this.ctx.currentTime;

    for (const op of this.ops) {
      try { op.gain.disconnect(); } catch (e) { /* not connected yet */ }
      op.gain.connect(op.feedbackDelay);
      op.isCarrier = false;
      op.feedbackGain.gain.setValueAtTime(0, now);
    }

    for (const cIdx of algo.carriers) {
      const op = this.ops[cIdx - 1];
      if (op) {
        op.gain.connect(this.output);
        op.isCarrier = true;
      }
    }

    for (const [modIdx, targetIdx] of algo.modulations) {
      const modOp = this.ops[modIdx - 1];
      const targetOp = this.ops[targetIdx - 1];
      if (modOp && targetOp) {
        modOp.gain.connect(targetOp.osc.frequency);
      }
    }

    this.feedbackOpIndex = (algo.feedbackOp || 6) - 1;
  }

  noteOn(midiNote, freq, velocity = 1.0, glideTime = 0, time = null) {
    const t = time ?? this.ctx.currentTime + 0.003;
    this.activeNote = midiNote;
    this.startTime = t;
    this.isReleasing = false;
    clearTimeout(this._idleTimer);

    const patch = this.engine.currentPatch;

    for (let i = 0; i < 6; i++) {
      const op = this.ops[i];
      const cfg = patch.operators[i] || DEFAULT_OPERATOR;
      const targetFreq = freq * Math.max(0.125, cfg.ratio || 1);

      const fParam = op.osc.frequency;
      fParam.cancelScheduledValues(t);
      if (glideTime > 0.005) {
        fParam.setTargetAtTime(targetFreq, t, glideTime / 3);
      } else {
        fParam.setValueAtTime(targetFreq, t);
      }
      op.osc.detune.setValueAtTime(cfg.detune || 0, t);

      // Carriers output audio amplitude; modulators output frequency deviation (Hz),
      // scaled by pitch so the modulation index stays constant across the keyboard.
      const maxGain = op.isCarrier
        ? cfg.level * velocity * 0.5
        : cfg.level * velocity * freq * 4.0;

      // Feedback amount is expressed as a modulation index relative to the
      // operator's own output amplitude, so it behaves the same for carriers and modulators.
      const fbAmt = i === this.feedbackOpIndex ? (cfg.feedback || 0) : 0;
      const fbGain = fbAmt > 0 && maxGain > 0 ? (fbAmt * targetFreq * 1.5) / maxGain : 0;
      op.feedbackGain.gain.setValueAtTime(fbGain, t);

      const attack = Math.max(0.003, cfg.attack ?? 0.01);
      const decay = Math.max(0.01, cfg.decay ?? 0.5);
      const sustainLevel = maxGain * (cfg.sustain ?? 0.5);

      const g = op.gain.gain;
      const v0 = envValueAt(op.envPoints, t);
      holdParam(g, t, v0);
      g.linearRampToValueAtTime(maxGain, t + attack);
      g.linearRampToValueAtTime(sustainLevel, t + attack + decay);
      op.envPoints = [[t, v0], [t + attack, maxGain], [t + attack + decay, sustainLevel]];
    }
  }

  noteOff(time = null) {
    const t = time ?? this.ctx.currentTime + 0.003;
    this.isReleasing = true;
    const patch = this.engine.currentPatch;

    let longestRelease = 0.05;
    for (let i = 0; i < 6; i++) {
      const op = this.ops[i];
      const cfg = patch.operators[i] || DEFAULT_OPERATOR;
      const release = Math.max(0.02, cfg.release ?? 0.3);
      if (release > longestRelease) longestRelease = release;

      const g = op.gain.gain;
      const v0 = envValueAt(op.envPoints, t);
      holdParam(g, t, v0);
      g.linearRampToValueAtTime(0, t + release);
      op.envPoints = [[t, v0], [t + release, 0]];
    }

    clearTimeout(this._idleTimer);
    const msUntilIdle = (t - this.ctx.currentTime + longestRelease) * 1000 + 50;
    this._idleTimer = setTimeout(() => {
      if (this.isReleasing) {
        this.activeNote = null;
        this.owner = null;
      }
    }, Math.max(0, msUntilIdle));
  }

  /** Immediate (fast-fade) stop. */
  stop() {
    const t = this.ctx.currentTime;
    for (const op of this.ops) {
      const g = op.gain.gain;
      holdParam(g, t, envValueAt(op.envPoints, t));
      g.setTargetAtTime(0, t, 0.006);
      op.envPoints = [[t, 0]];
    }
    clearTimeout(this._idleTimer);
    this.activeNote = null;
    this.owner = null;
    this.isReleasing = false;
  }

  /** Immediate (hard-zero) stop with automation cancellation for clean preset transitions. */
  hardStop() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    clearTimeout(this._idleTimer);
    this.activeNote = null;
    this.owner = null;
    this.isReleasing = false;
    for (const op of this.ops) {
      try {
        op.gain.gain.cancelScheduledValues(t);
        op.gain.gain.setValueAtTime(0, t);
        op.feedbackGain.gain.cancelScheduledValues(t);
        op.feedbackGain.gain.setValueAtTime(0, t);
        op.osc.frequency.cancelScheduledValues(t);
        op.osc.detune.cancelScheduledValues(t);
      } catch (e) {
        // ignore
      }
      op.envPoints = [[t, 0]];
    }
  }
}

/**
 * Main SynthEngine: AudioContext, voices, effects, presets, LFO, pitch bend.
 */
export class SynthEngine {
  constructor() {
    this.ctx = null;
    this.octave = 0; // -3 to +3
    this.tuning = 440;
    this.voiceMode = "poly";
    this.glide = 0;
    this.maxVoices = 8;
    this.voices = [];
    this.activeKeys = new Map(); // untransposed midi -> voice
    this.monoStack = []; // held keys in mono mode (last = sounding)
    this.monoCurrent = null;
    this.lastVelocity = 1;

    this.presets = SYNTH_PRESETS;
    this.userPresets = this._loadUserPresets();
    this.currentPresetIndex = 0;
    this.currentPatch = clone(this.presets[0]);
    this.lfo = { ...DEFAULT_LFO };

    this.init();
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.75;

      if (this.ctx.createDynamicsCompressor) {
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.value = -6;
        this.limiter.knee.value = 6;
        this.limiter.ratio.value = 12;
        this.limiter.attack.value = 0.003;
        this.limiter.release.value = 0.15;
      }

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;

      this.effects = new SynthEffects(this.ctx);

      this.voiceBus = this.ctx.createGain();
      this.voiceBus.gain.value = 0.8;

      // Master pitch bend (cents) routed to all voices
      this.pitchBend = this.ctx.createConstantSource ? this.ctx.createConstantSource() : this.ctx.createGain();
      if (this.pitchBend.offset) this.pitchBend.offset.value = 0;
      if (this.pitchBend.start) this.pitchBend.start();

      // Global LFO -> pitch (cents) and/or filter cutoff (Hz)
      this.lfoOsc = this.ctx.createOscillator();
      this.lfoOsc.type = "sine";
      this.lfoOsc.frequency.value = this.lfo.rate;
      this.lfoPitchGain = this.ctx.createGain();
      this.lfoPitchGain.gain.value = 0;
      this.lfoFilterGain = this.ctx.createGain();
      this.lfoFilterGain.gain.value = 0;
      this.lfoOsc.connect(this.lfoPitchGain);
      this.lfoOsc.connect(this.lfoFilterGain);
      this.lfoFilterGain.connect(this.effects.filterNode.frequency);
      this.lfoOsc.start();

      for (let i = 0; i < this.maxVoices; i++) {
        const voice = new Voice(this.ctx, i, this);
        voice.output.connect(this.voiceBus);
        for (const op of voice.ops) {
          if (this.pitchBend.connect) this.pitchBend.connect(op.osc.detune);
          this.lfoPitchGain.connect(op.osc.detune);
        }
        this.voices.push(voice);
      }

      // VoiceBus -> FX -> Master -> Limiter -> Analyser -> Out
      this.voiceBus.connect(this.effects.input);
      this.effects.output.connect(this.masterGain);

      // Initialize Drum Engine
      this.drums = new DrumEngine(this.ctx);

      if (this.limiter) {
        this.masterGain.connect(this.limiter);
        this.drums.output.connect(this.limiter);
        this.limiter.connect(this.analyser);
      } else {
        this.masterGain.connect(this.analyser);
        this.drums.output.connect(this.analyser);
      }
      this.analyser.connect(this.ctx.destination);

      this.loadPreset(0);
    } catch (err) {
      console.warn("AudioContext creation failed:", err);
    }
  }

  async resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn("AudioContext resume failed:", e);
      }
    }
  }

  get isRunning() {
    return !!this.ctx && this.ctx.state === "running";
  }

  // ------------------------------------------------------------------
  // Presets
  // ------------------------------------------------------------------

  _loadUserPresets() {
    try {
      const raw = localStorage.getItem(USER_PRESETS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      // Migrate the old single-slot save format into slot 0.
      const legacy = localStorage.getItem(LEGACY_PATCH_KEY);
      if (legacy && !parsed[0]) {
        parsed[0] = JSON.parse(legacy);
        localStorage.removeItem(LEGACY_PATCH_KEY);
        localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(parsed));
      }
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  hasUserPreset(index) {
    return !!this.userPresets[index];
  }

  get userPresetCount() {
    return Object.keys(this.userPresets).length;
  }

  presetName(index) {
    const src = this.userPresets[index] || this.presets[index];
    return src ? src.name : "";
  }

  loadPreset(index) {
    if (index < 0 || index >= this.presets.length) return;
    const prevAlgo = this.currentPatch?.algorithm;
    this.currentPresetIndex = index;
    const source = this.userPresets[index] || this.presets[index];
    this.currentPatch = clone(source);
    this.currentPatch.operators = (this.currentPatch.operators || []).map((op) => ({ ...DEFAULT_OPERATOR, ...op }));
    while (this.currentPatch.operators.length < 6) this.currentPatch.operators.push({ ...DEFAULT_OPERATOR });

    this.voiceMode = this.currentPatch.voiceMode === "mono" ? "mono" : "poly";
    this.glide = this.currentPatch.glide || 0;
    this.lfo = { ...DEFAULT_LFO, ...(this.currentPatch.lfo || {}) };

    if (!this.ctx) return;

    // 1. Immediately hard-stop all active and releasing voices so no modulator gain leaks
    this.allNotesOff(true);

    // 2. Anti-glitch micro-dip on voiceBus to guarantee total silence during graph rewiring
    const now = this.ctx.currentTime;
    if (this.voiceBus) {
      try {
        this.voiceBus.gain.cancelScheduledValues(now);
        this.voiceBus.gain.setValueAtTime(0, now);
        this.voiceBus.gain.linearRampToValueAtTime(0.8, now + 0.025);
      } catch (e) {
        // ignore
      }
    }

    // 3. Reconnect algorithm with all operator gains guaranteed at 0
    for (const voice of this.voices) {
      voice.reconnectAlgorithm(this.currentPatch.algorithm);
    }

    // 4. Smoothly apply effects (flushes delay Doppler artifacts and avoids convolver pops)
    if (this.effects) {
      this.effects.applyPatch(this.currentPatch, true);
    }

    this._applyLfo();
    return this.currentPatch;
  }

  /** Load an imported custom patch directly into the synthesis engine. */
  loadCustomPatch(patchData) {
    if (!patchData || typeof patchData !== "object") return null;
    const source = clone(patchData);
    this.currentPatch = source;
    this.currentPatch.operators = (this.currentPatch.operators || []).map((op) => ({ ...DEFAULT_OPERATOR, ...op }));
    while (this.currentPatch.operators.length < 6) this.currentPatch.operators.push({ ...DEFAULT_OPERATOR });

    this.voiceMode = this.currentPatch.voiceMode === "mono" ? "mono" : "poly";
    this.glide = this.currentPatch.glide || 0;
    this.octave = this.currentPatch.octave || 0;
    this.lfo = { ...DEFAULT_LFO, ...(this.currentPatch.lfo || {}) };

    if (!this.ctx) return this.currentPatch;

    // 1. Immediately hard-stop all active and releasing voices
    this.allNotesOff(true);

    // 2. Anti-glitch micro-dip on voiceBus
    const now = this.ctx.currentTime;
    if (this.voiceBus) {
      try {
        this.voiceBus.gain.cancelScheduledValues(now);
        this.voiceBus.gain.setValueAtTime(0, now);
        this.voiceBus.gain.linearRampToValueAtTime(0.8, now + 0.025);
      } catch (e) {}
    }

    // 3. Reconnect algorithm with clean operator gains
    for (const voice of this.voices) {
      voice.reconnectAlgorithm(this.currentPatch.algorithm || 1);
    }

    // 4. Smoothly apply effects
    if (this.effects) {
      this.effects.applyPatch(this.currentPatch, true);
    }

    this._applyLfo();
    return this.currentPatch;
  }

  /** Full snapshot of the current sound, including live effect and LFO state. */
  getPatchSnapshot() {
    const p = clone(this.currentPatch);
    p.voiceMode = this.voiceMode;
    p.glide = this.glide;
    p.lfo = { ...this.lfo };
    if (this.effects) {
      const s = this.effects.states;
      p.filter = { ...s.filter };
      p.effects = {
        distortion: { ...s.distortion },
        chorus: { ...s.chorus },
        phaser: { ...s.phaser },
        delay: { ...s.delay },
        reverb: { ...s.reverb }
      };
    }
    return p;
  }

  saveUserPreset() {
    const snapshot = this.getPatchSnapshot();
    this.userPresets[this.currentPresetIndex] = snapshot;
    try {
      localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(this.userPresets));
      return true;
    } catch (e) {
      console.warn("Could not save preset:", e);
      return false;
    }
  }

  clearUserPresets() {
    this.userPresets = {};
    try { localStorage.removeItem(USER_PRESETS_KEY); } catch (e) { /* ignore */ }
    this.loadPreset(this.currentPresetIndex);
  }

  // ------------------------------------------------------------------
  // Global parameters
  // ------------------------------------------------------------------

  setAlgorithm(algoId) {
    const id = Math.max(1, Math.min(8, Math.round(algoId)));
    if (id === this.currentPatch.algorithm) return;
    this.currentPatch.algorithm = id;
    // Modulator gains are hundreds of Hz; never let them reach the output mid-note.
    this.allNotesOff();
    for (const voice of this.voices) {
      voice.reconnectAlgorithm(id);
    }
  }

  setMasterVolume(val) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1.2, val)), this.ctx.currentTime, 0.015);
    }
  }

  setVoiceMode(mode) {
    const next = mode === "mono" ? "mono" : "poly";
    if (next === this.voiceMode) return;
    this.voiceMode = next;
    this.currentPatch.voiceMode = next;
    this.allNotesOff();
  }

  setGlide(seconds) {
    this.glide = Math.max(0, Math.min(1, seconds));
    this.currentPatch.glide = this.glide;
  }

  setTuning(hz) {
    this.tuning = Math.max(400, Math.min(480, hz));
  }

  setLfo(partial) {
    Object.assign(this.lfo, partial);
    this.currentPatch.lfo = { ...this.lfo };
    this._applyLfo();
  }

  _applyLfo() {
    if (!this.ctx || !this.lfoOsc) return;
    const now = this.ctx.currentTime;
    const { rate, depth, shape, dest } = this.lfo;
    if (["sine", "triangle", "square", "sawtooth"].includes(shape)) this.lfoOsc.type = shape;
    this.lfoOsc.frequency.setTargetAtTime(Math.max(0.01, rate), now, 0.02);
    const toPitch = dest === "pitch" || dest === "both";
    const toFilter = dest === "filter" || dest === "both";
    this.lfoPitchGain.gain.setTargetAtTime(toPitch ? depth * 100 : 0, now, 0.02); // up to ±1 semitone
    this.lfoFilterGain.gain.setTargetAtTime(toFilter ? depth * 2500 : 0, now, 0.02); // ±Hz
  }

  /** Pitch bend in cents (e.g. -200..+200 for a whole tone). */
  bendPitch(cents) {
    if (!this.pitchBend) return;
    this.pitchBend.offset.setTargetAtTime(cents, this.ctx.currentTime, 0.01);
  }

  /** Momentary "PIT" key: quick upward bend that falls back. */
  triggerPitchMod() {
    if (!this.pitchBend) return;
    const p = this.pitchBend.offset;
    const now = this.ctx.currentTime;
    p.cancelScheduledValues(now);
    p.setValueAtTime(p.value, now);
    p.linearRampToValueAtTime(300, now + 0.15);
    p.linearRampToValueAtTime(0, now + 0.45);
  }

  midiToFreq(midi) {
    return this.tuning * Math.pow(2, (midi - 69) / 12);
  }

  // ------------------------------------------------------------------
  // Note handling
  // ------------------------------------------------------------------

  _allocateVoice(effectiveMidi) {
    let voice = this.voices.find((v) => v.activeNote === effectiveMidi && !v.isReleasing);
    if (!voice) voice = this.voices.find((v) => v.activeNote === null);
    if (!voice) {
      const releasing = this.voices.filter((v) => v.isReleasing);
      if (releasing.length) voice = releasing.reduce((a, b) => (b.startTime < a.startTime ? b : a));
    }
    if (!voice) voice = this.voices.reduce((a, b) => (b.startTime < a.startTime ? b : a));

    // A stolen voice must no longer be reachable from the key that used to hold it.
    for (const [key, v] of this.activeKeys) {
      if (v === voice) this.activeKeys.delete(key);
    }
    return voice;
  }

  _triggerFilterEnv(time) {
    if (!this.effects) return;
    const algo = FM_ALGORITHMS[this.currentPatch.algorithm] || FM_ALGORITHMS[1];
    const carrier = this.currentPatch.operators[algo.carriers[0] - 1] || DEFAULT_OPERATOR;
    this.effects.triggerFilterEnv(time, carrier.attack, carrier.decay);
  }

  _monoTrigger(midiNote, velocity, time) {
    const voice = this.voices[0];
    const effectiveMidi = midiNote + this.octave * 12;
    const glideTime = voice.activeNote !== null ? this.glide : 0;
    voice.owner = "key";
    voice.noteOn(effectiveMidi, this.midiToFreq(effectiveMidi), velocity, glideTime, time);
    this.monoCurrent = midiNote;
    this.lastVelocity = velocity;
    this.activeKeys.set(midiNote, voice);
    this._triggerFilterEnv(time);
  }

  noteOn(midiNote, velocity = 1.0, time = null) {
    if (!this.ctx) return;
    this.resume();
    const t = time ?? this.ctx.currentTime + 0.003;

    if (this.voiceMode === "mono") {
      const idx = this.monoStack.indexOf(midiNote);
      if (idx >= 0) this.monoStack.splice(idx, 1);
      this.monoStack.push(midiNote);
      this._monoTrigger(midiNote, velocity, t);
      return;
    }

    const effectiveMidi = midiNote + this.octave * 12;
    const voice = this._allocateVoice(effectiveMidi);
    voice.owner = "key";
    voice.noteOn(effectiveMidi, this.midiToFreq(effectiveMidi), velocity, 0, t);
    this.activeKeys.set(midiNote, voice);
    this._triggerFilterEnv(t);
  }

  noteOff(midiNote, time = null) {
    if (!this.ctx) return;
    const t = time ?? this.ctx.currentTime + 0.003;

    if (this.voiceMode === "mono") {
      const idx = this.monoStack.indexOf(midiNote);
      if (idx >= 0) this.monoStack.splice(idx, 1);
      this.activeKeys.delete(midiNote);
      if (this.monoCurrent !== midiNote) return;
      const voice = this.voices[0];
      if (this.monoStack.length > 0) {
        // Legato: fall back to the most recent key still held.
        const prev = this.monoStack[this.monoStack.length - 1];
        this._monoTrigger(prev, this.lastVelocity, t);
      } else {
        this.monoCurrent = null;
        if (voice.owner === "key") voice.noteOff(t);
      }
      return;
    }

    const voice = this.activeKeys.get(midiNote);
    if (voice) {
      this.activeKeys.delete(midiNote);
      voice.noteOff(t);
    }
  }

  /**
   * Sample-accurate note for the sequencer/arpeggiator: schedules both the
   * attack and the release on the audio clock and bypasses the key map.
   */
  playNote(midiNote, velocity, time, duration) {
    if (!this.ctx) return;
    const effectiveMidi = midiNote + this.octave * 12;
    let voice;
    let glideTime = 0;
    if (this.voiceMode === "mono") {
      voice = this.voices[0];
      glideTime = voice.activeNote !== null ? this.glide : 0;
    } else {
      voice = this._allocateVoice(effectiveMidi);
    }
    voice.owner = "seq";
    voice.noteOn(effectiveMidi, this.midiToFreq(effectiveMidi), velocity, glideTime, time);
    voice.noteOff(time + duration);
    this._triggerFilterEnv(time);
  }

  /** Release every voice the sequencer is driving (used on STOP). */
  releaseSequencerVoices() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const voice of this.voices) {
      if (voice.owner === "seq") voice.noteOff(now);
    }
  }

  triggerDrum(voice, velocity = 1.0, time = null) {
    this.resume();
    if (this.drums) {
      this.drums.trigger(voice, time, velocity);
    }
  }

  allNotesOff(hard = false) {
    for (const voice of this.voices) {
      if (hard) voice.hardStop();
      else voice.stop();
    }
    this.activeKeys.clear();
    this.monoStack = [];
    this.monoCurrent = null;
  }

  shiftOctave(delta) {
    this.octave = Math.max(-3, Math.min(3, this.octave + delta));
    return this.octave;
  }
}
