---
title: "Sunlandia: An Island Exploration Game Built With AI"
slug: "sunlandia"
description: "Play Sunlandia, a free browser exploration game with island ruins and environmental puzzles. Built with GPT-5.6 Sol, help from Fable, and GPT-6 Astra."
date: "2026-09-06"
category: "games"
tags: ["Sunlandia", "Browser Game", "Exploration Game", "Puzzle Adventure", "Three.js", "AI Game Development", "GPT-5.6 Sol", "GPT-6 Astra"]
coverImage: "/content/images/sunlandia-shore.png"
draft: false
---

[Play Sunlandia — The Forgotten Shore](https://sunlandia.smallweblab.com/)

Sunlandia is a free, first-person island exploration game that runs in the browser. You arrive on a Caribbean shore after a shipwreck, look for a way to call for help, and gradually uncover the history of the ruins around you. Environmental puzzles, a field journal, and six keystones connect the island's scattered locations.

I developed the game first with **GPT-5.6 Sol**, with some help from **Fable**, and eventually finished it with **GPT-6 Astra**. It grew through repeated work on the landscape, movement, puzzles, story, and interface. The released game is the result of that shared development process.

## A Shipwreck And A Call For Help

The opening gives you a small, immediate objective: look for help along the shore. A broken dock, a wreck, and a personal chest establish where you are before the game asks you to understand the island's larger mystery.

An early lead takes you to a radio on the eastern shore. You connect its aerial, tune into a shipping broadcast, and try to send a distress call. What happens to that call gives you a reason to investigate the lighthouse. The instruments and the landscape become evidence you can compare as you work out why reaching the outside world is difficult.

I revised this sequence after feedback that the radio's purpose and controls were confusing. The current interface states the goal, presents one next action at a time, and keeps the words sent and received visible for comparison. It also records observations in the journal, so a player can return to the evidence later.

![Sunlandia's radio interface with a shipping-band tuning dial, signal meter, and a prompt to listen for ships](/content/images/sunlandia-radio.png)

## Environmental Puzzles Across The Island

The main locations ask for different kinds of observation. At the river mill, you work with water and machinery. In the ruined manor, belongings and worn surfaces provide clues about the people who lived there. The chapel uses resonators with visual patterns as well as sound. At the spring, a surveying instrument asks you to look at actual landmarks on the horizon.

These four middle trials can be approached in any order. Their mechanisms change the physical scene: a grille lifts, a cabinet opens, or an instrument releases its stone. Recovering a keystone is a separate action, and each one adds a short memory scene that can be skipped, replayed, or read in the journal.

There is also walking, climbing, and jumping between sites. Broken crossings and concealed routes make the terrain part of the game, while restored shortcuts make some return journeys easier. Optional discoveries include a stranded salvager's skiff, survey records, additional radio voices, and a fallen chapel bell that can be returned to its arch.

The story eventually presents a choice between escape and knowledge. Both paths explain their consequences before asking for a final commitment. I will leave the details for the expedition itself.

## A Journal And A Save In The Address Bar

The field journal keeps acquired clues, equipment, memories, and known leads together. You can pin a destination for navigation, enlarge evidence, and request hints when you need them. Memory scenes retain a still image and a written description, so their information remains available after the animation ends.

Sunlandia stores expedition progress in the URL fragment. **Copy or bookmark the complete address, including the part after `#expedition=`, to keep that expedition.** Opening the saved address restores its recorded progress, including partially completed puzzles. The plain game address starts a fresh expedition.

There is no account or separate game installation. Graphics, reading, motion, and audio preferences are stored locally on the device, separately from the expedition link.

## Building Sunlandia With Sol, Fable, And Astra

The game uses TypeScript, Three.js, React, and vinext. Its code separates terrain, water, vegetation, structures, traversal, puzzle rules, journal content, and save handling. Procedural scenery sits alongside model and audio assets, with the interface providing readable controls for instruments that also exist in the 3D world.

Working across Sol, Fable, and Astra meant continuing to revise an existing game. Much of that work involved the connections between systems. A puzzle could have correct rules while its stone remained difficult to target. An ending screen could display the right choices while mouse capture prevented the player from clicking them. A clue could exist in the landscape and still be too hard to see.

The development record contains concrete examples. Decorative line drawings at the spring intercepted the interaction ray intended for its keystone; making those drawings visual-only restored the pickup. The lighthouse's transition to the ending review needed guards against delayed pointer-lock events. A fallen bell was moved onto pale sand after its original position among wet rocks made it difficult to notice.

Each repair required checking the interaction again in the scene. The visual work had similar iterations, including softer beach shadows, less aggressive surface grain, and a more convincing drape over the salvager's skiff.

## What Was Tested, And What Remains Open

The September 5 verification record reports passing TypeScript, lint, production-build, and rendered-page checks. Its final gameplay ledger records successful results for all 34 browser suites across integrated runs and focused reruns. That ledger includes earlier failures and their subsequent fixes.

Coverage includes radio operation, puzzle progress, saving and restoring expeditions, keyboard focus, touch layouts, traversal, and both ending paths. The puzzle-state tests also cover all 24 possible orders of the four middle trials.

Those checks establish specific behaviours. Fresh-player comprehension, puzzle fairness, and first-run pacing still need the planned human play sessions. I do not yet have a measured completion time or enough evidence to say how comfortably the game runs across physical phones. The game includes touch controls and adjustable graphics quality, but those features alone cannot establish performance on every device.

## How To Play Sunlandia

Open [Sunlandia in your browser](https://sunlandia.smallweblab.com/) and choose **Begin expedition** once the island has loaded.

- **WASD** moves, and the **mouse** looks around.
- **E** interacts, **Space** jumps, and **Shift** sprints.
- **K** opens the field journal, and **P** opens pause and settings.
- On touch screens, use the on-screen movement and action controls.

The settings include graphics quality, reading size, reduced camera motion, navigation assistance, and separate radio, effects, and ambience levels. The chapel's puzzle patterns remain usable with sound muted.

Sunlandia joins [Horizon Drive](/posts/horizon-drive/) and [Bumper Hearts](/posts/bumper-hearts/) in Small Web Lab's collection of browser games. This time, the work centres on exploration: giving a player a reason to follow a path, inspect an object, and use what they learn at the next location.

[Begin an expedition in Sunlandia](https://sunlandia.smallweblab.com/)

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "@id": "https://smallweblab.com/posts/sunlandia/#game",
  "name": "Sunlandia — The Forgotten Shore",
  "alternateName": "Sunlandia",
  "description": "A free first-person browser exploration game set on a Caribbean island, with environmental puzzles, six keystones, a field journal, and a choice between escape and knowledge.",
  "url": "https://sunlandia.smallweblab.com/",
  "mainEntityOfPage": "https://smallweblab.com/posts/sunlandia/",
  "image": "https://smallweblab.com/content/images/sunlandia-shore.png",
  "genre": ["Adventure", "Exploration", "Puzzle"],
  "gamePlatform": "Web browser",
  "playMode": "SinglePlayer",
  "inLanguage": "en",
  "isAccessibleForFree": true,
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
}
</script>
