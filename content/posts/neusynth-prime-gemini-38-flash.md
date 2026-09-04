---
title: "Building NeuSynth Prime With Gemini 3.8 Flash"
slug: "neusynth-prime-gemini-38-flash"
description: "Notes from using Gemini 3.8 Flash to build a browser-based six-operator FM synthesizer, drum machine, and step sequencer."
date: "2026-09-04T18:50:00+02:00"
category: "ai"
tags: ["Gemini 3.8 Flash", "Web Audio API", "FM Synthesis", "JavaScript", "Music Production", "AI Build"]
coverImage: "/content/images/neusynth-prime-workstation.png"
draft: false
---

[Open NeuSynth Prime](/lab/neusynth/)  
[Explore NeuSynth Prime on GitHub](https://github.com/RamonLinares/NeuSynth)

NeuSynth Prime is a six-operator FM synthesizer, drum machine, and 16-step sequencer that runs entirely in the browser. I used Gemini 3.8 Flash to create the project, including the first version of the technical walkthrough that accompanied it.

The result is much broader than a single-purpose synthesizer. It behaves more like a compact groovebox: a preset can change the FM patch, tempo, melodic pattern, effects, and six drum tracks together. The repository contains 8,625 lines of HTML, CSS, and JavaScript, with no framework, package manager, or build step required by the app.

For this entry I reviewed the implementation, ran syntax checks across every JavaScript module, and exercised the interface in Chromium. The walkthrough was useful source material, but I treated the code and the running app as the final record when details differed.

## What Gemini Built

The audio code is split into modules for the synthesis engine, routing algorithms, drum voices, effects, and presets. Interface modules handle the keyboard, knobs, sequencer, and central display. That separation makes the project easier to inspect than a single large generated script.

Each synth voice has six oscillators. Every operator has its own level, frequency ratio, detune, feedback, and ADSR envelope. Eight routing algorithms decide which operators act as audible carriers and which modulate another oscillator's frequency. The engine supports up to 16 polyphonic voices as well as a mono mode with glide.

The signal then passes through a six-part effects section:

- Filter
- Overdrive
- Chorus
- Phaser
- Delay
- Reverb

The central display exposes different views for the oscilloscope, effects, envelopes, operator values, melodic sequence, drum grid, and settings. The interface uses an Obsidian dark theme by default and can switch to a Porcelain light theme.

## Presets as Complete Scenes

The 24 supplied presets are grouped into Euro Trance, Dark Beats, Techno, Synthwave, and Classics. They include sounds such as Euro Anthem Lead, Rolling 138 Bass, Dark Reese Bass, Berlin Hypnotic, Retro Drive Lead, DX7 Tine Piano, Vintage Strings, and Mono Bass 90s.

A preset can be loaded as a sound by itself or as a full groove. The full-groove option also sets the BPM, a 16-step melodic sequence, and patterns for kick, snare, closed hi-hat, open hi-hat, clap, and percussion. This is a practical design choice because it lets each patch demonstrate its intended rhythmic context immediately.

![NeuSynth Prime preset browser showing sound scenes, genre filters, search, and full-groove controls](/content/images/neusynth-prime-preset-library.png)

The percussion section does not load samples. Its six voices are synthesized with oscillators, envelopes, and filtered noise, so the complete app remains a small static site without media downloads or cross-origin audio files.

## Playing and Recording

NeuSynth can be played from its on-screen piano, a QWERTY keyboard, or a Web MIDI device. Number keys 1 through 6 trigger the drum voices, while the space bar starts and stops the sequencer.

The step-recording mode is one of the more considered parts of the interface. Pressing a piano key writes its pitch into the selected sequencer step and advances the cursor. A separate rest control moves forward without adding a note, and the arrow, Tab, Delete, and Backspace keys cover navigation and clearing. Each step displays either its note name or a rest mark, which makes the pattern readable without opening another editor.

Patches and complete user banks can be exported as JSON files and restored later. This keeps the workflow local: the application has no account system, database, analytics service, or remote audio processor.

## What Needed Repair

The repository history is compact: the initial release, one focused interface fix, and the generated walkthrough. The follow-up code change repaired the vertical modulation strip beside the keyboard.

The strip had originally been centered with flexbox while its drag logic also translated the thumb vertically. Those two coordinate systems meant the control could travel down from the middle but not properly reach the top, and the thumb could disappear past the lower edge. The corrected version uses explicit track boundaries, clamps the thumb to the available travel, captures the pointer during a drag, and adds a visible level fill. It also maps MIDI CC1 to the same control.

The supplied walkthrough records two other implementation details that matter in an audio application. Preset changes use short gain ramps and clear old delay feedback to avoid abrupt clicks, and every stylesheet and module import uses a relative path so the app can run from a repository or lab subdirectory.

## What I Checked

All 10 JavaScript files passed Node's syntax checker. In Chromium I activated the audio context, started the sequencer, opened the 24-preset browser, and switched between the two themes. The interface loaded without application errors; the local standalone server only reported a missing favicon, which is supplied by Small Web Lab when the app runs at its new lab route.

The workstation is currently desktop-first. At a 390-pixel phone viewport, it keeps the console at its large working width and overflows horizontally. That preserves the dense controls, but it is not a comfortable mobile layout. NeuSynth is best used on a laptop or desktop display for now.

## Overall Impression

NeuSynth Prime is a strong example of what a fast coding model can now assemble from browser-native APIs. Gemini 3.8 Flash produced the synthesis engine, percussion, sequencer, preset system, file workflow, visual design, and its own technical account as one coherent project.

The app is also a useful reminder that breadth and finish are different kinds of work. The generated system arrived with a large feature set, while the clearest follow-up improvement came from observing one physical control closely and correcting its movement. The same kind of inspection would be the right next step for a responsive mobile layout.

As it stands, the desktop version is immediately playable, self-contained, and unusually complete for a zero-dependency browser experiment. It now runs directly from the Small Web Lab alongside the source repository that Gemini produced.
