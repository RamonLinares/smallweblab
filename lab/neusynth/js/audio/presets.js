/**
 * Curated Factory Sound Library & Genre Groove Kits for NeuSynth Prime
 * Includes 24 pro-crafted presets across 5 distinct genres:
 * - EURO TRANCE (138-140 BPM): Euphoric leads, rolling 138 bass, Miles plucks, dream pads, acid trance
 * - DARK BEATS & INDUSTRIAL (110-128 BPM): Dark Reese, EBM body pulse, cyberpunk screamers, witch house
 * - TECHNO & CLUB (128-132 BPM): Berlin hypnotic, Detroit chord stabs, warehouse sub rumble
 * - SYNTHWAVE & RETRO (108-120 BPM): Retro drive leads, neon glow chords, Outrun slap bass
 * - ESSENTIAL CLASSICS: DX7 tine piano, crystal bells, cyber brass, 303 acid, vintage strings, cosmic sfx
 */

function makeGroove(bpm, synthPattern, drumMap) {
  const synth = [];
  for (let i = 0; i < 16; i++) {
    const p = synthPattern ? synthPattern[i] : null;
    synth.push({
      active: p !== null && p !== undefined && p !== 0,
      note: typeof p === "object" && p !== null ? p.note : (p || 60),
      velocity: typeof p === "object" && p !== null ? (p.velocity || 0.9) : 0.9
    });
  }
  const drums = {};
  for (const voice of ["kick", "snare", "hihat", "openhat", "clap", "perc"]) {
    const activeIndices = (drumMap && drumMap[voice]) || [];
    drums[voice] = [];
    for (let i = 0; i < 16; i++) {
      drums[voice].push({
        active: activeIndices.includes(i),
        velocity: i % 4 === 0 ? 1.0 : 0.85
      });
    }
  }
  return { bpm, synth, drums };
}

export const GENRES = [
  "ALL",
  "EURO TRANCE",
  "DARK BEATS",
  "TECHNO",
  "SYNTHWAVE",
  "CLASSICS"
];

