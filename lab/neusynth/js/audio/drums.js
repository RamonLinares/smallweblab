/**
 * Synthesized Analog & FM Drum Engine for NeuSynth Prime
 * Generates punchy, authentic drum voices via Web Audio API:
 * - KICK: Sub-bass exponential pitch drop with transient click
 * - SNARE: Dual-tone body + filtered white noise burst
 * - CLOSED HAT: Metallic multi-oscillator cluster with tight decay
 * - OPEN HAT: Metallic cluster with extended sizzle & choke group
 * - CLAP: Quad-pulse diffuse burst
 * - PERC: Resonant FM tom / metallic ping
 */

export class DrumEngine {
  constructor(audioCtx) {
    this.ctx = audioCtx;

    // Master Drum Bus
    this.output = this.ctx.createGain();
    this.output.gain.value = 0.85;

    // Drum sound parameters
    this.params = {
      kickTune: 45,       // Hz base
      kickDecay: 0.35,    // seconds
      snareSnap: 0.6,     // noise level ratio
      snareDecay: 0.22,   // seconds
      hatDecay: 0.05,     // closed hat decay
      openHatDecay: 0.35, // open hat decay
      percTune: 220,      // perc base Hz
      drumMix: 0.85       // master drum gain
    };

    // Shared white noise buffer for snare and clap
    this._initNoiseBuffer();

    // Active open hat gain reference for hi-hat choking
    this.activeOpenHatGain = null;
  }

  _initNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  getParam(name) {
    return this.params[name];
  }

  getParams() {
    return { ...this.params };
  }

  setParam(name, val) {
    if (this.params[name] !== undefined) {
      this.params[name] = val;
      if (name === "drumMix") {
        this.output.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
      }
    }
  }

  trigger(voice, time = null, velocity = 1.0) {
    const t = time !== null ? Math.max(time, this.ctx.currentTime) : this.ctx.currentTime;
    const vel = Math.max(0.1, Math.min(1.0, velocity));

    switch (voice) {
      case "kick":
        this._triggerKick(t, vel);
        break;
      case "snare":
        this._triggerSnare(t, vel);
        break;
      case "hihat":
      case "closedhat":
        this._triggerClosedHat(t, vel);
        break;
      case "openhat":
        this._triggerOpenHat(t, vel);
        break;
      case "clap":
        this._triggerClap(t, vel);
        break;
      case "perc":
      case "tom":
        this._triggerPerc(t, vel);
        break;
    }
  }

  /**
   * 1. PUNCHY ANALOG SUB KICK
   */
  _triggerKick(t, vel) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const baseFreq = this.params.kickTune;
    const decay = this.params.kickDecay;

    osc.type = "sine";

    // Exponential pitch sweep: 160Hz -> baseFreq (45Hz)
    osc.frequency.setValueAtTime(165, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, t + 0.055);

    // Amplitude envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vel * 1.1, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    // Transient click burst
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = "triangle";
    clickOsc.frequency.setValueAtTime(800, t);
    clickOsc.frequency.exponentialRampToValueAtTime(100, t + 0.012);
    clickGain.gain.setValueAtTime(vel * 0.4, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    clickOsc.connect(clickGain);
    clickGain.connect(this.output);
    clickOsc.start(t);
    clickOsc.stop(t + 0.02);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(t);
    osc.stop(t + decay + 0.05);
  }

  /**
   * 2. CRISP ANALOG SNARE
   */
  _triggerSnare(t, vel) {
    const decay = this.params.snareDecay;

    // Dual-tone body oscillators
    const toneOsc1 = this.ctx.createOscillator();
    const toneOsc2 = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();

    toneOsc1.type = "triangle";
    toneOsc2.type = "sine";
    toneOsc1.frequency.setValueAtTime(185, t);
    toneOsc2.frequency.setValueAtTime(330, t);
    toneOsc1.frequency.exponentialRampToValueAtTime(120, t + 0.07);
    toneOsc2.frequency.exponentialRampToValueAtTime(170, t + 0.07);

    toneGain.gain.setValueAtTime(vel * 0.7, t);
    toneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    toneOsc1.connect(toneGain);
    toneOsc2.connect(toneGain);
    toneGain.connect(this.output);

    toneOsc1.start(t);
    toneOsc2.start(t);
    toneOsc1.stop(t + 0.15);
    toneOsc2.stop(t + 0.15);

    // Snappy Noise component
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 1400;

    const noiseGain = this.ctx.createGain();
    const snap = this.params.snareSnap;
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(vel * snap * 0.9, t + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.output);

    noise.start(t);
    noise.stop(t + decay + 0.02);
  }

