---
title: "Bumper Hearts: A Pocket Fairground Built With GPT-5.6"
slug: "bumper-hearts"
description: "How Codex with GPT-5.6 Sol High turned one nostalgic prompt into a polished Three.js bumper-car campaign with generated art, 3D assets, audio, story, testing, and a public release."
date: "2026-07-12T18:30:00+02:00"
category: "games"
tags: ["Codex", "GPT-5.6", "Browser Game", "Three.js", "ImageGen", "AI Build"]
coverImage: "/content/images/bumper-hearts-gameplay.jpg"
draft: false
---

[Play Bumper Hearts](https://ramonlinares.github.io/bumper-hearts/)  
[Open the source on GitHub](https://github.com/RamonLinares/bumper-hearts)

Bumper Hearts is a ten-stage arcade romance about a patched teal bumper car, a fading fairground, and the people trying to keep both alive. It runs entirely in the browser, but it reaches far beyond a typical WebGL prototype: survival combat, rival AI, two camera modes, power-ups, illustrated intermissions, generated 3D props, authored arena themes, original sound design, responsive controls, automated diagnostics, and a tested GitHub Pages release.

The project was created with **Codex using GPT-5.6 Sol High**. Its starting prompt was inspired by the prompt Vaibhav “VB” Srivastav shared for [Tiny Rails Rollercoaster](https://developers.openai.com/showcase/tiny-rails-rollercoaster). That OpenAI showcase is the direct creative ancestor of this experiment; VB's miniature, nostalgic rollercoaster brief suggested a compelling question: what happens when the same emotional seed is given a different ride, a different story, and a long iterative production pass?

![Bumper Hearts active Three.js survival stage](/content/images/bumper-hearts-gameplay.jpg)

## The Prompt That Opened The Gate

The original Bumper Hearts prompt was:

> Use set_goal and multiple agents to build and deploy a cute bumper cars game on Sites. Use ImageGen for assets and create a heartwarming, nostalgic environment that feels miniature but highly detailed. Keep iterating until it is polished, deployed, and playable.

It deliberately kept the implementation open. The prompt named a feeling, a setting, a working method, and a quality bar—not a feature list. GPT-5.6 had to turn “cute bumper cars” into an actual game while preserving the miniature, heartwarming character of the brief.

The first result established a Three.js arena, controls, collisions, a generated hero car, fairground dressing, ticket-like UI, and browser diagnostics. The interesting part came afterward: the model kept absorbing precise play feedback and converting it into code, art direction, tests, and release work.

![Bumper Hearts opening screen, introducing its ten-night campaign](/content/images/bumper-hearts-opening.jpg)

## From A Toy Arena To A Real Game

The most important design change was a move from a gentle score chase to a last-car-standing survival game. Each car gained integrity, reciprocal collision damage, elimination logic, and readable health bars. Rivals fight one another as well as the player. Boost became faster and charge-limited, and heavy impacts gained debris, expanding shock rings, stronger audio, and camera impulse.

Three timed power-ups change the rhythm without cluttering the opening seconds:

- **Repair** restores car integrity.
- **Overdrive** temporarily increases impact damage.
- **Shock bomb** damages nearby rivals with a radial discharge.

Underneath, the physics remain intentionally compact: a fixed 60 Hz simulation, circular collision proxies, deterministic bounds, impulse response, and per-pair damage cooldowns. The high-detail GLB cars are visual shells around simpler gameplay geometry. That is a good example of the model choosing the right kind of sophistication: the experience feels physical without burdening a small browser game with a heavyweight rigid-body stack.

## Ten Nights, Not Ten Levels

GPT-5.6 did not stop at arena variations. It developed a full summer story around Eli, a shy electronics nerd; Maya, the fairground's gifted lighting designer; Rex, a privileged rival; and Dot, the veteran mechanic who keeps the pavilion alive.

The campaign became twelve image-first story beats—an opening, ten stage outcomes, and an epilogue—with a character bible to hold faces, clothing, proportions, and palette together. Each intermission combines a 16:9 illustration, location slate, short narration, character line, and mission summary. The presentation is closer to an arcade game's story mode than a modal pasted over a tech demo.

![Chapter I introduces Eli, Dot, and the patched hero car](/content/images/bumper-hearts-story.jpg)

The story art was also treated as a runtime system. Earlier low-resolution sheets were replaced by individual 1672×941 masters, then encoded as WebP. Loading transitions clear old artwork before changing the source and reveal a scene only after decoding, eliminating the single-frame flash that often gives browser-game cutscenes away.

![The twelve-scene anime campaign contact sheet](/content/images/bumper-hearts-story-contact-sheet.jpg)

## A Small AI Production Studio

The final game shows what becomes possible when a coding model coordinates several media pipelines instead of producing only source code.

### Image direction

Image generation supported the nostalgic carnival diorama, marquee artwork, story concepts, anime intermissions, and ten stage-floor textures. Runtime files were resized and compressed while full-resolution masters remained in the repository's source-asset folders.

### Generated 3D assets

The bumper car and ten collectible/prop families were generated as PBR models, downloaded as GLB files, normalized to shared bounds and pivots, cached once, and cloned at runtime. Code still owns collision proxies, animation hooks, VFX, and arena dressing. The hero model was selectively recolored deep blue-teal while preserving its cream panels, brass, chrome, rubber, fabric, and wear.

![Generated PBR bumper-car model used by the hero and rivals](/content/images/bumper-hearts-generated-car.webp)

### Audio as a system

The game includes fairground ambience, interface cues, multiple impacts, boost, stage outcomes, boss arrival, repair, overdrive, shock bomb, and elimination sounds. Music and effects have separate Web Audio buses and persistent mute controls. An asset manifest records provider, prompt, duration, loop behavior, and generation metadata, making the sonic pipeline inspectable rather than mysterious.

## Where GPT-5.6 Was Most Convincing

The strongest model showcase is not any single screenshot. It is the continuity across disciplines.

GPT-5.6 could move from a subjective complaint—“the car feels as if it is facing backward”—to a transform fix and a regression check. It could interpret “the floor looks black and synthetic” as an art-direction problem, create an authored texture system, integrate it with stage data, and keep it within a browser budget. It could turn “the story needs arcade-level storytelling with real graphics” into a cast bible, a twelve-scene structure, a responsive intermission UI, an image-loading fix, and campaign tests.

That breadth matters. Bumper Hearts was not generated in one miraculous shot. Its quality came from a loop:

1. Implement a focused change.
2. Play it with real keyboard input.
3. Inspect the active canvas and structured game state.
4. Check errors, rendering cost, responsive layout, and asset loading.
5. Fix what still felt wrong and protect important behavior with a test.

The game exposes text rendering, Three.js diagnostics, and deterministic time-advance hooks in development. Automated checks cover controls, car orientation, cockpit-camera stability, damage, healing, power-ups, story progression, audio buses, asset paths, desktop Chrome, and mobile Safari. The public build used for the screenshots on this page loaded with no console warnings or errors.

## The Result

Bumper Hearts is a useful marker for the new generation of coding models. Codex with GPT-5.6 Sol High acted as programmer, technical artist, systems designer, UI designer, asset-pipeline integrator, tester, and release engineer—while remaining responsive to human taste at every step.

VB's Tiny Rails prompt supplied the spark: nostalgic, miniature, detailed, polished, playable. Bumper Hearts shows how far that spark can travel when a strong model is allowed to iterate. The result is not merely a cute scene. It is a coherent little game with a point of view, a story worth finishing, and enough production discipline to live on the public web.

**Built with:** Codex, GPT-5.6 Sol High, TypeScript, Three.js, Vite, ImageGen, generative 3D tooling, ElevenLabs, Playwright, GitHub Actions, and GitHub Pages.
