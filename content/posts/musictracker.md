---
title: "WebTracker"
slug: "musictracker"
description: "Browser-based Amiga MOD tracker for loading, editing, playing, and saving classic tracker modules from a static web app."
date: "2026-07-08T19:40:00+02:00"
category: "tools"
tags: ["Music", "MusicTracker", "Web Audio", "MOD Tracker", "Fable", "ChatGPT 5.5", "GitHub Pages"]
coverImage: "/content/images/musictracker-social-preview.png"
draft: false
---

[Open WebTracker](https://ramonlinares.github.io/MusicTracker/)  
[Open MusicTracker on GitHub](https://github.com/RamonLinares/MusicTracker)

WebTracker is the browser-based Amiga music tracker in the MusicTracker repository. It is inspired by ProTracker and OctaMED, but ships as a static web app that can run from GitHub Pages.

The project was made with Fable, with a few later tweaks from ChatGPT 5.5. That combination makes it a useful Small Web Lab entry: a dense creative tool that goes well beyond a toy demo while still keeping the deployment model simple.

The app can load, edit, play, and save classic tracker modules in the browser. It supports ProTracker `.MOD` files, OctaMED imports, FastTracker II `.XM` imports, a native project format, WAV export, pattern PNG export, MIDI input, microphone sampling, a chip synthesizer, a drum machine view, and a music assistant for scales, chords, generators, humanizing, analysis, and hum-to-pattern capture.

![MusicTracker social preview](/content/images/musictracker-social-preview.png)

## What It Tests

- Whether a serious music-production surface can live as a no-backend static site.
- A Web Audio engine that feels close to classic tracker hardware while still supporting modern browser workflows.
- File handling, offline support, autosave, and export features without requiring accounts or uploads.
- AI-assisted development on a project where the hard part is not a landing page, but a deep editor with many connected systems.
