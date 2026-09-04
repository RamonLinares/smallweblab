# NeuSynth Prime • 6-Op FM Workstation

[![GitHub Pages](https://img.shields.io/badge/Live_Demo-GitHub_Pages-00f0ff?style=for-the-badge&logo=github)](https://ramonlineares.github.io/NeuSynth/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=for-the-badge)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0_Pure_Vanilla_JS-emerald.svg?style=for-the-badge)](#)

> **Live Synthesizer Workstation:** [https://ramonlineares.github.io/NeuSynth/](https://ramonlineares.github.io/NeuSynth/)

**NeuSynth Prime** is a tactile, hardware-grade **6-Operator FM Synthesizer Workstation** built entirely with pure vanilla Web Audio API, HTML5, CSS3 Neumorphism, and ES Modules. No build step, no framework, no npm dependencies.

---

## 🌟 Key Features

- **6-Operator FM Synthesis Engine**:
  - 8 classic DX-style routing algorithms with carrier/modulator matrices.
  - Per-operator frequency ratios, detune, feedback loops, and 4-stage ADSR envelopes.
  - High-precision polyphonic (up to 16 voices) and mono legato with glide / portamento.
- **24-Preset Curated Pro Sound Library**:
  - **⚡ European Trance**: *Euro Euphoria 99, Rolling 138 Bass, Dream Pluck, Ibiza Sunset Pad, Acid Trance 303*.
  - **🌑 Dark Beats & Industrial**: *Industrial Reese, EBM Body Pulse, Cyberpunk Screamer, Witch House Drone, Dark Matter Stabs*.
  - **🎛️ Berlin & Peak Techno**: *Berlin Rumble Kick, Minimal FM Perc, Rave Stab 92, Hypnotic Modular*.
  - **🌆 80s Synthwave**: *Neon Drive Pluck, Outrun Bassline, Vangelis Brass, Miami Night Glow*.
  - **🎹 Timeless Classics**: *Lately Bass, DX7 E-Piano, Analog Warmth Pad, Chiff Organ, Space Flute, Poly Strings*.
- **Integrated Genre Groove Kits & Auto-Load**:
  - Each preset pairs with its own genre-accurate BPM, 16-step melodic synth arpeggio, and 6-voice drum pattern.
- **6-Voice Analog & FM Drum Machine**:
  - Dedicated drum voices: **Kick, Snare, Closed Hi-Hat, Open Hi-Hat, Clap, and FM Percussion / Tom**.
  - Performance trigger pads with hotkeys (`1`–`6`) and velocity sensitivity.
- **16-Step Chase Sequencer & Step-Recording (`REC`)**:
  - Real-time step cursor with glowing crimson halo (`.rec-cursor`).
  - Active step pitch name display (`C3`, `D#3`, `G3`, or `—` for rests).
  - Dedicated **`REST / SKIP ❯`** button and keyboard shortcuts (`Right Arrow`, `Tab`).
  - Direct step jump by clicking any of the 16 step pads.
- **Dual Neumorphic Themes**:
  - **Obsidian Dark** (tactile studio console with cyan & amber neon illumination).
  - **Porcelain Light** (pristine ceramic hardware console).
- **Interactive BPM Controller**:
  - Stepper buttons (`+` / `−`), scrub/drag tempo wheel, direct numeric input, and rhythmic **TAP TEMPO**.
- **100% Client-Side Local File Storage**:
  - Export single patches or full bank archives as `.json`.
  - Drag & drop any `.json` preset file directly onto the synth window to load instantly.
- **Cyber-OLED Multi-View Screen**:
  - Real-time oscilloscope, multi-effects rack, envelope visualizers, operator matrices, 16-step sequencer columns, and 6-track drum grid.
- **Hardware Web MIDI Integration**:
  - Automatic hardware detection: plug in any USB/Bluetooth MIDI keyboard and play instantly.

---

## ⌨️ Controls & Keyboard Shortcuts

### Synth Keyboard
| Key | Action |
| :--- | :--- |
| `A S D F G H J K L ; '` | White Piano Keys ($C_3$ to $F_4$) |
| `W E T Y U O P` | Black Piano Keys ($C\#_3$, $D\#_3$, etc.) |
| `Z` / `X` | Shift Octave Down / Up |
| `Space` | Start / Stop Sequencer Playback |

### Drum Performance Hotkeys
| Key | Voice Triggered |
| :--- | :--- |
| `1` | 909 Analog Sub Kick |
| `2` | 808 Snappy Snare |
| `3` | Metallic Closed Hat |
| `4` | Sizzle Open Hat |
| `5` | Analog Handclap |
| `6` | FM Synthetic Tom / Percussion |

### Step-Recording (`REC`) Navigation
| Action | Toolbar Control | Keyboard Shortcut |
| :--- | :--- | :--- |
| **Record Pitch** | Piano / QWERTY keys | `A`, `W`, `S`, `D`, etc. |
| **Skip / Rest** | `REST / SKIP ❯` | `Right Arrow (→)` or `Tab` |
| **Previous Step** | `◀` | `Left Arrow (←)` |
| **Next Step** | `▶` | — |
| **Clear Step** | `CLEAR` | `Delete` or `Backspace` |
| **Direct Jump** | Click pad `1`–`16` | Pointer / Touch |

---

## 🚀 Running Locally

Because modern ES modules require HTTP/HTTPS (browser security policies block `file://` module imports), serve the repository with any local web server:

```bash
# Python 3
python3 -m http.server 8088

# Or Node.js npx serve
npx serve .
```

Then open `http://localhost:8088` in Google Chrome, Safari, Edge, or Firefox. Click **ACTIVATE AUDIO** (or press any key) to start the Web Audio engine.

---

## 📁 Project Architecture

```
NeuSynth/
├── index.html              # Main workstation HTML shell
├── .nojekyll               # Bypasses Jekyll for GitHub Pages static serving
├── css/
│   ├── neumorphism.css     # Soft UI shadow definitions & light/dark theme variables
│   └── style.css           # Console layout, OLED screen, sequencer pads, knobs & modals
├── js/
│   ├── app.js              # Application entry point & control surface wiring
│   ├── audio/
│   │   ├── engine.js       # 6-Op FM audio synthesis core, voice allocation, and drum voices
│   │   ├── effects.js      # Filter, overdrive distortion, stereo chorus, phaser, delay, reverb
│   │   ├── algorithms.js   # 8 DX FM operator routing configuration matrices
│   │   └── presets.js      # 24 production-ready genre presets with full groove kits
│   └── ui/
│       ├── keyboard.js     # Neumorphic piano keyboard, step pads, MIDI & QWERTY events
│       ├── sequencer.js    # Audio clock lookahead scheduler, step-recording, and drum sequencer
│       ├── screen.js       # Cyber-OLED display render views (Scope, FX, Env, Seq, Drums)
│       └── knob.js         # Neumorphic continuous 270° rotary controller
```

---

## 📄 License

MIT License. Designed and built with ❤️ for electronic music creators.
