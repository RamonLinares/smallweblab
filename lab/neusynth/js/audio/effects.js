/**
 * Studio Effects Chain for NeuSynth
 * Filter -> Distortion -> Chorus -> Phaser -> Delay -> Reverb
 * Every effect has a dry/wet pair so it can be toggled without re-patching the graph.
 */

export const DEFAULT_FX_STATES = Object.freeze({
  filter: { enabled: true, type: "lowpass", cutoff: 4000, resonance: 2.5, envAmount: 0.5 },
  distortion: { enabled: false, drive: 0.35, tone: 3000, curve: "soft", mix: 0.6 },
  chorus: { enabled: false, rate: 1.2, depth: 0.4, width: 0.5, mix: 0.5 },
  phaser: { enabled: false, rate: 0.5, depth: 0.7, feedback: 0.4, mix: 0.5 },
  delay: { enabled: true, time: 0.28, feedback: 0.4, tone: 3500, mix: 0.25 },
  reverb: { enabled: true, decay: 2.2, damping: 4000, preDelay: 0.02, mix: 0.35 }
});

export const FX_ORDER = ["filter", "reverb", "delay", "distortion", "chorus", "phaser"];
export const FILTER_TYPES = ["lowpass", "highpass", "bandpass"];
export const DISTORTION_CURVES = ["soft", "hard", "fold"];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export class SynthEffects {
  constructor(audioCtx) {
    this.ctx = audioCtx;
    this.input = this.ctx.createGain();
    this.output = this.ctx.createGain();

    this.states = {};
    for (const name of Object.keys(DEFAULT_FX_STATES)) {
      this.states[name] = { ...DEFAULT_FX_STATES[name] };
    }

    this._impulseTimer = null;
    this._buildChain();
  }

  _param(param, value, tc = 0.015) {
    param.setTargetAtTime(value, this.ctx.currentTime, tc);
  }

  _buildChain() {
    const ctx = this.ctx;

    // 1. FILTER
    this.filterNode = ctx.createBiquadFilter();
    this.filterDry = ctx.createGain();
    this.filterWet = ctx.createGain();
    this.filterOut = ctx.createGain();
    this.input.connect(this.filterNode);
    this.input.connect(this.filterDry);
    this.filterNode.connect(this.filterWet);
    this.filterWet.connect(this.filterOut);
    this.filterDry.connect(this.filterOut);

    // 2. DISTORTION
    this.distNode = ctx.createWaveShaper();
    this.distNode.oversample = "4x";
    this.distPreGain = ctx.createGain();
    this.distTone = ctx.createBiquadFilter();
    this.distTone.type = "lowpass";
    this.distDry = ctx.createGain();
    this.distWet = ctx.createGain();
    this.distOut = ctx.createGain();
    this.filterOut.connect(this.distDry);
    this.filterOut.connect(this.distPreGain);
    this.distPreGain.connect(this.distNode);
    this.distNode.connect(this.distTone);
    this.distTone.connect(this.distWet);
    this.distDry.connect(this.distOut);
    this.distWet.connect(this.distOut);

    // 3. CHORUS (two modulated delay lines, LFO inverted on the right side)
    this.chorusDry = ctx.createGain();
    this.chorusWet = ctx.createGain();
    this.chorusOut = ctx.createGain();
    this.chorusDelayL = ctx.createDelay(0.1);
    this.chorusDelayR = ctx.createDelay(0.1);
    this.chorusLFO = ctx.createOscillator();
    this.chorusGainL = ctx.createGain();
    this.chorusGainR = ctx.createGain();
    this.chorusLFO.connect(this.chorusGainL);
    this.chorusLFO.connect(this.chorusGainR);
    this.chorusGainL.connect(this.chorusDelayL.delayTime);
    this.chorusGainR.connect(this.chorusDelayR.delayTime);
    this.chorusLFO.start();
    this.distOut.connect(this.chorusDry);
    this.distOut.connect(this.chorusDelayL);
    this.distOut.connect(this.chorusDelayR);
    this.chorusMerger = ctx.createChannelMerger(2);
    this.chorusDelayL.connect(this.chorusMerger, 0, 0);
    this.chorusDelayR.connect(this.chorusMerger, 0, 1);
    this.chorusMerger.connect(this.chorusWet);
    this.chorusDry.connect(this.chorusOut);
    this.chorusWet.connect(this.chorusOut);

    // 4. PHASER (4 all-pass stages + feedback)
    this.phaserDry = ctx.createGain();
    this.phaserWet = ctx.createGain();
    this.phaserOut = ctx.createGain();
    this.phaserStages = [];
    for (let i = 0; i < 4; i++) {
      const stage = ctx.createBiquadFilter();
      stage.type = "allpass";
      stage.frequency.value = 1000;
      stage.Q.value = 0.7;
      this.phaserStages.push(stage);
      if (i > 0) this.phaserStages[i - 1].connect(stage);
    }
    // A cycle in the Web Audio graph must contain a DelayNode, otherwise the
    // whole loop is muted. The delay is clamped to one render quantum anyway.
    this.phaserFeedback = ctx.createGain();
    this.phaserFbDelay = ctx.createDelay(0.01);
    this.phaserFbDelay.delayTime.value = 128 / ctx.sampleRate;
    this.phaserStages[3].connect(this.phaserFbDelay);
    this.phaserFbDelay.connect(this.phaserFeedback);
    this.phaserFeedback.connect(this.phaserStages[0]);

    this.phaserLFO = ctx.createOscillator();
    this.phaserLFOGain = ctx.createGain();
    this.phaserLFO.connect(this.phaserLFOGain);
    for (const stage of this.phaserStages) {
      this.phaserLFOGain.connect(stage.frequency);
    }
    this.phaserLFO.start();
    this.chorusOut.connect(this.phaserDry);
    this.chorusOut.connect(this.phaserStages[0]);
    this.phaserStages[3].connect(this.phaserWet);
    this.phaserDry.connect(this.phaserOut);
    this.phaserWet.connect(this.phaserOut);

    // 5. PING-PONG DELAY
    this.delayDry = ctx.createGain();
    this.delayWet = ctx.createGain();
    this.delayOut = ctx.createGain();
    this.delayNodeL = ctx.createDelay(2.0);
    this.delayNodeR = ctx.createDelay(2.0);
    this.delayFeedbackL = ctx.createGain();
    this.delayFeedbackR = ctx.createGain();
    this.delayDamp = ctx.createBiquadFilter();
    this.delayDamp.type = "lowpass";
    this.phaserOut.connect(this.delayDry);
    this.phaserOut.connect(this.delayNodeL);
    this.delayNodeL.connect(this.delayDamp);
    this.delayDamp.connect(this.delayFeedbackL);
    this.delayFeedbackL.connect(this.delayNodeR);
    this.delayNodeR.connect(this.delayFeedbackR);
    this.delayFeedbackR.connect(this.delayNodeL);
    this.delayMerger = ctx.createChannelMerger(2);
    this.delayNodeL.connect(this.delayMerger, 0, 0);
    this.delayNodeR.connect(this.delayMerger, 0, 1);
    this.delayMerger.connect(this.delayWet);
    this.delayDry.connect(this.delayOut);
    this.delayWet.connect(this.delayOut);

    // 6. REVERB (pre-delay -> convolver -> damping)
    this.reverbDry = ctx.createGain();
    this.reverbWet = ctx.createGain();
    this.reverbPre = ctx.createDelay(0.3);
    this.reverbNode = ctx.createConvolver();
    this.reverbDamp = ctx.createBiquadFilter();
    this.reverbDamp.type = "lowpass";
    this.delayOut.connect(this.reverbDry);
    this.delayOut.connect(this.reverbPre);
    this.reverbPre.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbDamp);
    this.reverbDamp.connect(this.reverbWet);
    this.reverbDry.connect(this.output);
    this.reverbWet.connect(this.output);

    this._currentReverbDecay = 0;
    this.applyAllParams();
  }

  /** Push every value in `states` into the audio graph. */
  applyAllParams(isPresetSwitch = false) {
    const s = this.states;
    const now = this.ctx.currentTime;

    this.filterNode.type = s.filter.type;
    this.filterNode.frequency.cancelScheduledValues(now);
    if (isPresetSwitch) {
      this.filterNode.frequency.setTargetAtTime(s.filter.cutoff, now, 0.006);
      this.filterNode.Q.cancelScheduledValues(now);
      this.filterNode.Q.setTargetAtTime(s.filter.resonance, now, 0.006);
    } else {
      this.filterNode.frequency.setValueAtTime(s.filter.cutoff, now);
      this.filterNode.Q.setValueAtTime(s.filter.resonance, now);
    }

    this.updateDistortionCurve();
    this.distTone.frequency.setValueAtTime(s.distortion.tone, now);

    this.chorusLFO.frequency.setValueAtTime(s.chorus.rate, now);
    this._applyChorusDepth();
    this._applyChorusWidth();

    this.phaserLFO.frequency.setValueAtTime(s.phaser.rate, now);
    this.phaserLFOGain.gain.setValueAtTime(600 * s.phaser.depth, now);
    this.phaserFeedback.gain.setValueAtTime(s.phaser.feedback, now);

    // DELAY HANDLING:
    // If switching presets, stale audio in the delay buffer would pitch-warp (Doppler scrub)
    // and recirculate through feedback for 1-2 seconds if delayTime changes abruptly.
    // By momentarily clearing feedback and dipping wet gain, we flush the old echoes cleanly!
    if (isPresetSwitch) {
      try {
        this.delayFeedbackL.gain.cancelScheduledValues(now);
        this.delayFeedbackL.gain.setValueAtTime(0, now);
        this.delayFeedbackR.gain.cancelScheduledValues(now);
        this.delayFeedbackR.gain.setValueAtTime(0, now);

        this.delayWet.gain.cancelScheduledValues(now);
        this.delayWet.gain.setValueAtTime(0, now);

        this.delayNodeL.delayTime.setValueAtTime(s.delay.time, now);
        this.delayNodeR.delayTime.setValueAtTime(s.delay.time * 1.333, now);
        this.delayDamp.frequency.setValueAtTime(s.delay.tone, now);

        this.delayFeedbackL.gain.linearRampToValueAtTime(s.delay.feedback, now + 0.04);
        this.delayFeedbackR.gain.linearRampToValueAtTime(s.delay.feedback, now + 0.04);
        this.delayWet.gain.linearRampToValueAtTime(s.delay.mix, now + 0.04);
      } catch (e) {
        // ignore
      }
    } else {
      this.delayNodeL.delayTime.setValueAtTime(s.delay.time, now);
      this.delayNodeR.delayTime.setValueAtTime(s.delay.time * 1.333, now);
      this.delayFeedbackL.gain.setValueAtTime(s.delay.feedback, now);
      this.delayFeedbackR.gain.setValueAtTime(s.delay.feedback, now);
      this.delayDamp.frequency.setValueAtTime(s.delay.tone, now);
    }

    // REVERB:
    // Only regenerate impulse if decay changed significantly (> 0.05s)
    const decayChanged = !this._currentReverbDecay || Math.abs(this._currentReverbDecay - s.reverb.decay) > 0.05;
    if (decayChanged) {
      if (isPresetSwitch) {
        try {
          this.reverbWet.gain.cancelScheduledValues(now);
          this.reverbWet.gain.setValueAtTime(0, now);
          this._generateReverbImpulse(s.reverb.decay);
          this.reverbWet.gain.linearRampToValueAtTime(s.reverb.mix, now + 0.04);
        } catch (e) {
          this._generateReverbImpulse(s.reverb.decay);
        }
      } else {
        this._generateReverbImpulse(s.reverb.decay);
      }
      this._currentReverbDecay = s.reverb.decay;
    }
    this.reverbDamp.frequency.setValueAtTime(s.reverb.damping, now);
    this.reverbPre.delayTime.setValueAtTime(s.reverb.preDelay, now);

    if (!isPresetSwitch) {
      this.syncAllMixLevels();
    } else {
      this.distWet.gain.setTargetAtTime(s.distortion.mix, now, 0.005);
      this.distDry.gain.setTargetAtTime(1 - s.distortion.mix * 0.5, now, 0.005);
      this.chorusWet.gain.setTargetAtTime(s.chorus.mix, now, 0.005);
      this.chorusDry.gain.setTargetAtTime(1 - s.chorus.mix * 0.3, now, 0.005);
      this.phaserWet.gain.setTargetAtTime(s.phaser.mix, now, 0.005);
      this.phaserDry.gain.setTargetAtTime(1 - s.phaser.mix * 0.3, now, 0.005);
      this.delayDry.gain.setTargetAtTime(1 - s.delay.mix * 0.2, now, 0.005);
      this.reverbDry.gain.setTargetAtTime(1 - s.reverb.mix * 0.4, now, 0.005);
    }
  }

  /** Load effect settings from a preset patch (partial values fall back to defaults). */
  applyPatch(patch, isPresetSwitch = false) {
    const fx = patch.effects || {};
    for (const name of ["distortion", "chorus", "phaser", "delay", "reverb"]) {
      this.states[name] = { ...DEFAULT_FX_STATES[name], ...(fx[name] || {}) };
    }
    this.states.filter = { ...DEFAULT_FX_STATES.filter, ...(patch.filter || {}) };
    this.applyAllParams(isPresetSwitch);
  }

  _generateReverbImpulse(decayTime) {
    const rate = this.ctx.sampleRate;
    const seconds = clamp(decayTime, 0.3, 6);
    const length = Math.max(1, Math.floor(rate * seconds));
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const env = Math.pow(1 - i / length, 2.8);
        data[i] = (Math.random() * 2 - 1) * env;
      }
    }
    this.reverbNode.buffer = impulse;
  }

  _scheduleImpulseRegen() {
    clearTimeout(this._impulseTimer);
    this._impulseTimer = setTimeout(() => {
      this._generateReverbImpulse(this.states.reverb.decay);
    }, 120);
  }

  updateDistortionCurve() {
    const { drive, curve } = this.states.distortion;
    const n = 8192;
    const out = new Float32Array(n);
    const k = drive * 40;

    let shape;
    if (curve === "hard") {
      const g = 1 + drive * 8;
      shape = (x) => clamp(x * g, -1, 1);
    } else if (curve === "fold") {
      const g = 1 + drive * 5;
      shape = (x) => Math.sin(x * g * Math.PI * 0.5);
    } else {
      shape = (x) => (k === 0 ? x : ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x)));
    }

    // Normalise so full-scale input maps to full-scale output regardless of drive.
    const peak = Math.abs(shape(1)) || 1;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      out[i] = shape(x) / peak;
    }
    this.distNode.curve = out;
    this._param(this.distPreGain.gain, curve === "soft" ? 1 + drive * 3.5 : 1);
  }

  _applyChorusDepth() {
    const d = 0.003 * this.states.chorus.depth;
    this._param(this.chorusGainL.gain, d);
    this._param(this.chorusGainR.gain, -d);
  }

  _applyChorusWidth() {
    const w = this.states.chorus.width;
    this._param(this.chorusDelayL.delayTime, 0.02, 0.03);
    this._param(this.chorusDelayR.delayTime, 0.02 + w * 0.012, 0.03);
  }

  syncAllMixLevels() {
    const s = this.states;
    const set = (param, v) => this._param(param, v, 0.01);

    set(this.filterDry.gain, s.filter.enabled ? 0 : 1);
    set(this.filterWet.gain, s.filter.enabled ? 1 : 0);

    const dMix = s.distortion.enabled ? s.distortion.mix : 0;
    set(this.distWet.gain, dMix);
    set(this.distDry.gain, 1 - dMix * 0.4);

    const cMix = s.chorus.enabled ? s.chorus.mix : 0;
    set(this.chorusWet.gain, cMix);
    set(this.chorusDry.gain, 1 - cMix * 0.3);

    const pMix = s.phaser.enabled ? s.phaser.mix : 0;
    set(this.phaserWet.gain, pMix);
    set(this.phaserDry.gain, 1 - pMix * 0.3);

    const dlMix = s.delay.enabled ? s.delay.mix : 0;
    set(this.delayWet.gain, dlMix);
    set(this.delayDry.gain, 1 - dlMix * 0.2);

    const rMix = s.reverb.enabled ? s.reverb.mix : 0;
    set(this.reverbWet.gain, rMix);
    set(this.reverbDry.gain, 1 - rMix * 0.25);
  }

  toggleEffect(name, enabled = null) {
    if (!this.states[name]) return false;
    this.states[name].enabled = enabled !== null ? !!enabled : !this.states[name].enabled;
    this.syncAllMixLevels();
    return this.states[name].enabled;
  }

  /**
   * Filter envelope: sweep the cutoff up by `envAmount` on each note and
   * fall back over the carrier's decay time.
   */
  triggerFilterEnv(time, attack = 0.01, decay = 0.4) {
    const f = this.states.filter;
    if (!f.enabled || !(f.envAmount > 0)) return;
    const base = clamp(f.cutoff, 20, 20000);
    const peak = clamp(base * (1 + f.envAmount * 6), base, 18000);
    if (peak <= base) return;
    const a = Math.max(0.005, attack);
    const d = clamp(decay, 0.05, 2.5);
    const p = this.filterNode.frequency;
    p.cancelScheduledValues(time);
    p.setValueAtTime(base, time);
    p.exponentialRampToValueAtTime(peak, time + a);
    p.exponentialRampToValueAtTime(base, time + a + d);
  }

  setFilterParam(param, val) {
    const s = this.states.filter;
    const now = this.ctx.currentTime;
    if (param === "cutoff") {
      s.cutoff = clamp(val, 20, 20000);
      this.filterNode.frequency.cancelScheduledValues(now);
      this.filterNode.frequency.setTargetAtTime(s.cutoff, now, 0.015);
    } else if (param === "resonance") {
      s.resonance = clamp(val, 0.1, 25);
      this._param(this.filterNode.Q, s.resonance);
    } else if (param === "type") {
      if (FILTER_TYPES.includes(val)) {
        s.type = val;
        this.filterNode.type = val;
      }
    } else if (param === "envAmount") {
      s.envAmount = clamp(val, 0, 1);
    }
  }

  setDistortionParam(param, val) {
    const s = this.states.distortion;
    if (param === "drive") {
      s.drive = clamp(val, 0, 1);
      this.updateDistortionCurve();
    } else if (param === "tone") {
      s.tone = clamp(val, 200, 10000);
      this._param(this.distTone.frequency, s.tone);
    } else if (param === "curve") {
      if (DISTORTION_CURVES.includes(val)) {
        s.curve = val;
        this.updateDistortionCurve();
      }
    } else if (param === "mix") {
      s.mix = clamp(val, 0, 1);
      this.syncAllMixLevels();
    }
  }

  setChorusParam(param, val) {
    const s = this.states.chorus;
    if (param === "rate") {
      s.rate = clamp(val, 0.05, 10);
      this._param(this.chorusLFO.frequency, s.rate);
    } else if (param === "depth") {
      s.depth = clamp(val, 0, 1);
      this._applyChorusDepth();
    } else if (param === "width") {
      s.width = clamp(val, 0, 1);
      this._applyChorusWidth();
    } else if (param === "mix") {
      s.mix = clamp(val, 0, 1);
      this.syncAllMixLevels();
    }
  }

  setPhaserParam(param, val) {
    const s = this.states.phaser;
    if (param === "rate") {
      s.rate = clamp(val, 0.05, 8);
      this._param(this.phaserLFO.frequency, s.rate);
    } else if (param === "depth") {
      s.depth = clamp(val, 0, 1);
      this._param(this.phaserLFOGain.gain, 600 * s.depth);
    } else if (param === "feedback") {
      s.feedback = clamp(val, 0, 0.9);
      this._param(this.phaserFeedback.gain, s.feedback);
    } else if (param === "mix") {
      s.mix = clamp(val, 0, 1);
      this.syncAllMixLevels();
    }
  }

  setDelayParam(param, val) {
    const s = this.states.delay;
    if (param === "time") {
      s.time = clamp(val, 0.02, 1.5);
      this._param(this.delayNodeL.delayTime, s.time, 0.03);
      this._param(this.delayNodeR.delayTime, s.time * 1.333, 0.03);
    } else if (param === "feedback") {
      s.feedback = clamp(val, 0, 0.92);
      this._param(this.delayFeedbackL.gain, s.feedback);
      this._param(this.delayFeedbackR.gain, s.feedback);
    } else if (param === "tone") {
      s.tone = clamp(val, 400, 12000);
      this._param(this.delayDamp.frequency, s.tone);
    } else if (param === "mix") {
      s.mix = clamp(val, 0, 1);
      this.syncAllMixLevels();
    }
  }

  setReverbParam(param, val) {
    const s = this.states.reverb;
    if (param === "decay") {
      s.decay = clamp(val, 0.3, 6.0);
      this._scheduleImpulseRegen();
    } else if (param === "damping") {
      s.damping = clamp(val, 300, 16000);
      this._param(this.reverbDamp.frequency, s.damping);
    } else if (param === "preDelay") {
      s.preDelay = clamp(val, 0, 0.25);
      this._param(this.reverbPre.delayTime, s.preDelay, 0.03);
    } else if (param === "mix") {
      s.mix = clamp(val, 0, 1);
      this.syncAllMixLevels();
    }
  }
}
