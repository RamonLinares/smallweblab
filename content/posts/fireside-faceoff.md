---
title: "Fireside Faceoff: An Air Hockey Diorama Built With Claude Fable 5"
slug: "fireside-faceoff"
description: "How Claude Code with Claude Fable 5 turned one nostalgic prompt into a polished Three.js air hockey game using procedural art, custom physics, synthesized audio, specialist agents, and production QA."
date: "2026-07-12T19:50:00+02:00"
category: "games"
tags: ["Claude Fable 5", "Claude Code", "Browser Game", "Three.js", "Procedural Art", "AI Build"]
coverImage: "/content/images/fireside-faceoff-active-play.jpg"
draft: false
---

[Play Fireside Faceoff](https://ramonlinares.github.io/fireside-faceoff/)  
[Open the source on GitHub](https://github.com/RamonLinares/fireside-faceoff)

Fireside Faceoff is a tiny air hockey table placed in the corner of a childhood bedroom at dusk. A warm lamp pools over the floorboards, fairy lights flicker against dark blue walls, a teddy bear watches from the rug, and a simple first-to-seven match runs underneath it all.

The game was built with **Claude Code using Claude Fable 5**. What makes it interesting is not only the finished diorama, but the production route Claude chose when asset-generation services were unavailable: custom physics, procedural models, canvas-painted textures, synthesized sound, responsive controls, automated browser tests, and a public GitHub Pages release.

![Fireside Faceoff active play in its miniature bedroom diorama](/content/images/fireside-faceoff-active-play.jpg)

## The Prompt

The project began with one loose instruction:

> As a goal, using multiple agents to build and deploy a cute AirHockey game in a 3D website. Create a heartwarming, nostalgic environment that feels miniature but highly detailed. Keep iterating until it is polished, deployed, and playable.

There were no table dimensions, technology choices, control specifications, or visual references. The prompt supplied a feeling and a quality bar. Claude had to turn “miniature, heartwarming, nostalgic” into a playable system and carry that tone through engineering, art direction, interface copy, sound, testing, and deployment.

## A Director And Five Specialists

Claude Code organized the work as a small game-production pipeline. A directing layer set phase gates and required verification evidence before a phase could close: successful builds, browser screenshots, canvas checks, real input tests, and production validation.

Five specialist agents then handled bounded parts of the project:

1. A gameplay agent built the table, puck, mallets, opponent AI, scoring, and game states.
2. A graphics agent created the bedroom, materials, lighting, props, and visual effects.
3. A UI agent produced the title card, scoreboard, pause and result states, and touch layout.
4. An audio agent synthesized impact sounds, goal cues, a win melody, and ambient room tone.
5. A QA agent attacked the production build and reported gameplay and rendering defects.

This was not a one-shot generation. The finished game emerged from several focused sessions whose outputs were integrated, played, criticized, and revised.

## Physics Before Paint

The first playable deliberately looked like a cardboard prototype: a bare table floating in a navy void, two simple mallets, a puck, and a score display.

![The first playable physics prototype before the art pass](/content/images/fireside-faceoff-first-playable.jpg)

The gameplay agent considered using a general-purpose physics engine and rejected it with a practical rationale. Air hockey is three circles moving on a plane. A custom fixed-timestep simulation would be smaller, deterministic, and easier to tune for arcade feel.

The simulation runs at 120 Hz with substeps, preventing a fast puck from tunneling through a wall between frames. Headless playtesting then exposed the less glamorous problems that turn up only after a game is playable. The AI could be beaten 7–0, and the puck could settle in an unreachable back corner forever. The first led to opponent tuning; the second produced a quiet re-serve after four seconds of a dead puck.

Those are small rules, but they mark the difference between a visual demo and a game that can recover from its own edge cases.

## Turning Missing Assets Into An Art Direction

At the start of the project, the production pipeline checked for external image, 3D, and audio-generation credentials. None were available. Instead of reducing the ambition, Claude turned that constraint into the visual identity: **everything would be procedural**.

The graphics system generated twelve canvas textures in code, including wood grain, the folk-pattern rug, a dusk skyline, poster art, and alphabet blocks spelling “PLAY.” The room was assembled from authored geometry: a lathe-turned lamp, books, a plant, a teddy bear, a radio, picture frames, curtains, and thirty-eight individually twinkling fairy-light bulbs suspended along a catenary curve.

The result feels intentionally handmade. The simplified geometry and painted surfaces suit a miniature bedroom memory better than a collection of unrelated photoreal assets would have.

![The finished title screen over the dusk-lit room](/content/images/fireside-faceoff-title-screen.jpg)

## A Game That Speaks Softly

Claude also named the game. “Fireside Faceoff” carries the same contrast as the scene: competition, but made cozy. The title screen calls it “a cozy little match before lights-out.” Scoring receives “Lovely strike!” while losing avoids aggressive arcade language.

The interface follows that tone visually. The scoreboard resembles a small walnut plaque, the title card uses muted coral and mint, and the controls stay at the edge of the diorama rather than covering the table.

Audio began with no recorded samples. Puck collisions use filtered noise and a pitch-dropping sine thump, scaled by impact speed and slightly detuned so repeated rallies do not sound mechanical. Goals trigger a toy-glockenspiel cue, winning plays a seven-note music-box phrase, and a quiet brown-noise room tone carries sparse fireplace crackles.

Later, the supplied track **Golden Hour Puck** was integrated on its own audio bus. It loops during play, ducks beneath goal sounds, fades on the game-over screen, and follows the mute setting from the opening frame.

## The Player Finds What Screenshots Miss

The first human play session uncovered visible z-fighting around the table frame. The defect was not one overlapping face but several: trim and cabinet surfaces sharing the same plane, rails sitting mathematically flush, rounded caps grazing the rails, and adjoining corners becoming coplanar.

Claude fixed the geometry at its source by separating the surfaces physically instead of masking the issue with renderer offsets. The same round of work investigated an alarming 4 fps test result. That number turned out to belong to two headless software-rendered browsers competing for the same machine, not to the game or its newly added music. Test timeouts were adjusted to match the environment, while real hardware performance remained sound.

![A goal celebration with confetti in the room's palette](/content/images/fireside-faceoff-goal-confetti.jpg)

## Designed For A Phone, Not Merely Shrunk

The responsive version changes the composition rather than squeezing the desktop camera into a narrow viewport. In portrait mode the camera pulls upward and backward, keeping the entire play surface visible while the window, fairy lights, rug, and lamp still frame the scene.

Touch input maps directly to mallet movement, the scoreboard stays readable above the table, and the round controls move into safe corners. The result keeps the diorama legible without sacrificing the space needed for play.

![Fireside Faceoff portrait layout on a phone](/content/images/fireside-faceoff-mobile.jpg)

## Shipping Required A Human Decision

The original prompt asked for deployment, but did not explicitly authorize making a repository public. Claude's safety boundary stopped the public GitHub action and produced what it could without expanding permission: a self-contained playable artifact and a private backup repository.

Only after the owner explicitly requested a public repository and GitHub Pages release did the game go live. From there, the release pipeline built on every push and verified the public URL itself: canvas rendering, asset loading, music playback, puck movement, mobile behavior, and zero console errors.

That pause is an important part of the model story. Claude was opinionated where creative and technical judgment were useful, but conservative where the action changed public visibility.

## The Result

Fireside Faceoff is a strong Claude Fable 5 showcase because its charm is supported by real engineering. The deterministic simulation does not tunnel. The opponent has readable behavior. The room remains lightweight enough for mobile. The audio system combines procedural cues with a supplied song. The interface sounds as warm as the lighting looks.

Most of all, the game shows how a model can treat constraints as material. Missing asset services became procedural art. A simple sports mechanic became a reason to avoid an unnecessary dependency. Playtest failures became new rules. Deployment uncertainty became a moment to ask rather than assume.

One nostalgic prompt went in. A small, warm, finished game came out. First to seven wins.

**Built with:** Claude Code, Claude Fable 5, TypeScript, Three.js, Vite, Web Audio, procedural Canvas textures, Playwright, GitHub Actions, and GitHub Pages.
