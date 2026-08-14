---
title: "Testing Gemini 3.7 Flash With a ZX Spectrum Emulator"
slug: "gemini-37-flash-zx-spectrum"
description: "Notes from testing Google Gemini 3.7 Flash by asking it to build a browser-based ZX Spectrum 48K emulator."
date: "2026-08-14T04:33:12+02:00"
category: "ai"
tags: ["Gemini 3.7 Flash", "Google Gemini", "ZX Spectrum", "Browser Emulator", "AI Build", "Vibe Coding"]
coverImage: "/content/images/gemini-37-flash-zx-spectrum-uridium-gameplay.png"
draft: false
---

[Explore the ZX Spectrum emulator on GitHub](https://github.com/RamonLinares/ZXSpectrum)

For my first test of Google Gemini 3.7 Flash, I gave it a short prompt:

> Create a website that emulates a ZXSpectrum 48k

After a few minutes, it had produced a working ZX Spectrum 48K emulator in the browser. The project included a Z80 CPU core, ULA display rendering, keyboard input, beeper audio, joystick support, tape and snapshot loading, save states, and a debugger.

## What Gemini Built

The project uses vanilla JavaScript, HTML Canvas, and the Web Audio API. Its main parts are separated into files for the CPU, Spectrum hardware, keyboard, audio, ROM handling, debugger, software library, and browser interface.

The emulator includes:

- A Z80 implementation covering the standard, CB, ED, DD, FD, DDCB, and FDCB instruction families.
- A 320×240 display including the 256×192 Spectrum image and border area.
- The original 8×5 keyboard matrix, plus an on-screen rubber keyboard.
- The one-bit `0xFE` beeper through the Web Audio API.
- `.TAP`, `.SNA`, `.Z80`, and `.SCR` loading.
- Kempston, Sinclair Interface 2, and Cursor joystick mappings.
- Three browser save-state slots and `.SNA` export.
- A live Z80 debugger with registers, flags, disassembly, and memory inspection.

The browser interface has tape controls, speed settings, display scaling, optional CRT scanlines, audio controls, a BASIC reference, and a software drawer. The on-screen keyboard reproduces the labelled rubber keys of the original machine.

## Testing The Result

I tested the emulator with external ROM and game files, including Uridium and Terra Cresta. This helped expose problems that were not obvious from the initial boot screen, especially around joystick input and file loading.

The repository also has 63 automated checks covering the ROM, CPU operations, memory protection, keyboard and border ports, snapshots, video output, TAP parsing, joystick mappings, save-state cleanliness, and the ULA floating bus. All 63 passed in my local verification run.

![Uridium ready screen in the browser-based ZX Spectrum 48K emulator](/content/images/gemini-37-flash-zx-spectrum-uridium-ready.png)

## Where It Needed Help

The first output was close, but I needed a few iterations to fix two areas: Kempston joystick handling and external ROM files.

Kempston input involves browser key events, held-key state, keyboard aliases, and reads from port `0x1F`. The external-ROM work involved loading the file in the browser, placing it correctly in the emulator's memory, and keeping the ROM itself outside the public repository.

I used GPT-5.6 Sol to help with those two problems. The final repository therefore is not exclusively the output of Gemini 3.7 Flash, although Gemini produced almost all of the initial project.

This is a fairly normal way for me to work with coding models. I use one model for the main build and sometimes switch when a particular bug is not being resolved after several iterations.

## Overall Impression

My estimate that Gemini 3.7 Flash got 99 percent right is not intended as a benchmark score. It describes the amount of the project that was already in place before I started fixing the remaining compatibility issues.

The model worked very quickly and covered most of the emulator, the interface, and the supporting tools in its first pass. The problems I found were in the more exact behaviour of hardware input and external files. That is consistent with my general experience of Flash models: they are very good at producing a broad implementation quickly, but some details still need closer inspection.

Overall, I am impressed by how much Gemini 3.7 Flash produced from such a small prompt and how little iteration was required. I would use it again for this kind of experiment. I am also interested in testing the Pro model when it becomes available, particularly to see how it handles the compatibility details and longer debugging work that remained here.