export const SYNTH_PRESETS = [
  // =========================================================================
  // 1. EURO TRANCE COLLECTION (138-140 BPM)
  // =========================================================================
  {
    id: 1,
    code: "001",
    name: "EURO ANTHEM LEAD",
    genre: "EURO TRANCE",
    desc: "Euphoric detuned supersaw FM lead with dotted-8th ping-pong delay and driving 138 BPM trance beat.",
    tempo: 138,
    algorithm: 7,
    voiceMode: "poly",
    glide: 0,
    operators: [
      { ratio: 1.0, detune: -7, level: 0.95, attack: 0.003, decay: 1.2, sustain: 0.85, release: 0.45, feedback: 0.6 },
      { ratio: 1.0, detune: 7, level: 0.95, attack: 0.003, decay: 1.2, sustain: 0.85, release: 0.45, feedback: 0.6 },
      { ratio: 1.0, detune: -3, level: 0.85, attack: 0.004, decay: 1.0, sustain: 0.8, release: 0.4, feedback: 0.5 },
      { ratio: 1.0, detune: 3, level: 0.85, attack: 0.004, decay: 1.0, sustain: 0.8, release: 0.4, feedback: 0.5 },
      { ratio: 2.0, detune: 0, level: 0.7, attack: 0.002, decay: 0.8, sustain: 0.7, release: 0.35, feedback: 0.4 },
      { ratio: 0.5, detune: 0, level: 0.5, attack: 0.005, decay: 1.4, sustain: 0.9, release: 0.5, feedback: 0.2 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 7200, resonance: 1.8, envAmount: 0.35 },
    effects: {
      distortion: { enabled: true, drive: 0.25, mix: 0.3 },
      chorus: { enabled: true, rate: 1.2, depth: 0.6, mix: 0.45 },
      phaser: { enabled: false, rate: 0.4, depth: 0.5, mix: 0.3 },
      delay: { enabled: true, time: 0.27, feedback: 0.45, mix: 0.35 },
      reverb: { enabled: true, decay: 3.2, mix: 0.45 }
    },
    groove: makeGroove(
      138,
      [69, 72, 76, 72, 69, 72, 76, 79, 67, 71, 74, 71, 65, 69, 72, 69], // Uplifting A min -> G -> F arpeggio
      {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], // 16th rolling hats
        openhat: [2, 6, 10, 14], // Classic offbeat sizzle
        clap: [12],
        perc: [15]
      }
    )
  },
  {
    id: 2,
    code: "002",
    name: "TRANCE PLUCK (MILES)",
    genre: "EURO TRANCE",
    desc: "Iconic 90s dream trance transient FM pluck with sparkling delay tail and uplifting melody.",
    tempo: 138,
    algorithm: 4,
    voiceMode: "poly",
    glide: 0,
    operators: [
      { ratio: 1.0, detune: 0, level: 0.9, attack: 0.002, decay: 0.35, sustain: 0.05, release: 0.25, feedback: 0 },
      { ratio: 3.0, detune: 1, level: 0.75, attack: 0.001, decay: 0.18, sustain: 0.01, release: 0.15, feedback: 0 },
      { ratio: 2.0, detune: -2, level: 0.65, attack: 0.002, decay: 0.3, sustain: 0.02, release: 0.2, feedback: 0 },
      { ratio: 4.0, detune: 2, level: 0.5, attack: 0.001, decay: 0.12, sustain: 0.0, release: 0.1, feedback: 0 },
      { ratio: 1.0, detune: 4, level: 0.6, attack: 0.002, decay: 0.4, sustain: 0.04, release: 0.2, feedback: 0 },
      { ratio: 1.0, detune: -4, level: 0.4, attack: 0.001, decay: 0.15, sustain: 0.0, release: 0.1, feedback: 0.5 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 5200, resonance: 2.2, envAmount: 0.45 },
    effects: {
      distortion: { enabled: false, drive: 0.1, mix: 0.1 },
      chorus: { enabled: true, rate: 1.4, depth: 0.5, mix: 0.4 },
      phaser: { enabled: false, rate: 0.3, depth: 0.4, mix: 0.2 },
      delay: { enabled: true, time: 0.28, feedback: 0.5, mix: 0.4 },
      reverb: { enabled: true, decay: 2.8, mix: 0.42 }
    },
    groove: makeGroove(
      138,
      [72, 70, 67, 65, 72, 70, 67, 63, 70, 68, 65, 63, 68, 67, 63, 60],
      {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        openhat: [2, 10],
        clap: [12],
        perc: [6, 14]
      }
    )
  },
  {
    id: 3,
    code: "003",
    name: "ROLLING 138 BASS",
    genre: "EURO TRANCE",
    desc: "Tight, punchy 16th-note rolling trance bassline with resonant envelope bite and driving sub.",
    tempo: 138,
    algorithm: 1,
    voiceMode: "mono",
    glide: 0.02,
    operators: [
      { ratio: 0.5, detune: 0, level: 0.95, attack: 0.002, decay: 0.22, sustain: 0.2, release: 0.08, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.8, attack: 0.001, decay: 0.18, sustain: 0.1, release: 0.06, feedback: 0 },
      { ratio: 0.5, detune: 0, level: 0.5, attack: 0.003, decay: 0.15, sustain: 0.05, release: 0.05, feedback: 0 },
      { ratio: 2.0, detune: 1, level: 0.4, attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.04, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.3, attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.04, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.65, attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.04, feedback: 0.7 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 1800, resonance: 4.5, envAmount: 0.7 },
    effects: {
      distortion: { enabled: true, drive: 0.35, mix: 0.4 },
      chorus: { enabled: false, rate: 0.8, depth: 0.3, mix: 0.2 },
      phaser: { enabled: false, rate: 0.4, depth: 0.4, mix: 0.2 },
      delay: { enabled: false, time: 0.2, feedback: 0.2, mix: 0.1 },
      reverb: { enabled: true, decay: 1.0, mix: 0.12 }
    },
    groove: makeGroove(
      138,
      [45, 45, 57, 45, 45, 57, 45, 45, 45, 45, 57, 45, 43, 45, 47, 45], // 16th rolling trance bass
      {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        openhat: [2, 6, 10, 14],
        clap: [12],
        perc: []
      }
    )
  },
  {
    id: 4,
    code: "004",
    name: "EUPHORIC DREAM PAD",
    genre: "EURO TRANCE",
    desc: "Celestial wide FM chord pad with slow chorus and cavernous reverb for breakdowns.",
    tempo: 136,
    algorithm: 8,
    voiceMode: "poly",
    glide: 0.08,
    lfo: { rate: 0.4, depth: 0.35, shape: "sine", dest: "filter" },
    operators: [
      { ratio: 1.0, detune: -6, level: 0.85, attack: 0.4, decay: 2.2, sustain: 0.9, release: 1.8, feedback: 0 },
      { ratio: 1.0, detune: 6, level: 0.85, attack: 0.45, decay: 2.2, sustain: 0.9, release: 1.8, feedback: 0 },
      { ratio: 2.0, detune: -3, level: 0.65, attack: 0.5, decay: 2.5, sustain: 0.85, release: 1.9, feedback: 0 },
      { ratio: 2.0, detune: 3, level: 0.65, attack: 0.5, decay: 2.5, sustain: 0.85, release: 1.9, feedback: 0 },
      { ratio: 0.5, detune: 0, level: 0.7, attack: 0.35, decay: 2.0, sustain: 0.95, release: 1.6, feedback: 0 },
      { ratio: 3.0, detune: 2, level: 0.4, attack: 0.6, decay: 3.0, sustain: 0.7, release: 2.0, feedback: 0.3 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 2800, resonance: 1.4, envAmount: 0.25 },
    effects: {
      distortion: { enabled: false, drive: 0.1, mix: 0.1 },
      chorus: { enabled: true, rate: 0.7, depth: 0.75, mix: 0.55 },
      phaser: { enabled: true, rate: 0.2, depth: 0.65, mix: 0.45 },
      delay: { enabled: true, time: 0.38, feedback: 0.5, mix: 0.4 },
      reverb: { enabled: true, decay: 4.2, mix: 0.6 }
    },
    groove: makeGroove(
      136,
      [60, 0, 64, 0, 67, 0, 71, 0, 65, 0, 69, 0, 72, 0, 76, 0],
      {
        kick: [0, 8],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        openhat: [6, 14],
        clap: [],
        perc: [10]
      }
    )
  },
  {
    id: 5,
    code: "005",
    name: "ACID TRANCE 303",
    genre: "EURO TRANCE",
    desc: "Screaming high-resonance acid chirp with portamento glide and heavy saturation (Kai Tracid style).",
    tempo: 140,
    algorithm: 1,
    voiceMode: "mono",
    glide: 0.08,
    operators: [
      { ratio: 1.0, detune: 0, level: 0.95, attack: 0.003, decay: 0.28, sustain: 0.4, release: 0.08, feedback: 0 },
      { ratio: 1.0, detune: 2, level: 0.85, attack: 0.002, decay: 0.22, sustain: 0.2, release: 0.06, feedback: 0 },
      { ratio: 2.0, detune: -1, level: 0.65, attack: 0.001, decay: 0.18, sustain: 0.1, release: 0.05, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.45, attack: 0.001, decay: 0.12, sustain: 0.05, release: 0.04, feedback: 0 },
      { ratio: 3.0, detune: 3, level: 0.35, attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.03, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.75, attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.03, feedback: 0.85 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 1600, resonance: 9.5, envAmount: 0.85 },
    effects: {
      distortion: { enabled: true, drive: 0.65, mix: 0.7 },
      chorus: { enabled: false, rate: 1.0, depth: 0.3, mix: 0.2 },
      phaser: { enabled: false, rate: 0.5, depth: 0.4, mix: 0.2 },
      delay: { enabled: true, time: 0.21, feedback: 0.45, mix: 0.35 },
      reverb: { enabled: true, decay: 1.8, mix: 0.28 }
    },
    groove: makeGroove(
      140,
      [48, 48, 60, 48, 51, 48, 58, 55, 48, 48, 60, 58, 51, 53, 55, 48],
      {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        openhat: [2, 6, 10, 14],
        clap: [12],
        perc: [7, 15]
      }
    )
  },

  // =========================================================================
  // 2. DARK BEATS & INDUSTRIAL COLLECTION (110-128 BPM)
  // =========================================================================
  {
    id: 6,
    code: "006",
    name: "DARK REESE BASS",
    genre: "DARK BEATS",
    desc: "Menacing, detuned industrial Reese bass with heavy overdrive and slow filter growl (Gesaffelstein / Cyberpunk).",
    tempo: 118,
    algorithm: 7,
    voiceMode: "mono",
    glide: 0.06,
    operators: [
      { ratio: 0.5, detune: -12, level: 0.95, attack: 0.01, decay: 0.8, sustain: 0.85, release: 0.25, feedback: 0.75 },
      { ratio: 0.5, detune: 12, level: 0.95, attack: 0.01, decay: 0.8, sustain: 0.85, release: 0.25, feedback: 0.75 },
      { ratio: 1.0, detune: -6, level: 0.7, attack: 0.02, decay: 0.6, sustain: 0.75, release: 0.2, feedback: 0.5 },
      { ratio: 1.0, detune: 6, level: 0.7, attack: 0.02, decay: 0.6, sustain: 0.75, release: 0.2, feedback: 0.5 },
      { ratio: 0.25, detune: 0, level: 0.8, attack: 0.005, decay: 1.0, sustain: 0.9, release: 0.3, feedback: 0.3 },
      { ratio: 1.5, detune: 2, level: 0.3, attack: 0.03, decay: 0.4, sustain: 0.4, release: 0.15, feedback: 0.4 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 1200, resonance: 4.8, envAmount: 0.55 },
    effects: {
      distortion: { enabled: true, drive: 0.7, mix: 0.75 },
      chorus: { enabled: true, rate: 0.5, depth: 0.6, mix: 0.35 },
      phaser: { enabled: false, rate: 0.3, depth: 0.4, mix: 0.2 },
      delay: { enabled: false, time: 0.25, feedback: 0.3, mix: 0.2 },
      reverb: { enabled: true, decay: 1.4, mix: 0.2 }
    },
    groove: makeGroove(
      118,
      [36, 0, 36, 0, 48, 0, 36, 0, 36, 0, 39, 0, 41, 0, 36, 0], // Heavy midtempo industrial stabs
      {
        kick: [0, 8],
        snare: [4, 12],
        hihat: [2, 6, 10, 14],
        openhat: [14],
        clap: [4, 12],
        perc: [3, 7, 11, 15]
      }
    )
  },
  {
    id: 7,
    code: "007",
    name: "EBM BODY PULSE",
    genre: "DARK BEATS",
    desc: "Aggressive, punchy 16th-note electro-body bass with raw transient bite and industrial claps (Front 242).",
    tempo: 126,
    algorithm: 1,
    voiceMode: "mono",
    glide: 0.03,
    operators: [
      { ratio: 0.5, detune: 0, level: 0.95, attack: 0.001, decay: 0.16, sustain: 0.25, release: 0.08, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.85, attack: 0.001, decay: 0.12, sustain: 0.1, release: 0.05, feedback: 0 },
      { ratio: 0.5, detune: 0, level: 0.6, attack: 0.002, decay: 0.1, sustain: 0.05, release: 0.05, feedback: 0 },
      { ratio: 2.0, detune: 1, level: 0.45, attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.04, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.35, attack: 0.001, decay: 0.06, sustain: 0.0, release: 0.04, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.7, attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.04, feedback: 0.75 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 2200, resonance: 4.2, envAmount: 0.65 },
    effects: {
      distortion: { enabled: true, drive: 0.55, mix: 0.55 },
      chorus: { enabled: false, rate: 0.8, depth: 0.3, mix: 0.2 },
      phaser: { enabled: false, rate: 0.4, depth: 0.3, mix: 0.2 },
      delay: { enabled: true, time: 0.24, feedback: 0.25, mix: 0.15 },
      reverb: { enabled: true, decay: 1.2, mix: 0.18 }
    },
    groove: makeGroove(
      126,
      [36, 48, 36, 48, 36, 48, 36, 48, 39, 51, 39, 51, 34, 46, 36, 48], // Classic 16th EBM bass pulse
      {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [2, 6, 10, 14],
        openhat: [10],
        clap: [4, 12],
        perc: [6, 14]
      }
    )
  },
  {
    id: 8,
    code: "008",
    name: "CYBERPUNK SCREAMER",
    genre: "DARK BEATS",
    desc: "Distorted, searing sync lead cutting through dark mixes with dirty feedback and tape flutter delay.",
    tempo: 124,
    algorithm: 2,
    voiceMode: "mono",
    glide: 0.07,
    operators: [
      { ratio: 1.0, detune: 0, level: 0.95, attack: 0.005, decay: 0.6, sustain: 0.7, release: 0.2, feedback: 0 },
      { ratio: 3.5, detune: 4, level: 0.8, attack: 0.002, decay: 0.4, sustain: 0.5, release: 0.15, feedback: 0 },
      { ratio: 1.0, detune: -3, level: 0.6, attack: 0.004, decay: 0.3, sustain: 0.4, release: 0.12, feedback: 0.4 },
      { ratio: 2.0, detune: 0, level: 0.85, attack: 0.006, decay: 0.5, sustain: 0.6, release: 0.2, feedback: 0 },
      { ratio: 5.0, detune: -5, level: 0.5, attack: 0.002, decay: 0.2, sustain: 0.2, release: 0.1, feedback: 0 },
      { ratio: 1.0, detune: 2, level: 0.7, attack: 0.001, decay: 0.15, sustain: 0.1, release: 0.08, feedback: 0.8 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 3800, resonance: 3.5, envAmount: 0.6 },
    effects: {
      distortion: { enabled: true, drive: 0.75, mix: 0.8 },
      chorus: { enabled: true, rate: 0.8, depth: 0.4, mix: 0.3 },
      phaser: { enabled: false, rate: 0.5, depth: 0.5, mix: 0.3 },
      delay: { enabled: true, time: 0.24, feedback: 0.45, mix: 0.35 },
      reverb: { enabled: true, decay: 2.4, mix: 0.35 }
    },
    groove: makeGroove(
      124,
      [60, 0, 63, 0, 65, 66, 65, 0, 63, 0, 60, 0, 58, 60, 63, 0],
      {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        openhat: [6, 14],
        clap: [12],
        perc: [2, 10]
      }
    )
  },
  {
    id: 9,
    code: "009",
    name: "WITCH HOUSE PLUCK",
    genre: "DARK BEATS",
    desc: "Haunting, inharmonic ghost bell with long cavernous reverb and slow pitch modulation.",
    tempo: 110,
    algorithm: 3,
    voiceMode: "poly",
    glide: 0.04,
    operators: [
      { ratio: 1.0, detune: 0, level: 0.85, attack: 0.003, decay: 1.8, sustain: 0.05, release: 1.2, feedback: 0 },
      { ratio: 2.76, detune: 5, level: 0.65, attack: 0.002, decay: 0.9, sustain: 0.02, release: 0.6, feedback: 0 },
      { ratio: 5.41, detune: -4, level: 0.5, attack: 0.001, decay: 0.7, sustain: 0.01, release: 0.4, feedback: 0 },
      { ratio: 7.12, detune: 6, level: 0.35, attack: 0.001, decay: 0.4, sustain: 0.0, release: 0.3, feedback: 0 },
      { ratio: 1.0, detune: -3, level: 0.7, attack: 0.004, decay: 1.5, sustain: 0.06, release: 1.0, feedback: 0 },
      { ratio: 8.88, detune: 0, level: 0.25, attack: 0.001, decay: 0.2, sustain: 0.0, release: 0.15, feedback: 0.3 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 2400, resonance: 2.0, envAmount: 0.3 },
    effects: {
      distortion: { enabled: true, drive: 0.3, mix: 0.3 },
      chorus: { enabled: true, rate: 0.4, depth: 0.7, mix: 0.45 },
      phaser: { enabled: true, rate: 0.15, depth: 0.7, mix: 0.4 },
      delay: { enabled: true, time: 0.45, feedback: 0.55, mix: 0.45 },
      reverb: { enabled: true, decay: 4.8, mix: 0.65 }
    },
    groove: makeGroove(
      110,
      [63, 0, 0, 66, 0, 70, 0, 0, 63, 0, 0, 68, 0, 66, 0, 0],
      {
        kick: [0, 6, 10],
        snare: [8],
        hihat: [0, 1, 2, 4, 6, 8, 9, 10, 12, 14, 15],
        openhat: [4, 12],
        clap: [8],
        perc: [11]
      }
    )
  },
  {
    id: 10,
    code: "010",
    name: "INDUSTRIAL CLANG",
    genre: "DARK BEATS",
    desc: "Metallic FM percussive mallet with sharp bite and metallic ring for industrial rhythms.",
    tempo: 128,
    algorithm: 6,
    voiceMode: "poly",
    glide: 0,
    operators: [
      { ratio: 1.0, detune: 0, level: 0.9, attack: 0.001, decay: 0.4, sustain: 0.02, release: 0.25, feedback: 0 },
      { ratio: 3.14, detune: 4, level: 0.75, attack: 0.001, decay: 0.25, sustain: 0.01, release: 0.18, feedback: 0 },
      { ratio: 5.82, detune: -6, level: 0.6, attack: 0.001, decay: 0.15, sustain: 0.0, release: 0.1, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.8, attack: 0.002, decay: 0.35, sustain: 0.03, release: 0.2, feedback: 0 },
      { ratio: 7.23, detune: 8, level: 0.45, attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.08, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.5, attack: 0.001, decay: 0.12, sustain: 0.0, release: 0.08, feedback: 0.6 }
    ],
    filter: { enabled: true, type: "highpass", cutoff: 350, resonance: 1.5, envAmount: 0 },
    effects: {
      distortion: { enabled: true, drive: 0.5, mix: 0.5 },
      chorus: { enabled: false, rate: 1.0, depth: 0.4, mix: 0.2 },
      phaser: { enabled: true, rate: 0.5, depth: 0.6, mix: 0.35 },
      delay: { enabled: true, time: 0.23, feedback: 0.4, mix: 0.3 },
      reverb: { enabled: true, decay: 3.2, mix: 0.45 }
    },
    groove: makeGroove(
      128,
      [60, 0, 60, 0, 72, 0, 60, 0, 60, 0, 75, 0, 60, 0, 67, 0],
      {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [2, 6, 10, 14],
        openhat: [14],
        clap: [12],
        perc: [2, 5, 10, 13]
      }
    )
  },
  {
    id: 11,
    code: "011",
    name: "HAUNTING DARK DRONE",
    genre: "DARK BEATS",
    desc: "Sub-bass rumble with slow LFO filter modulation and endless tape delay flutter.",
    tempo: 104,
    algorithm: 8,
    voiceMode: "mono",
    glide: 0.15,
    lfo: { rate: 0.2, depth: 0.5, shape: "sine", dest: "both" },
    operators: [
      { ratio: 0.25, detune: 0, level: 0.95, attack: 0.3, decay: 2.0, sustain: 0.9, release: 1.5, feedback: 0 },
      { ratio: 0.5, detune: -8, level: 0.8, attack: 0.4, decay: 1.8, sustain: 0.85, release: 1.4, feedback: 0.4 },
      { ratio: 0.5, detune: 8, level: 0.8, attack: 0.4, decay: 1.8, sustain: 0.85, release: 1.4, feedback: 0.4 },
      { ratio: 1.0, detune: -4, level: 0.5, attack: 0.5, decay: 2.2, sustain: 0.7, release: 1.2, feedback: 0 },
      { ratio: 1.414, detune: 5, level: 0.4, attack: 0.6, decay: 2.5, sustain: 0.6, release: 1.0, feedback: 0.5 },
      { ratio: 2.828, detune: -5, level: 0.3, attack: 0.7, decay: 3.0, sustain: 0.5, release: 1.0, feedback: 0.6 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 800, resonance: 3.2, envAmount: 0.4 },
    effects: {
      distortion: { enabled: true, drive: 0.4, mix: 0.45 },
      chorus: { enabled: true, rate: 0.3, depth: 0.8, mix: 0.55 },
      phaser: { enabled: true, rate: 0.1, depth: 0.8, mix: 0.6 },
      delay: { enabled: true, time: 0.55, feedback: 0.65, mix: 0.5 },
      reverb: { enabled: true, decay: 5.5, mix: 0.7 }
    },
    groove: makeGroove(
      104,
      [36, 0, 0, 0, 36, 0, 0, 0, 34, 0, 0, 0, 31, 0, 0, 0],
      {
        kick: [0, 8],
        snare: [4, 12],
        hihat: [2, 6, 10, 14],
        openhat: [],
        clap: [],
        perc: [7, 15]
      }
    )
  },

  // =========================================================================
  // 3. TECHNO & CLUB COLLECTION (128-132 BPM)
  // =========================================================================
  {
    id: 12,
    code: "012",
    name: "BERLIN HYPNOTIC",
    genre: "TECHNO",
    desc: "Minimalist modular techno blip passing through dark ping-pong delay and warehouse rumble.",
    tempo: 130,
    algorithm: 2,
    voiceMode: "mono",
    glide: 0.02,
    operators: [
      { ratio: 1.0, detune: 0, level: 0.9, attack: 0.002, decay: 0.2, sustain: 0.15, release: 0.08, feedback: 0 },
      { ratio: 1.414, detune: 3, level: 0.7, attack: 0.001, decay: 0.12, sustain: 0.05, release: 0.06, feedback: 0 },
      { ratio: 2.0, detune: -2, level: 0.5, attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.05, feedback: 0.4 },
      { ratio: 1.0, detune: 0, level: 0.6, attack: 0.003, decay: 0.25, sustain: 0.1, release: 0.08, feedback: 0 },
      { ratio: 3.5, detune: 4, level: 0.35, attack: 0.001, decay: 0.06, sustain: 0.0, release: 0.04, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.4, attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.04, feedback: 0.6 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 850, resonance: 4.5, envAmount: 0.6 },
    effects: {
      distortion: { enabled: true, drive: 0.35, mix: 0.4 },
      chorus: { enabled: false, rate: 0.8, depth: 0.3, mix: 0.2 },
      phaser: { enabled: false, rate: 0.4, depth: 0.4, mix: 0.2 },
      delay: { enabled: true, time: 0.23, feedback: 0.5, mix: 0.35 },
      reverb: { enabled: true, decay: 2.2, mix: 0.3 }
    },
    groove: makeGroove(
      130,
      [48, 0, 48, 51, 0, 48, 0, 53, 48, 0, 48, 55, 0, 53, 51, 48],
      {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        openhat: [2, 10],
        clap: [12],
        perc: [3, 7, 11, 15]
      }
    )
  },
  {
    id: 13,
    code: "013",
    name: "DETROIT CHORD STAB",
    genre: "TECHNO",
    desc: "Warm minor 9th harmonic chord stab with vintage stereo chorus and spring reverb.",
    tempo: 128,
    algorithm: 5,
    voiceMode: "poly",
    glide: 0,
    operators: [
      { ratio: 1.0, detune: 0, level: 0.9, attack: 0.005, decay: 0.45, sustain: 0.1, release: 0.3, feedback: 0 },
      { ratio: 1.5, detune: 2, level: 0.75, attack: 0.003, decay: 0.35, sustain: 0.05, release: 0.2, feedback: 0 },
      { ratio: 1.0, detune: -3, level: 0.7, attack: 0.005, decay: 0.4, sustain: 0.08, release: 0.25, feedback: 0 },
      { ratio: 2.5, detune: 1, level: 0.5, attack: 0.002, decay: 0.2, sustain: 0.02, release: 0.15, feedback: 0 },
      { ratio: 1.0, detune: 3, level: 0.6, attack: 0.005, decay: 0.4, sustain: 0.08, release: 0.25, feedback: 0 },
      { ratio: 3.0, detune: -2, level: 0.4, attack: 0.001, decay: 0.15, sustain: 0.01, release: 0.1, feedback: 0.4 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 3200, resonance: 2.2, envAmount: 0.45 },
    effects: {
      distortion: { enabled: false, drive: 0.2, mix: 0.2 },
      chorus: { enabled: true, rate: 1.1, depth: 0.6, mix: 0.45 },
      phaser: { enabled: false, rate: 0.4, depth: 0.4, mix: 0.2 },
      delay: { enabled: true, time: 0.29, feedback: 0.35, mix: 0.25 },
      reverb: { enabled: true, decay: 2.5, mix: 0.4 }
    },
    groove: makeGroove(
      128,
      [0, 60, 0, 0, 0, 60, 0, 60, 0, 0, 60, 0, 0, 63, 0, 60],
      {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        openhat: [2, 6, 10, 14],
        clap: [4, 12],
        perc: [14]
      }
    )
  },
  {
    id: 14,
    code: "014",
    name: "SUB BASS RUMBLE",
    genre: "TECHNO",
    desc: "Pure, deep 40 Hz sub-bass foundation designed for club sound systems.",
    tempo: 132,
    algorithm: 1,
    voiceMode: "mono",
    glide: 0.03,
    operators: [
      { ratio: 0.5, detune: 0, level: 1.0, attack: 0.005, decay: 0.35, sustain: 0.6, release: 0.15, feedback: 0 },
      { ratio: 0.5, detune: 0, level: 0.6, attack: 0.002, decay: 0.25, sustain: 0.2, release: 0.1, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.35, attack: 0.002, decay: 0.15, sustain: 0.05, release: 0.08, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.2, attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.05, feedback: 0 },
      { ratio: 0.5, detune: 0, level: 0.25, attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.05, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.35, attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.05, feedback: 0.3 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 450, resonance: 1.8, envAmount: 0.3 },
    effects: {
      distortion: { enabled: true, drive: 0.25, mix: 0.3 },
      chorus: { enabled: false, rate: 0.5, depth: 0.2, mix: 0.1 },
      phaser: { enabled: false, rate: 0.3, depth: 0.3, mix: 0.1 },
      delay: { enabled: false, time: 0.2, feedback: 0.2, mix: 0.1 },
      reverb: { enabled: false, decay: 1.0, mix: 0.1 }
    },
    groove: makeGroove(
      132,
      [36, 0, 36, 36, 0, 36, 0, 36, 36, 0, 36, 0, 36, 36, 0, 36],
      {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        openhat: [2, 10],
        clap: [12],
        perc: [6, 14]
      }
    )
  },

  // =========================================================================
  // 4. SYNTHWAVE & RETRO COLLECTION (108-120 BPM)
  // =========================================================================
  {
    id: 15,
    code: "015",
    name: "RETRO DRIVE LEAD",
    genre: "SYNTHWAVE",
    desc: "Warm brassy 80s analog-style lead with lush stereo chorus and analog delay (Kavinsky style).",
    tempo: 116,
    algorithm: 2,
    voiceMode: "poly",
    glide: 0.03,
    operators: [
      { ratio: 1.0, detune: 0, level: 0.9, attack: 0.04, decay: 1.0, sustain: 0.8, release: 0.35, feedback: 0 },
      { ratio: 1.0, detune: 4, level: 0.8, attack: 0.03, decay: 0.8, sustain: 0.65, release: 0.3, feedback: 0 },
      { ratio: 1.0, detune: -3, level: 0.6, attack: 0.02, decay: 0.6, sustain: 0.5, release: 0.25, feedback: 0.35 },
      { ratio: 2.0, detune: 0, level: 0.85, attack: 0.05, decay: 1.2, sustain: 0.75, release: 0.4, feedback: 0 },
      { ratio: 2.0, detune: -4, level: 0.6, attack: 0.04, decay: 0.9, sustain: 0.55, release: 0.3, feedback: 0 },
      { ratio: 2.0, detune: 4, level: 0.45, attack: 0.02, decay: 0.5, sustain: 0.35, release: 0.2, feedback: 0.5 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 3600, resonance: 2.4, envAmount: 0.5 },
    effects: {
      distortion: { enabled: true, drive: 0.3, mix: 0.35 },
      chorus: { enabled: true, rate: 0.95, depth: 0.6, mix: 0.45 },
      phaser: { enabled: false, rate: 0.4, depth: 0.4, mix: 0.2 },
      delay: { enabled: true, time: 0.32, feedback: 0.38, mix: 0.3 },
      reverb: { enabled: true, decay: 2.6, mix: 0.35 }
    },
    groove: makeGroove(
      116,
      [60, 0, 63, 0, 67, 0, 70, 72, 70, 0, 67, 0, 65, 0, 63, 0],
      {
        kick: [0, 6, 8, 14],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        openhat: [10],
        clap: [4, 12],
        perc: [15]
      }
    )
  },
  {
    id: 16,
    code: "016",
    name: "NEON GLOW CHORD",
    genre: "SYNTHWAVE",
    desc: "Shimmering Poly-800 FM chord wash bathed in analog chorus and spatial reverb.",
    tempo: 112,
    algorithm: 7,
    voiceMode: "poly",
    glide: 0.04,
    operators: [
      { ratio: 1.0, detune: -4, level: 0.85, attack: 0.08, decay: 1.8, sustain: 0.85, release: 0.8, feedback: 0.3 },
      { ratio: 1.0, detune: 4, level: 0.85, attack: 0.08, decay: 1.8, sustain: 0.85, release: 0.8, feedback: 0.3 },
      { ratio: 2.0, detune: -2, level: 0.65, attack: 0.1, decay: 1.5, sustain: 0.7, release: 0.7, feedback: 0 },
      { ratio: 2.0, detune: 2, level: 0.65, attack: 0.1, decay: 1.5, sustain: 0.7, release: 0.7, feedback: 0 },
      { ratio: 0.5, detune: 0, level: 0.7, attack: 0.06, decay: 1.6, sustain: 0.9, release: 0.9, feedback: 0 },
      { ratio: 3.0, detune: 1, level: 0.4, attack: 0.12, decay: 1.2, sustain: 0.5, release: 0.6, feedback: 0.3 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 4200, resonance: 1.6, envAmount: 0.3 },
    effects: {
      distortion: { enabled: false, drive: 0.1, mix: 0.1 },
      chorus: { enabled: true, rate: 1.2, depth: 0.7, mix: 0.55 },
      phaser: { enabled: true, rate: 0.25, depth: 0.5, mix: 0.35 },
      delay: { enabled: true, time: 0.36, feedback: 0.4, mix: 0.3 },
      reverb: { enabled: true, decay: 3.6, mix: 0.5 }
    },
    groove: makeGroove(
      112,
      [60, 0, 0, 60, 0, 0, 63, 0, 65, 0, 0, 65, 0, 0, 67, 0],
      {
        kick: [0, 8],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        openhat: [6, 14],
        clap: [12],
        perc: [10]
      }
    )
  },
  {
    id: 17,
    code: "017",
    name: "OUTRUN SLAP BASS",
    genre: "SYNTHWAVE",
    desc: "Punchy 80s FM slap bass with crisp transient pop and chorus warmth.",
    tempo: 118,
    algorithm: 1,
    voiceMode: "mono",
    glide: 0.03,
    operators: [
      { ratio: 0.5, detune: 0, level: 0.95, attack: 0.002, decay: 0.3, sustain: 0.3, release: 0.12, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.8, attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.08, feedback: 0 },
      { ratio: 0.5, detune: 0, level: 0.5, attack: 0.003, decay: 0.15, sustain: 0.05, release: 0.06, feedback: 0 },
      { ratio: 3.0, detune: 1, level: 0.45, attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.04, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.3, attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.04, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.6, attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.04, feedback: 0.7 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 2400, resonance: 3.6, envAmount: 0.65 },
    effects: {
      distortion: { enabled: true, drive: 0.3, mix: 0.35 },
      chorus: { enabled: true, rate: 0.9, depth: 0.45, mix: 0.35 },
      phaser: { enabled: false, rate: 0.4, depth: 0.4, mix: 0.2 },
      delay: { enabled: false, time: 0.2, feedback: 0.2, mix: 0.1 },
      reverb: { enabled: true, decay: 1.2, mix: 0.18 }
    },
    groove: makeGroove(
      118,
      [36, 0, 36, 48, 0, 36, 0, 48, 36, 0, 39, 0, 41, 0, 36, 48],
      {
        kick: [0, 6, 8, 14],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        openhat: [10],
        clap: [4, 12],
        perc: []
      }
    )
  },

  // =========================================================================
  // 5. ESSENTIAL CLASSICS COLLECTION
  // =========================================================================
  {
    id: 18,
    code: "018",
    name: "DX7 TINE PIANO",
    genre: "CLASSICS",
    desc: "Legendary 1983 crystal FM electric piano with crisp bell transient and warm chorus body.",
    tempo: 120,
    algorithm: 5,
    voiceMode: "poly",
    glide: 0,
    operators: [
      { ratio: 1.0, detune: 0, level: 0.9, attack: 0.005, decay: 1.8, sustain: 0.35, release: 0.6, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.65, attack: 0.002, decay: 0.8, sustain: 0.05, release: 0.3, feedback: 0 },
      { ratio: 1.0, detune: 2, level: 0.7, attack: 0.005, decay: 1.5, sustain: 0.25, release: 0.5, feedback: 0 },
      { ratio: 3.0, detune: -1, level: 0.45, attack: 0.002, decay: 0.4, sustain: 0.01, release: 0.2, feedback: 0 },
      { ratio: 1.0, detune: -3, level: 0.5, attack: 0.01, decay: 2.0, sustain: 0.3, release: 0.7, feedback: 0 },
      { ratio: 14.0, detune: 1, level: 0.35, attack: 0.001, decay: 0.15, sustain: 0.0, release: 0.1, feedback: 0.4 } // High crystal tine
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 5800, resonance: 1.2, envAmount: 0.3 },
    effects: {
      distortion: { enabled: false, drive: 0.2, mix: 0.3 },
      chorus: { enabled: true, rate: 0.8, depth: 0.5, mix: 0.4 },
      phaser: { enabled: false, rate: 0.4, depth: 0.5, mix: 0.4 },
      delay: { enabled: true, time: 0.28, feedback: 0.3, mix: 0.2 },
      reverb: { enabled: true, decay: 2.2, mix: 0.35 }
    },
    groove: makeGroove(
      120,
      [60, 0, 64, 0, 67, 0, 71, 0, 69, 0, 65, 0, 64, 0, 62, 0],
      {
        kick: [0, 8],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        openhat: [10],
        clap: [],
        perc: [14]
      }
    )
  },
  {
    id: 19,
    code: "019",
    name: "CRYSTAL BELLS",
    genre: "CLASSICS",
    desc: "Glistening inharmonic ice bells with extended sparkling decay and shimmering hall reverb.",
    tempo: 115,
    algorithm: 3,
    voiceMode: "poly",
    glide: 0,
    operators: [
      { ratio: 1.0, detune: 0, level: 0.85, attack: 0.002, decay: 2.5, sustain: 0.1, release: 1.8, feedback: 0 },
      { ratio: 3.5, detune: 3, level: 0.6, attack: 0.001, decay: 1.2, sustain: 0.02, release: 0.8, feedback: 0 },
      { ratio: 5.25, detune: -2, level: 0.45, attack: 0.001, decay: 0.9, sustain: 0.01, release: 0.6, feedback: 0 },
      { ratio: 7.0, detune: 4, level: 0.35, attack: 0.001, decay: 0.6, sustain: 0.0, release: 0.4, feedback: 0 },
      { ratio: 1.0, detune: -1, level: 0.7, attack: 0.002, decay: 2.2, sustain: 0.08, release: 1.5, feedback: 0 },
      { ratio: 9.0, detune: 0, level: 0.25, attack: 0.001, decay: 0.3, sustain: 0.0, release: 0.2, feedback: 0.2 }
    ],
    filter: { enabled: true, type: "highpass", cutoff: 200, resonance: 0.8, envAmount: 0 },
    effects: {
      distortion: { enabled: false, drive: 0.1, mix: 0.1 },
      chorus: { enabled: true, rate: 1.5, depth: 0.6, mix: 0.45 },
      phaser: { enabled: false, rate: 0.3, depth: 0.4, mix: 0.3 },
      delay: { enabled: true, time: 0.32, feedback: 0.45, mix: 0.35 },
      reverb: { enabled: true, decay: 3.5, mix: 0.55 }
    },
    groove: makeGroove(
      115,
      [72, 0, 76, 0, 79, 0, 83, 0, 84, 0, 79, 0, 76, 0, 72, 0],
      {
        kick: [0, 8],
        snare: [4, 12],
        hihat: [0, 4, 8, 12],
        openhat: [12],
        clap: [],
        perc: [6, 14]
      }
    )
  },
  {
    id: 20,
    code: "020",
    name: "CYBER BRASS",
    genre: "CLASSICS",
    desc: "Powerful 6-op FM brass section with rich harmonic swell and chorus width.",
    tempo: 122,
    algorithm: 2,
    voiceMode: "poly",
    glide: 0.02,
    operators: [
      { ratio: 1.0, detune: 0, level: 0.9, attack: 0.06, decay: 1.2, sustain: 0.8, release: 0.35, feedback: 0 },
      { ratio: 1.0, detune: 3, level: 0.75, attack: 0.05, decay: 0.8, sustain: 0.6, release: 0.3, feedback: 0 },
      { ratio: 1.0, detune: -2, level: 0.55, attack: 0.04, decay: 0.6, sustain: 0.4, release: 0.25, feedback: 0.3 },
      { ratio: 2.0, detune: 0, level: 0.85, attack: 0.08, decay: 1.4, sustain: 0.7, release: 0.4, feedback: 0 },
      { ratio: 2.0, detune: -4, level: 0.6, attack: 0.06, decay: 0.9, sustain: 0.55, release: 0.3, feedback: 0 },
      { ratio: 2.0, detune: 4, level: 0.4, attack: 0.04, decay: 0.5, sustain: 0.3, release: 0.2, feedback: 0.5 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 3200, resonance: 2.2, envAmount: 0.5 },
    effects: {
      distortion: { enabled: true, drive: 0.25, mix: 0.3 },
      chorus: { enabled: true, rate: 0.9, depth: 0.5, mix: 0.4 },
      phaser: { enabled: false, rate: 0.5, depth: 0.5, mix: 0.3 },
      delay: { enabled: true, time: 0.25, feedback: 0.3, mix: 0.2 },
      reverb: { enabled: true, decay: 2.0, mix: 0.3 }
    },
    groove: makeGroove(
      122,
      [60, 0, 60, 0, 65, 0, 65, 0, 67, 0, 67, 0, 72, 70, 67, 65],
      {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        openhat: [10],
        clap: [12],
        perc: [14]
      }
    )
  },
  {
    id: 21,
    code: "021",
    name: "RESO ACID 303",
    genre: "CLASSICS",
    desc: "Classic TB-303 square/saw chirp with screaming resonance and overdrive saturation.",
    tempo: 130,
    algorithm: 1,
    voiceMode: "mono",
    glide: 0.08,
    operators: [
      { ratio: 1.0, detune: 0, level: 0.9, attack: 0.005, decay: 0.3, sustain: 0.5, release: 0.1, feedback: 0 },
      { ratio: 1.0, detune: 2, level: 0.8, attack: 0.002, decay: 0.25, sustain: 0.3, release: 0.08, feedback: 0 },
      { ratio: 2.0, detune: -1, level: 0.6, attack: 0.002, decay: 0.2, sustain: 0.2, release: 0.06, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.4, attack: 0.001, decay: 0.15, sustain: 0.1, release: 0.05, feedback: 0 },
      { ratio: 3.0, detune: 3, level: 0.3, attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.04, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.7, attack: 0.001, decay: 0.12, sustain: 0.0, release: 0.04, feedback: 0.8 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 1400, resonance: 9.0, envAmount: 0.8 },
    effects: {
      distortion: { enabled: true, drive: 0.6, mix: 0.65 },
      chorus: { enabled: false, rate: 1.2, depth: 0.3, mix: 0.2 },
      phaser: { enabled: false, rate: 0.6, depth: 0.5, mix: 0.3 },
      delay: { enabled: true, time: 0.22, feedback: 0.45, mix: 0.3 },
      reverb: { enabled: true, decay: 1.8, mix: 0.25 }
    },
    groove: makeGroove(
      130,
      [48, 48, 60, 48, 51, 48, 58, 55, 48, 48, 60, 58, 51, 53, 55, 48],
      {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        openhat: [2, 10],
        clap: [12],
        perc: [6, 14]
      }
    )
  },
  {
    id: 22,
    code: "022",
    name: "VINTAGE STRINGS",
    genre: "CLASSICS",
    desc: "Warm slow-attack polyphonic string ensemble with ensemble chorus and hall reverb.",
    tempo: 110,
    algorithm: 7,
    voiceMode: "poly",
    glide: 0.05,
    operators: [
      { ratio: 1.0, detune: -5, level: 0.85, attack: 0.25, decay: 1.8, sustain: 0.9, release: 1.2, feedback: 0 },
      { ratio: 1.0, detune: 5, level: 0.85, attack: 0.25, decay: 1.8, sustain: 0.9, release: 1.2, feedback: 0 },
      { ratio: 2.0, detune: -2, level: 0.65, attack: 0.3, decay: 2.0, sustain: 0.85, release: 1.4, feedback: 0.2 },
      { ratio: 2.0, detune: 2, level: 0.65, attack: 0.3, decay: 2.0, sustain: 0.85, release: 1.4, feedback: 0.2 },
      { ratio: 0.5, detune: 0, level: 0.7, attack: 0.2, decay: 1.5, sustain: 0.95, release: 1.0, feedback: 0 },
      { ratio: 3.0, detune: 1, level: 0.35, attack: 0.35, decay: 2.2, sustain: 0.7, release: 1.5, feedback: 0.2 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 3500, resonance: 1.4, envAmount: 0.25 },
    effects: {
      distortion: { enabled: false, drive: 0.1, mix: 0.1 },
      chorus: { enabled: true, rate: 0.9, depth: 0.7, mix: 0.55 },
      phaser: { enabled: false, rate: 0.3, depth: 0.4, mix: 0.2 },
      delay: { enabled: true, time: 0.35, feedback: 0.4, mix: 0.25 },
      reverb: { enabled: true, decay: 3.5, mix: 0.5 }
    },
    groove: makeGroove(
      110,
      [60, 0, 64, 0, 67, 0, 71, 0, 65, 0, 69, 0, 72, 0, 76, 0],
      {
        kick: [0, 8],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        openhat: [14],
        clap: [],
        perc: [10]
      }
    )
  },
  {
    id: 23,
    code: "023",
    name: "COSMIC SFX",
    genre: "CLASSICS",
    desc: "Complex inharmonic FM modulation sweeps and laser pings from deep space.",
    tempo: 120,
    algorithm: 2,
    voiceMode: "mono",
    glide: 0.12,
    lfo: { rate: 5.5, depth: 0.3, shape: "sine", dest: "both" },
    operators: [
      { ratio: 0.25, detune: 0, level: 0.85, attack: 0.1, decay: 1.5, sustain: 0.7, release: 0.8, feedback: 0 },
      { ratio: 1.414, detune: 8, level: 0.75, attack: 0.2, decay: 1.2, sustain: 0.5, release: 0.7, feedback: 0 },
      { ratio: 2.828, detune: -7, level: 0.6, attack: 0.05, decay: 0.8, sustain: 0.3, release: 0.5, feedback: 0.7 },
      { ratio: 0.5, detune: -10, level: 0.8, attack: 0.15, decay: 1.8, sustain: 0.6, release: 0.9, feedback: 0 },
      { ratio: 3.1415, detune: 12, level: 0.65, attack: 0.3, decay: 1.0, sustain: 0.4, release: 0.6, feedback: 0 },
      { ratio: 5.656, detune: 0, level: 0.4, attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.4, feedback: 0.5 }
    ],
    filter: { enabled: true, type: "bandpass", cutoff: 900, resonance: 2.5, envAmount: 0.7 },
    effects: {
      distortion: { enabled: true, drive: 0.45, mix: 0.5 },
      chorus: { enabled: true, rate: 0.4, depth: 0.8, mix: 0.6 },
      phaser: { enabled: true, rate: 0.8, depth: 0.8, mix: 0.7 },
      delay: { enabled: true, time: 0.42, feedback: 0.6, mix: 0.5 },
      reverb: { enabled: true, decay: 4.8, mix: 0.6 }
    },
    groove: makeGroove(
      120,
      [72, 0, 60, 0, 75, 0, 63, 0, 77, 0, 65, 0, 84, 0, 67, 0],
      {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [2, 6, 10, 14],
        openhat: [6, 14],
        clap: [12],
        perc: [3, 7, 11, 15]
      }
    )
  },
  {
    id: 24,
    code: "024",
    name: "MONO BASS 90s",
    genre: "CLASSICS",
    desc: "Authentic 90s organ-bass with solid punch and short percussive decay (Robin S style).",
    tempo: 124,
    algorithm: 1,
    voiceMode: "mono",
    glide: 0.03,
    operators: [
      { ratio: 0.5, detune: 0, level: 0.95, attack: 0.002, decay: 0.35, sustain: 0.5, release: 0.12, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.75, attack: 0.002, decay: 0.25, sustain: 0.15, release: 0.08, feedback: 0 },
      { ratio: 0.5, detune: 0, level: 0.4, attack: 0.004, decay: 0.18, sustain: 0.05, release: 0.08, feedback: 0 },
      { ratio: 2.0, detune: 1, level: 0.35, attack: 0.001, decay: 0.12, sustain: 0.0, release: 0.05, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.2, attack: 0.001, decay: 0.08, sustain: 0.0, release: 0.04, feedback: 0 },
      { ratio: 1.0, detune: 0, level: 0.5, attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.04, feedback: 0.6 }
    ],
    filter: { enabled: true, type: "lowpass", cutoff: 2600, resonance: 3.2, envAmount: 0.55 },
    effects: {
      distortion: { enabled: true, drive: 0.3, mix: 0.35 },
      chorus: { enabled: false, rate: 0.9, depth: 0.3, mix: 0.2 },
      phaser: { enabled: false, rate: 0.4, depth: 0.4, mix: 0.2 },
      delay: { enabled: false, time: 0.2, feedback: 0.2, mix: 0.1 },
      reverb: { enabled: true, decay: 1.1, mix: 0.15 }
    },
    groove: makeGroove(
      124,
      [45, 0, 45, 0, 48, 0, 45, 0, 50, 0, 48, 0, 45, 0, 43, 45],
      {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [2, 6, 10, 14],
        openhat: [2, 10],
        clap: [4, 12],
        perc: [7, 15]
      }
    )
  }
];
