---
title: "Building NeuSynth Prime: A Browser-Based 6-Operator FM Workstation"
slug: "building-neusynth-prime-fm-workstation"
description: "Field notes on designing and building an in-browser 6-operator FM synthesizer, 16-step sequencer, and drum machine using vanilla Web Audio API and Neumorphic UI."
date: "2026-09-04T18:50:00+02:00"
category: "lab"
tags: ["Web Audio API", "Synthesizer", "Neumorphism", "FM Synthesis", "JavaScript", "Music Production", "AI Build"]
coverImage: "/content/images/neusynth-prime-cover.png"
draft: false
---

[Explore NeuSynth Prime on GitHub](https://github.com/RamonLinares/NeuSynth)  
[Play NeuSynth Prime live on GitHub Pages](https://ramonlinarespallares.github.io/NeuSynth/)

This project started with a straightforward goal: build a tactile, hardware-grade 6-operator FM groove synthesizer in the browser using pure vanilla Web Audio API, HTML5, and CSS. It has no build step, no npm dependencies, and runs entirely client-side.

Over several iterations, the project grew from a basic prototype into a complete workstation called **NeuSynth Prime**, featuring a 6-operator FM engine, an integrated 6-voice drum machine, a 16-step sequencer with hardware-style step recording, a 24-preset curated sound library with full groove kits, local file storage, and dual Neumorphic themes.

Here is an account of how it was built, the architectural decisions made along the way, the bugs encountered, and how they were resolved.

---

## 1. The Core Synthesis Architecture

The audio core lives in `js/audio/` and is divided into four focused modules:

```
js/audio/
├── engine.js       # Voice allocation, operator routing, FM modulation, and drums
├── algorithms.js   # 8 DX-style FM algorithm routing tables
├── effects.js      # Filter, overdrive distortion, stereo chorus, phaser, delay, reverb
└── presets.js      # 24 genre sound scenes with full groove kits
```

### 6-Operator FM Synthesis
Frequency Modulation synthesis relies on using the output of one audio-rate oscillator (the modulator) to modulate the frequency input of another (the carrier). When the modulation index increases, rich sidebands appear, creating metallic, glassy, bell-like, or aggressive brassy harmonics.

In NeuSynth, each polyphonic voice contains:
- **6 Operators**: Each operator is an independent oscillator (`OscillatorNode`) connected through a dedicated gain node (`GainNode`) acting as the operator's output level and envelope.
- **Envelope Generators**: Each operator has its own 4-stage ADSR envelope using Web Audio scheduled parameter curves (`linearRampToValueAtTime` and `setTargetAtTime`).
- **Feedback Loops**: Certain operators (like Operator 6 in Algorithm 1) feed their output back into their own frequency input through a sub-millisecond delay and feedback gain to produce white noise or saw-like harmonic spectra.

### Algorithm Matrix
The 8 FM algorithms from classic hardware are mapped as adjacency tables in `algorithms.js`. Carriers connect directly to the voice output bus; modulators route into the `frequency` AudioParam of their target operators:

```javascript
// Example: Algorithm 1 (DX7 classic stack)
// Op 6 feeds itself, modulates Op 5, modulates Op 4, modulates Op 3, modulates Op 2, modulates Op 1 (Carrier)
1: {
  carriers: [0],
  connections: [
    { from: 5, to: 4 },
    { from: 4, to: 3 },
    { from: 3, to: 2 },
    { from: 2, to: 1 },
    { from: 1, to: 0 }
  ],
  feedback: [{ from: 5, to: 5 }]
}
```

When an algorithm changes, `reconnectAlgorithm()` dynamically updates the Web Audio graph for all active voices without destroying the underlying oscillator nodes.

---

## 2. Interface Design: Neumorphic Console & Dual Themes

The UI was designed to balance the physical appeal of hardware grooveboxes with the clarity of a modern digital workstation.

### Obsidian Dark & Porcelain Light Themes
The chassis uses soft-bevel Neumorphic shadows (`var(--neu-convex)`, `var(--neu-concave)`, and `var(--neu-pressed)`) defined in `css/neumorphism.css`:
- **Obsidian Dark**: A matte, dark-slate chassis with recessed control sockets, illuminated cyan status badges, and glowing amber active indicators.
- **Porcelain Light**: A clean, light ceramic hardware aesthetic with subtle drop shadows and crisp typography.

### Cyber-OLED Multi-View Display
The central OLED display (`js/ui/screen.js`) provides real-time visual feedback across multiple functional views:
- **Scope View**: An interactive 60 FPS real-time oscilloscope powered by an `AnalyserNode`.
- **Effects View**: Dynamic tiles showing the on/off status and parameters for the 6 serial effects (Filter, Drive, Chorus, Phaser, Delay, Reverb).
- **Envelope View**: Vector bezier curves visualizing the ADSR shapes of all 6 operators simultaneously.
- **Operators View**: Coarse/fine tuning, detune, level meters, and feedback controls.
- **Sequencer View**: 16 velocity-scaled column bars with real-time chase lighting.
- **Drums View**: A 6-track step matrix grid showing all 16 steps across all 6 percussion voices.

---

## 3. Drum Machine & Curated Genre Sound Library

FM leads and basslines sound best in rhythmic context. To make the synthesizer immediately playable, we added an integrated percussion section and production-ready sound scenes.

### 6-Voice Percussion Engine (`js/audio/drums.js`)
Rather than loading external sample files (which introduce network latency and CORS issues), the 6 percussion voices are synthesized on the fly using Web Audio primitives:
1. **Kick**: 909-style punchy pitch-dropped sine wave (140 Hz sweeping down to 38 Hz in 45ms) with a subtle click transient.
2. **Snare**: 808-style body tone combined with high-pass filtered white noise burst.
3. **Closed Hi-Hat**: Short metallic bandpass noise transient with a 35ms decay.
4. **Open Hi-Hat**: Resonant bandpass noise with a 280ms decay.
5. **Clap**: Multistage micro-bursts of filtered noise mimicking rapid handclaps.
6. **Perc / Tom**: Resonant FM sine burst with pitch drop for syncopated accents.

The trigger pads above the piano keyboard can be clicked directly or played using number keys `1` through `6` on the computer keyboard.

### 24 Curated Presets with Full Groove Kits
The preset library in `js/audio/presets.js` was expanded into 5 genres:
- **European Trance (138–142 BPM)**: *Euro Euphoria 99, Rolling 138 Bass, Dream Pluck, Ibiza Sunset Pad, Acid Trance 303*.
- **Dark Beats & Industrial (105–124 BPM)**: *Industrial Reese, EBM Body Pulse, Cyberpunk Screamer, Witch House Drone, Dark Matter Stabs*.
- **Berlin Techno (130–135 BPM)**: *Berlin Rumble Kick, Minimal FM Perc, Rave Stab 92, Hypnotic Modular*.
- **80s Synthwave (110–120 BPM)**: *Neon Drive Pluck, Outrun Bassline, Vangelis Brass, Miami Night Glow*.
- **Timeless Classics**: *Lately Bass, DX7 E-Piano, Analog Warmth, Chiff Organ, Space Flute, Poly Strings*.

Each preset is an entire **Genre Scene**: loading a preset configures the FM operator parameters, the effects chain, the BPM, a genre-specific 16-step synth arpeggio, and a 6-voice drum pattern.

---

## 4. Hardware-Style Step Recording (`REC`)

Programming melodic sequences note-by-note is a core feature of classic grooveboxes. We designed a step-recording mode (`REC`) with visual clarity:

1. **Active Step Cursor (`.rec-cursor`)**: When `REC` is active, the targeted step pad glows with a pulsing crimson halo, illuminating its step number, note pitch, and LED dot in red.
2. **Real-Time Note Readout**: Active steps display their note name (`C3`, `D#3`, `G3`, etc.), while inactive steps show a clean rest dash (`—`).
3. **Header Status Badge**: The top sequencer bar displays a live readout: `● REC STEP 3: D#3`.
4. **Rest / Skip Controls**:
   - A dedicated **`REST / SKIP ❯`** button sets the current step to a rest and advances the cursor.
   - Keyboard shortcuts: `Right Arrow` or `Tab` skip forward; `Left Arrow` steps back; `Delete` or `Backspace` clears the step note.
5. **Direct Pad Jump**: Clicking any of the 16 step pads immediately jumps the recording cursor to that exact step.

Playing any note on the piano keys, computer QWERTY keyboard, or an external MIDI controller writes that pitch to the active step and advances the cursor to the next step.

---

## 5. Challenges Encountered & Bug Fixes

Building a zero-dependency Web Audio application uncovered several subtle edge cases.

### Bug 1: Audio Clicks When Switching Presets
**Symptom**: When changing presets while notes were ringing out or while the sequencer was running, the audio crackled or clicked loudly for a second or two.  
**Cause**: Disconnecting `GainNode` or `OscillatorNode` connections while audio energy was flowing produced an instantaneous step discontinuity (DC jump). Additionally, resetting delay lines and feedback buffers without clearing lingering feedback energy created brief chaotic oscillations.  
**Fix**: Added a smooth 15ms exponential fade-down ramp across all voice master gains before disconnecting. The algorithm reconnection was placed inside a fast crossfade window, and delay nodes were flushed cleanly before new audio was introduced.

### Bug 2: Modulation Strip Clipping and Disappearing
**Symptom**: The vertical slider to the right of the keyboard could only be moved from the center downward, and dragging it to the bottom made the thumb disappear entirely.  
**Cause**: In `css/style.css`, `.mod-strip` was styled with `display: flex; align-items: center;`, which vertically centered the thumb at 50% by default. The JavaScript drag listener then calculated `translateY((1 - norm) * 60px)`. At `norm = 1.0` (top), `translateY(0)` left the thumb in the middle. At `norm = 0.0` (bottom), `translateY(60px)` pushed the thumb from the middle past the 90px container height, clipping it out of view.  
**Fix**: Removed flexbox centering in favor of absolute coordinate positioning (`top: 4px; left: 4px;`). Recalculated travel distance using exact container boundaries: `maxTravel = height - thumbHeight - padding`. The thumb now smoothly travels the full track from top to bottom, never clips, and is accompanied by a dynamic cyan LED level track and pointer-capture dragging.

### Bug 3: Relative Path Resolution on GitHub Pages
**Symptom**: When deploying a static site to GitHub Pages under a subpath (e.g. `https://username.github.io/repository-name/`), absolute paths like `/css/style.css` or `/js/app.js` return 404 errors because they resolve to the domain root instead of the repository directory.  
**Fix**: Ensured all asset links in `index.html` and ES module import statements in JavaScript use relative paths (`css/style.css`, `./js/app.js`, etc.). Added an empty `.nojekyll` file in the root directory to prevent GitHub's Jekyll pipeline from filtering out files and folders.

---

## 6. Local Storage & Offline File Management

To avoid requiring user logins or cloud databases, all user preset saves and sound backups run 100% locally in the browser:
- **Save to Local JSON**: Individual patches and complete groove data can be exported as structured `.json` files (e.g. `euro_anthem_lead.json`).
- **Load from Disk**: Presets can be loaded from file picker dialogs or drag-and-dropped directly onto the synthesizer window. A full-window drop overlay with animated visual feedback handles the file drop event.
- **Full Bank Backup & Restore**: A single button exports all custom presets into an archive file (`NeuSynth_Bank_Backup.json`), which can be restored on any other machine or browser.

---

## 7. Results & Verification

- **Pure Client-Side**: 100% static HTML, CSS, and ES modules. No Node build step, no bundlers, no external runtime dependencies.
- **Low Latency**: Scheduling uses Web Audio's sample-accurate clock with lookahead timers (25ms intervals scheduling 100ms ahead), preventing timing jitter under UI load.
- **Live Deployment**: Built, verified, and running on GitHub Pages at [https://ramonlinarespallares.github.io/NeuSynth/](https://ramonlinarespallares.github.io/NeuSynth/).
- **Open Source Repository**: All source code is publicly accessible on GitHub at [https://github.com/RamonLinares/NeuSynth](https://github.com/RamonLinares/NeuSynth).
