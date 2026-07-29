---
title: "Horizon Drive: A Procedural Racer Built With Claude Opus 5"
slug: "horizon-drive"
description: "Play Horizon Drive, an eight-car procedural Three.js racing game built with Claude Opus 5 and Fable 5: four circuits, generated art, and no binary assets."
date: "2026-07-29T20:15:00+02:00"
category: "games"
tags: ["Horizon Drive", "Browser Racing Game", "Claude Opus 5", "Claude Fable 5", "Three.js", "Procedural Generation", "AI Game Development"]
coverImage: "/content/images/horizon-drive-race.jpg"
draft: false
---

[Play Horizon Drive full screen](/play/horizon-drive/)\
[Play the original GitHub Pages build](https://ramonlinares.github.io/horizon-drive/)\
[Explore the source on GitHub](https://github.com/RamonLinares/horizon-drive)

Horizon Drive is a free procedural 3D racing game that runs directly in a web browser. It puts the player on a full eight-car grid, offers four circuits with different rhythms and difficulty profiles, and builds its cars, roads, terrain, vegetation, textures, shaders, effects, and audio in code.

The game was created primarily with **Claude Opus 5**, with a smaller contribution from **Claude Fable 5**, following the long-running “Gauntlet prompt” approach shared by [Matt Shumer](https://x.com/mattshumer_). The premise was deliberately ambitious: give an agentic coding model a modern AAA-racer quality bar, let multiple specialist agents own clearly bounded systems, and keep the build in the gauntlet until it became a coherent, playable browser game.

## Play Horizon Drive In Full Screen

The best way to judge a racing game is to drive it. Small Web Lab has a dedicated [full-screen Horizon Drive player](/play/horizon-drive/) that fills the viewport while keeping a small control strip for copying the share link, opening the original build, or entering the browser's native full-screen mode.

There is no account, installer, or download. Choose a circuit, start the race, and drive with **WASD or the arrow keys**. Space applies the handbrake, C changes the camera, R restarts, B looks back, and Esc or O opens the driving-assist settings. Gamepad and touch input are also supported.

## Four Procedural Racing Circuits

The circuit selector is more than a cosmetic menu. Each layout changes the length, corner density, setting, and pace of the race:

- **Ashcombe Grand Prix** is a 10.04 km mountain circuit with six broad sweepers and long flat-out sections.
- **Ashcombe Club** compresses eleven corners into 4.77 km, producing a shorter and more technical race.
- **Thornbury Night Circuit** runs under lights, with fifteen corners across 5.07 km.
- **Marchbank Autodrome** combines seventeen corners, fast esses, and a hairpin over 6.60 km.

![Horizon Drive circuit selection menu with four playable track layouts](/content/images/horizon-drive-menu.jpg)

The player joins seven AI rivals on the grid. A timing panel tracks laps and sectors, the standings update during the race, and the HUD combines a minimap, tachometer, speed, gear, drift angle, and combo feedback. Casual, Sport, and Simulation assists make the same procedural road approachable at different levels.

## A Racing Game With No Binary Assets

The most unusual constraint in Horizon Drive is simple: **no binary assets ship with the game**. It does not download a car model, texture pack, recorded engine sample, or premade environment. Everything is generated at boot.

That constraint shaped the architecture. The public [engineering brief](https://github.com/RamonLinares/horizon-drive/blob/main/AGENT_BRIEF.md) separates the project into focused systems for the engine loop, procedural textures, input, physically based rendering, sky and weather, terrain, roads, vegetation, props, vehicle physics, car geometry, cameras, rivals, race logic, HUD, effects, and synthesized Web Audio.

The result is roughly 58,000 lines of strict TypeScript spread across two dozen modules. Repeated scenery uses instancing and batching. Vehicle physics run on a fixed 120 Hz step. Expensive rendering features scale with a quality tier, and hot update paths avoid new allocations. The visual goal was never “add more effects”; it was to make light, materials, silhouettes, motion, and composition read as one authored world.

## How The Gauntlet Prompt Became A Production Method

Horizon Drive did not emerge from a single lucky code dump. The Gauntlet prompt became a production structure.

A frozen interface contract let about fourteen specialist agents work in parallel without casually rewriting one another's systems. A composition layer controlled the frame order. An automated capture harness drove the car and recorded ten repeatable views—golden-hour chase, cockpit, night, rain, drift, dawn, vehicle detail, road detail, and HUD—so each revision could be compared against the last.

Six independent art-direction reviews then scored those captures through different lenses: lighting, materials, vehicle design, world composition, effects, and presentation. Their findings were routed back into focused repair passes. The public [review scorecard](https://github.com/RamonLinares/horizon-drive/blob/main/SCORECARD.md) is unusually candid: it records the gains, regressions, remaining visual gap, performance measurements, and bugs that still-frame criticism could never discover.

That honesty makes the experiment more interesting. Horizon Drive is not presented as indistinguishable from a native Forza release. It is a genuinely good-looking browser racer and a concrete record of how far a procedural, agent-built Three.js game can be pushed.

## What The Iteration Loop Actually Found

Several of the best lessons came from measuring root causes rather than polishing symptoms.

- A suspension bug launched the car above sloped tarmac because the returned road height and road normal described different surfaces.
- A transparency-detection setting in the ambient-occlusion pass triggered extra full scene renders and cut performance dramatically.
- Film grain specified in scene-linear units turned into heavy noise after the display transform.
- A physically implausible motion-blur shutter smeared lane markings across the frame.
- Hundreds of duplicate shader programs came from warming materials against the canvas color space while real frames rendered into a linear HDR target.
- Steering was reversed because an early coordinate-system contract combined a forward axis and right axis that could not coexist in Three.js's right-handed space.
- Visual review missed several important interaction bugs—guardrail collisions, keyboard drivability, camera behavior on slopes, and the start-grid composition—that only appeared when a person drove the game.

The full [Horizon Drive handoff](https://github.com/RamonLinares/horizon-drive/blob/main/HANDOFF.md) documents the architecture, controls, browser-testing tools, performance work, and hard-won debugging rules. It is worth reading even if you are more interested in AI-assisted engineering than racing games.

## Why Horizon Drive Matters

Horizon Drive is a useful snapshot of a fast-moving moment in AI game development. The impressive part is not that a language model can place a car on a road. It is that a model-led team can maintain contracts across dozens of modules, build domain-specific diagnostic tools, interpret visual criticism, profile a real renderer, recover from its own incorrect hypotheses, and publish the evidence alongside the result.

The game also demonstrates why the browser remains such a good laboratory. The same URL opens the artifact, makes it shareable, exposes its source, and turns every reader into a potential playtester. There is no trailer standing between the claim and the experience.

## Horizon Drive FAQ

### Is Horizon Drive free to play?

Yes. Horizon Drive is a free browser racing game. It runs from a public GitHub Pages build and does not require an account or installation.

### Can I play Horizon Drive in full screen?

Yes. Open the [Small Web Lab full-screen player](/play/horizon-drive/) and choose **Full screen** in the top-right controls. The same route can be copied and shared directly.

### What was Horizon Drive built with?

Horizon Drive uses TypeScript, Three.js, Vite, procedural geometry and textures, custom vehicle physics, synthesized Web Audio, post-processing, and automated Playwright browser testing. Claude Opus 5 did most of the agentic coding work, with a smaller contribution from Claude Fable 5.

### Does Horizon Drive use premade 3D models or textures?

No binary game assets ship with the project. Its meshes, materials, textures, shaders, environmental details, effects, and sounds are generated in code at boot.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "VideoGame",
      "@id": "https://smallweblab.com/posts/horizon-drive/#game",
      "name": "Horizon Drive",
      "description": "A free eight-car procedural 3D racing game with four circuits, generated entirely in code and playable in a modern web browser.",
      "url": "https://smallweblab.com/play/horizon-drive/",
      "mainEntityOfPage": "https://smallweblab.com/posts/horizon-drive/",
      "image": [
        "https://smallweblab.com/content/images/horizon-drive-race.jpg",
        "https://smallweblab.com/content/images/horizon-drive-menu.jpg"
      ],
      "sameAs": [
        "https://ramonlinares.github.io/horizon-drive/",
        "https://github.com/RamonLinares/horizon-drive"
      ],
      "genre": ["Racing", "Driving", "Arcade simulation"],
      "gamePlatform": ["Web browser", "Desktop", "Mobile"],
      "playMode": "SinglePlayer",
      "applicationCategory": "Game",
      "operatingSystem": "Any modern operating system with a WebGL-capable browser",
      "isAccessibleForFree": true,
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock"
      },
      "author": {
        "@type": "Person",
        "name": "Ramon Linares",
        "url": "https://github.com/RamonLinares"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Small Web Lab",
        "url": "https://smallweblab.com/"
      }
    },
    {
      "@type": "FAQPage",
      "@id": "https://smallweblab.com/posts/horizon-drive/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is Horizon Drive free to play?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Horizon Drive is a free browser racing game available from a public GitHub Pages build without an account or installation."
          }
        },
        {
          "@type": "Question",
          "name": "Can I play Horizon Drive in full screen?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. The Small Web Lab player fills the viewport and includes a control for entering the browser's native full-screen mode."
          }
        },
        {
          "@type": "Question",
          "name": "What was Horizon Drive built with?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Horizon Drive uses TypeScript, Three.js, Vite, procedural geometry and textures, custom vehicle physics, synthesized Web Audio, post-processing, and Playwright browser testing. Claude Opus 5 performed most of the agentic coding work, with a smaller contribution from Claude Fable 5."
          }
        },
        {
          "@type": "Question",
          "name": "Does Horizon Drive use premade 3D models or textures?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No binary game assets ship with the project. Its meshes, materials, textures, shaders, environmental details, effects, and sounds are generated in code at boot."
          }
        }
      ]
    }
  ]
}
</script>
