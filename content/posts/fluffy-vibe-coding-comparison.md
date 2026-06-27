---
title: "Four Fluffy Planets From One Prompt"
slug: "fluffy-vibe-coding-comparison"
description: "A detailed field note on four React and Three.js planet games made from the same prompt, with notes on architecture, taste, playability, and model cost."
date: "2026-06-27T15:30:00+02:00"
category: "ai"
tags: ["AI Build", "Browser Game", "Three.js", "React", "Vibe Coding"]
coverImage: "/content/images/fluffy-vibe-coding-comparison-cover.png"
draft: false
---

I wanted a small comparison that would teach me something practical. Same prompt, four coding setups, one afternoon of pushing each result past the screenshot stage.

The prompt:

> make a mobile first but desktop playable too website in 3d, using react and threejs, font-awesome, webgl that is a procedurally generated planet and the user can move a character that is a fluffy ball. the game is relaxed, but the goal is to have five quests in each planet and once achieved it got transported to another different planet with another five quests. The achievement is stored in localstorage but we also give a code to the user so they can enter it in another device and reach the same planet. It should be anime style, pastel colors, light shadows, a bit ethereal

It is a good stress prompt because it mixes mood, controls, state, geometry, UI, persistence, and deployment. A model can fake a pastel sphere easily. It has a harder time making spherical movement, five quests, local storage, travel codes, mobile controls, and WebGL all coexist without becoming soup.

The four builds:

- `FluffyGPT55xhigh`: Codex with GPT-5.5 x-high.
- `FluffyGLM52`: opencode with GLM 5.2, plus one later Codex / GPT-5.5 repair for a compass bug.
- `FluffyClaude`: Claude Code with Opus 4.8.
- `FluffyGemini35Flash`: Antigravity with Gemini Flash 3.5.

## Play And Source Links