  /**
   * 3. CLOSED HI-HAT (Metallic 6-Osc Cluster)
   */
  _triggerClosedHat(t, vel) {
    // Choke open hat if active
    if (this.activeOpenHatGain) {
      if (this.activeOpenHatGain.gain.cancelScheduledValues) {
        this.activeOpenHatGain.gain.cancelScheduledValues(t);
      }
      this.activeOpenHatGain.gain.linearRampToValueAtTime(0.001, t + 0.02);
      this.activeOpenHatGain = null;
    }

    const decay = this.params.hatDecay;
    this._createMetallicVoice(t, decay, vel * 0.65, 7500);
  }

  /**
   * 4. OPEN HI-HAT (Extended Metallic Sizzle)
   */
  _triggerOpenHat(t, vel) {
    const decay = this.params.openHatDecay;
    const gainNode = this._createMetallicVoice(t, decay, vel * 0.7, 6500);
    this.activeOpenHatGain = gainNode;
  }

  _createMetallicVoice(t, decay, volume, filterFreq) {
    // 6 metallic square-wave ratios
    const ratios = [205, 305, 365, 420, 620, 800];
    const mixGain = this.ctx.createGain();
    mixGain.gain.value = 0.18;

    const oscs = [];
    for (let r of ratios) {
      const osc = this.ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(r, t);
      osc.connect(mixGain);
      osc.start(t);
      osc.stop(t + decay + 0.05);
      oscs.push(osc);
    }

    // Highpass filter for metallic cut
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = filterFreq;

    const ampGain = this.ctx.createGain();
    ampGain.gain.setValueAtTime(0, t);
    ampGain.gain.linearRampToValueAtTime(volume, t + 0.002);
    ampGain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    mixGain.connect(filter);
    filter.connect(ampGain);
    ampGain.connect(this.output);

    return ampGain;
  }

  /**
   * 5. ANALOG HAND CLAP (Quad-Pulse Burst)
   */
  _triggerClap(t, vel) {
    const pulses = [0, 0.011, 0.023, 0.035];
    const totalDuration = 0.28;

    for (let i = 0; i < pulses.length; i++) {
      const pTime = t + pulses[i];
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1100;
      filter.Q.value = 2.5;

      const gain = this.ctx.createGain();
      const isTail = i === pulses.length - 1;
      const dur = isTail ? 0.24 : 0.015;

      gain.gain.setValueAtTime(vel * 0.75, pTime);
      gain.gain.exponentialRampToValueAtTime(0.001, pTime + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.output);

      noise.start(pTime);
      noise.stop(pTime + dur + 0.01);
    }
  }

  /**
   * 6. FM RESONANT TOM / PERCUSSION
   */
  _triggerPerc(t, vel) {
    const carrier = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    const basePitch = this.params.percTune;
    carrier.type = "sine";
    mod.type = "sine";

    carrier.frequency.setValueAtTime(basePitch * 1.5, t);
    carrier.frequency.exponentialRampToValueAtTime(basePitch, t + 0.06);

    mod.frequency.setValueAtTime(basePitch * 2.8, t);
    modGain.gain.setValueAtTime(basePitch * 2.2, t);
    modGain.gain.exponentialRampToValueAtTime(1, t + 0.12);

    mod.connect(modGain);
    modGain.connect(carrier.frequency);

    gain.gain.setValueAtTime(vel * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    carrier.connect(gain);
    gain.connect(this.output);

    carrier.start(t);
    mod.start(t);
    carrier.stop(t + 0.25);
    mod.stop(t + 0.25);
  }
}
