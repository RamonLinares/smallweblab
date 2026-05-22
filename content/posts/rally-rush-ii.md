---
title: "Rally Rush II"
slug: "rally-rush-ii"
description: "A second-generation browser rally game with richer stage selection, cars, race modes, weather, assists, and a more complete 3D racing loop."
date: "2026-05-22"
category: "games"
tags: ["Browser Game", "Three.js", "Racing", "WebGL", "AI Build"]
coverImage: "/assets/rally-rush-ii-gameplay.png"
draft: false
---

[Play Rally Rush II](https://ramonlinares.github.io/RallyRushII/)  
[Open RallyRushII on GitHub](https://github.com/RamonLinares/RallyRushII)

Rally Rush II is the second generation of the Rally Rush browser racing experiment. The first version proved that a lightweight Three.js rally game could live as a static web prototype. This version pushes the idea closer to a configurable racing sandbox: more stages, more setup choices, more vehicle handling detail, and a stronger sense that the game can grow into a real arcade-rally platform.

The important jump is not just visual polish. Rally Rush II turns the original road-driving prototype into a broader racing system with selectable environments, cars, weather, race types, difficulty, assists, traffic, timing, and camera tools.

## What It Does

Rally Rush II lets you open a browser, choose a stage, select a car, tune the race setup, and start driving without installing anything. It is still a static site, but it behaves like a self-contained game launcher.

The current stage list is much more ambitious than the first Rally Rush:

- **Scotland**: wet Highland roads and green valley terrain.
- **Desert**: wide sun-baked roads through dunes and mesas.
- **Alpine**: tight mountain asphalt with snow banks.
- **Tokyo**: neon city expressway driving with urban scenery.
- **Lakes**: forest roads, shorelines, rocks, and open curves.
- **Rainforest Mud**: dense jungle, mud-road textures, spray, and reduced visibility.
- **Mediterranean Coast**: cliff roads, sea views, walls, pines, and coastal bends.
- **Valle Verde**: a fictional 14-turn Mediterranean circuit with pit lane, grandstands, paddock details, kerbs, and a proper track layout.

![Rally Rush II stage and garage menu](/assets/rally-rush-ii-menu.png)

The menu is not just a title screen. It acts like a compact race setup interface: stage cards, car selection, race type, time of day, weather, difficulty, driving assist, and launch button all sit in one place.

## What Makes Version Two Different

The first Rally Rush was valuable because it had a working browser rally loop. Rally Rush II is different because it starts to separate the game into systems.

The biggest differences are:

- **Race modes**: Traffic mode, Rally mode, and Grid mode change the objective and what appears on the road.
- **Difficulty profiles**: Rookie, Pro, and Expert tune traffic count and traffic speed behavior.
- **Driving assists**: Full, Sport, and Manual change road-following, heading recovery, steering response, and curve slip.
- **Vehicle choice**: Rally R is the balanced rally car; Apex GT is faster and more stable but less drift-focused.
- **Weather and time of day**: clear, rain, fog, day, sunset, and night combinations change the feel of the drive.
- **Stage-specific world building**: Tokyo, Rainforest, Lakes, Coastal, and Valle Verde each have their own scenery logic instead of being simple reskins.
- **Camera tooling**: chase, cockpit, track overview, and camera-tuning controls make it easier to inspect and refine the driving view.
- **Persistent best times**: local storage keeps times by stage, difficulty, assist, and race mode.

This is the difference between "a road with a car" and "a racing game that has a shape."

## The Driving Loop

In the live build I tested Valle Verde with rain enabled. Even from a short run, the version-two goals are visible: a heavier HUD, stronger car presentation, weather effects, road furniture, stage signage, and track-side structures. The cover image for this entry comes from that live play pass.

The player-facing loop is straightforward:

```text
Choose stage -> choose car -> choose race setup -> start race -> drive -> finish -> compare result
```

Under the hood, the game is doing more than that. It builds road and terrain data for the chosen environment, creates stage decoration, places traffic or grid opponents depending on the race mode, applies vehicle handling and assist profiles, updates camera behavior, and writes best times back to local storage.

## What It Excels At

Rally Rush II excels at **scope expansion without leaving the browser**.

The strongest parts are:

- **Menu density**: many meaningful choices are exposed without burying the player in separate screens.
- **Stage variety**: the game now has distinct environment identities instead of one repeated terrain idea.
- **Static deployment**: the whole thing can be played from GitHub Pages.
- **Configurable handling**: assists and vehicle stats create a path toward both arcade and more demanding driving.
- **Environment ambition**: Valle Verde, Tokyo, Lakes, Rainforest, and Coastal all point toward a richer procedural scenery system.
- **Iteration friendliness**: because it is still plain HTML, CSS, JavaScript, Three.js, and assets, it remains easy to inspect and keep evolving with AI assistance.

For Small Web Lab, this is exactly the kind of project worth documenting: not a finished commercial game, but a working artifact where AI-assisted iteration produced a noticeable second-generation leap.

## Areas For Improvement

Rally Rush II is more ambitious than the first game, and that also makes the next improvements clearer:

- **Input onboarding**: the menu is polished, but the driving controls could be made more visible before the race starts, especially for keyboard players.
- **Loading communication**: the asset loading screen exists, but large 3D assets and stage generation could benefit from clearer per-stage expectations.
- **Race feedback**: modes, timing, sectors, and position are present, but the player could use more direct goals and feedback during the first minute.
- **Collision and recovery feel**: a richer racing game needs clear off-road recovery, reset, crash, and penalty behavior.
- **Performance budgets**: the most detailed stages need careful limits for lights, instancing, textures, and draw calls so the game stays playable on modest devices.
- **Mobile-first controls**: touch controls exist, but the game would benefit from dedicated mobile layout testing around HUD weight and visibility.
- **Sound design**: stage-specific music is already present; engine, surface, collision, and weather audio would make the driving loop feel much more complete.

None of these are blockers to the experiment. They are the natural next layer now that Rally Rush II has moved beyond a simple prototype.

## The Takeaway

Rally Rush II shows what happens when a browser prototype gets a second development pass instead of being left as a one-off. The original Rally Rush was a proof of concept. Version two is closer to a platform: multiple stages, cars, modes, assists, weather, cameras, and a growing library of environment systems.

It still has rough edges, but it is a strong AI-built game milestone because the improvement is structural. It is not just prettier. It has more game inside it.