- Codex / GPT-5.5 x-high: [play the game](https://ramonlinares.github.io/FluffyGPT55xhigh/) and [open the repository](https://github.com/RamonLinares/FluffyGPT55xhigh).
- opencode / GLM 5.2: [play the game](https://ramonlinares.github.io/FluffyGLM52/) and [open the repository](https://github.com/RamonLinares/FluffyGLM52).
- Claude Code / Opus 4.8: [play the game](https://ramonlinares.github.io/FluffyClaude/) and [open the repository](https://github.com/RamonLinares/FluffyClaude).
- Antigravity / Gemini Flash 3.5: [play the game](https://ramonlinares.github.io/FluffyGemini35Flash/) and [open the repository](https://github.com/RamonLinares/FluffyGemini35Flash).

## How I Read The Results

Benchmark police can relax. I let the projects evolve after the first answer because that is how I actually use these tools. I cared about the working artifact, the code I would inherit, and the amount of expensive attention needed to get there.

Cost is part of the taste test. A cheap or fast model can be excellent if it gives me a system I can steer. An expensive model earns its keep when it saves me from slow debugging, produces a cleaner shape, or gets the hard spatial reasoning right. I did not track exact dollars for this run, so the cost notes are about practical value during iteration.

The GLM attribution needs a footnote. The project mostly came from opencode with GLM 5.2. Later, the compass pointed the wrong way when I was beside a collectible. I used Codex with GPT-5.5 to inspect the geometry and patch it. The GLM build still tells me a lot about GLM, but the final shipped version includes that one premium-model assist.

## What I Checked

I built all four projects on June 27, 2026, served their production `dist` folders locally, checked desktop and phone-sized viewports, and then verified the public GitHub Pages deployments.

My checklist was plain:

- Production build passes.
- Hosted assets load correctly from a GitHub Pages subpath.
- A WebGL canvas appears.
- The player can understand the next action.
- Mobile keeps enough planet visible to feel playable.
- The code still makes sense after the model is gone.

![Mobile comparison of the four fluffy planet games](/content/images/fluffy-vibe-coding-mobile-strip.png)

## Codex / GPT-5.5 x-high: Small Engine, Fast Read

![GPT-5.5 x-high Codex fluffy planet game](/content/images/fluffy-vibe-gpt55xhigh-gameplay.png)

The Codex build opens directly into play. Small planet, fluffy character, five quest slots, active objective, code button, audio, pause, and a live FPS/draw-call/triangle readout.

I liked the lack of ceremony. The first playable loop is visible immediately. The source has the same compactness: a custom Three.js game class, no broad React Three Fiber tree. Render loop, world generation, player movement, quests, and save logic are easy to find.

The character has a good read. White fluff, face, paws, soft volume. The planet is bright and clean. The world fiction is thinner than in the other versions, but the object of play is obvious.

The weak spot is the HUD. It has developer cockpit energy. Useful, clear, a little too busy for a relaxed game. On mobile it works, but it feels like a prototype with its diagnostics still pinned to the glass.

The cost/value trade looked good here. GPT-5.5 x-high is an expensive choice, but it returned a compact playable slice with the smallest production JavaScript bundle in my pass, around 775 KB before gzip and 210 KB gzipped. I would pay premium-model prices for this kind of concentrated engineering shape when I am trying to learn quickly.

## opencode / GLM 5.2: The Systems Surprise

![GLM 5.2 opencode fluffy planet game](/content/images/fluffy-vibe-glm52-gameplay.png)

The GLM version was the pleasant surprise. It looks like a real prototype. React Three Fiber handles the scene. Zustand handles game state. Codec, decorations, planet generation, quests, random generation, and shared types each get their own place. The HUD is tidy, the palette is gentle, and the compass makes the current objective readable.

I would show this build to someone who underestimates cheaper models. The decomposition is sensible. Persistence and journey codes stay away from rendering. Quest generation has its own module. The scene components have names that match the game. Boring structure, in the good sense.

The mobile layout holds together well. Top controls stay compact, the quest panel has a clean hierarchy, and the planet still gets enough screen space. The art direction is disciplined too: pastel without turning into beige fog, low-poly without looking empty.

The compass bug matters. In a later session, I stood next to a collectible and the compass pointed somewhere else. Codex with GPT-5.5 found the issue: an extra inversion in the projected tangent direction, plus a Font Awesome arrow rotation that did not match the angle convention. GLM built the body of the game; Codex fixed a spatial UI bug that needed careful browser verification.

That mix feels economically sane. Let the cheaper model build the bulk of the system. Bring in the expensive model when the bug needs geometry, screenshots, and a debugger mindset. I would use that workflow again.

The main cleanup item is weight. Font Awesome ships font files and a larger CSS payload. The JS bundle is large too. Fine for an experiment, worth cutting down before treating this as a serious browser game.

## Claude Code / Opus 4.8: World-Building Appetite

![Claude Opus 4.8 Claude Code fluffy planet game](/content/images/fluffy-vibe-claude-opus48-gameplay.png)

The Claude version wants to build a world. The file tree is large and granular: audio, colliders, compass, input, noise, planet, quests, share codes, storage, theme, plus separate scene components for atmosphere, aurora, clouds, comets, floating islets, landmarks, moons, particles, portal, rings, sky dome, starfield, suns, and the fluffball.

The upside is visible. The start screen has color selection and clear controls. The planet behind it has terrain detail, crystals, trees, floating pieces, and soft atmospheric dressing. The word "ethereal" comes through as composition and layering, with more care than a single shader setting would provide.

The cost is ownership. Opus-class output can hand you a lot of tasteful architecture very quickly, and then you own all of it. More modules, more state edges, more places where first-run behavior can depend on the wrong subsystem.

I hit that problem in the production browser check. The start button accepted pointer and keyboard activation, but the game stayed on the intro layer under automation. The likely cause is `beginPlay()` waiting for Web Audio startup before changing the phase from `start` to `playing`. For a browser game, I would flip the game state first and let audio resume separately.

The expensive model earned points for atmosphere and future-game vocabulary. It also created the largest audit surface. I would reach for this kind of output when exploring mood, characters, and world language. I would start pruning before turning it into a product.

## Antigravity / Gemini Flash 3.5: Quest Clarity Per Dollar

![Gemini Flash 3.5 Antigravity fluffy planet game](/content/images/fluffy-vibe-gemini35flash-gameplay.png)

The Gemini Flash build is best at quests. Starflower Gathering, Ancient Beacons, Lost Friend, High Summit Altar, Song of the Cosmos. Those names matter. "Guide a lost mini-fluffy home" gives the player a better first minute than another anonymous pickup counter.

The guidance layer is strong too. Circular radar, collapsible quest panel, per-quest progress counts. On mobile the quest panel folds into a bottom control, and the paw jump button stays reachable.

The character reads more like a chibi bear than a pure ball, which I like. The prompt said fluffy ball, but the emotional brief said anime, pastel, soft, ethereal. Face, ears, blush, and body language carry that brief better than mathematical purity.

For cost, this is the interesting Flash result: plenty of player-facing design at a cheaper/faster model class. The player-facing layer had actual work in it: quest concepts, HUD affordances, and navigation cues.

The cleanup list is technical. Largest single JS bundle in my pass. A Three.js `Clock` deprecation warning. Desktop quest panel too heavy when expanded. The design instincts are useful; the production discipline needs supervision.

## Cost And Taste

My notes after running the builds:

- Codex / GPT-5.5 x-high gave me the cleanest small playable slice. Expensive, but tight.
- GLM 5.2 gave me the best price surprise. Solid structure, good mobile layout, one spatial bug later fixed with Codex.
- Claude / Opus 4.8 gave me the richest atmosphere and the most code to own.
- Gemini Flash 3.5 gave me the best quest language and guidance, with bundle cleanup waiting afterward.

Taste appeared in different layers. Codex felt strongest at engineering shape. GLM felt strongest at system decomposition for the money. Claude cared most about place. Gemini cared most about player verbs.

My notebook has this underlined: the model choice changed the default mess I had to clean up.

## What I Would Steal

From Codex: direct-to-game opening, compact loop, performance readout while the prototype is young.

From GLM: state model, codec separation, mobile HUD, and the reminder that a cheaper model can own the main system if I keep checking correctness.

From Claude: world modules, start-screen taste, environmental vocabulary. I would fix the first-play audio coupling before doing anything else.

From Gemini: named quests, radar, progress clarity, and goals that feel like small events instead of counters.

If I merged the best parts, the game would start from Codex's immediacy, use GLM's structure, borrow Claude's atmosphere, and take Gemini's quest design.

## Takeaway

I came out of this with a more concrete model map than I had going in.

For a lean first playable, I would start with Codex. For cheaper bulk systems work, GLM deserves more respect than I expected. For mood and world texture, Claude gave me the most material. For player guidance and quest naming, Gemini Flash punched above its price class.

The next time I start a small WebGL game, I will choose the model based on the mess I am willing to clean up afterward. That feels more useful than arguing about which model is "best."
