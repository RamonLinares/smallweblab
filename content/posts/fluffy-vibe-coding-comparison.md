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

I wanted to learn something concrete, so I gave four coding setups the same game idea and then pushed each result until it became playable enough to inspect with a straight face.

The prompt was intentionally dense:

> make a mobile first but desktop playable too website in 3d, using react and threejs, font-awesome, webgl that is a procedurally generated planet and the user can move a character that is a fluffy ball. the game is relaxed, but the goal is to have five quests in each planet and once achieved it got transported to another different planet with another five quests. The achievement is stored in localstorage but we also give a code to the user so they can enter it in another device and reach the same planet. It should be anime style, pastel colors, light shadows, a bit ethereal

That prompt is useful because it hits several layers at once. It asks for a mood, a character, spherical movement, generated worlds, five goals per planet, persistence, portable codes, mobile controls, desktop controls, WebGL, React, Three.js, and Font Awesome. A model can bluff one or two of those. It has to make architectural choices when all of them appear together.

The four builds:

- `FluffyGPT55xhigh`: Codex with GPT-5.5 x-high.
- `FluffyGLM52`: opencode with GLM 5.2, with one later Codex / GPT-5.5 assist for a compass bug.
- `FluffyClaude`: Claude Code with Opus 4.8.
- `FluffyGemini35Flash`: Antigravity with Gemini Flash 3.5.

## Play And Source Links

- Codex / GPT-5.5 x-high: [play the game](https://ramonlinares.github.io/FluffyGPT55xhigh/) and [open the repository](https://github.com/RamonLinares/FluffyGPT55xhigh).
- opencode / GLM 5.2: [play the game](https://ramonlinares.github.io/FluffyGLM52/) and [open the repository](https://github.com/RamonLinares/FluffyGLM52).
- Claude Code / Opus 4.8: [play the game](https://ramonlinares.github.io/FluffyClaude/) and [open the repository](https://github.com/RamonLinares/FluffyClaude).
- Antigravity / Gemini Flash 3.5: [play the game](https://ramonlinares.github.io/FluffyGemini35Flash/) and [open the repository](https://github.com/RamonLinares/FluffyGemini35Flash).

## Ground Rules

This is a field note, not a lab-grade benchmark. I did not stop after one generation. I did not normalize token counts. I did not force every tool through the same number of turns. I cared about the thing I care about when I build: can I get from prompt to a playable artifact, can I understand the code afterward, and does the result contain ideas worth stealing?

Cost matters in that frame. Some models and harnesses are comfortable to use for long, messy iteration because they are cheap or fast. Others feel like bringing a very expensive lens to a small shoot: sometimes justified, sometimes absurd, often educational. I did not use exact dollar accounting here, so the cost comments are practical rather than financial. The question is value for iteration: how much usable structure, taste, and bug-fixing leverage came back for the model class I was paying to use?

One attribution detail is important. The GLM version was primarily built with opencode and GLM 5.2. Later, when its compass got stuck pointing the wrong way near a collectible, I used Codex with GPT-5.5 to diagnose and patch that bug. So I treat the GLM result as GLM-originated with one premium-model repair, not as a sealed GLM-only specimen.

## What I Checked

I built all four projects on June 27, 2026, served their production `dist` folders locally, checked desktop and phone-sized viewports, then verified the public GitHub Pages deployments.

The useful checks were mundane:

- Does production build without hand edits?
- Does the hosted page load its assets from a GitHub Pages subpath?
- Does a WebGL canvas render?
- Is there enough UI to understand the next goal?
- Does mobile still look like a game, or does the HUD eat the planet?
- Can I see the shape of the code after the model leaves?

![Mobile comparison of the four fluffy planet games](/content/images/fluffy-vibe-coding-mobile-strip.png)

## Codex / GPT-5.5 x-high: Small Engine, Fast Read

![GPT-5.5 x-high Codex fluffy planet game](/content/images/fluffy-vibe-gpt55xhigh-gameplay.png)

The Codex build goes straight to the game. No intro card, no theatrical pause. You get a small planet, a fluffy character, five quest slots, an active objective, code and audio buttons, pause, and a live readout with FPS, draw calls, and triangle count.

That directness is its best quality. It feels like somebody wanted the first playable loop on screen before decorating the hallway. The implementation follows the same instinct. It is built around a compact custom Three.js game class rather than a wide React Three Fiber component forest. That makes the code easy to inspect. You can find the render loop, world generation, player behavior, and save mechanics without spelunking through too many layers.

Taste-wise, it has a nice character read. The white fluffball has a face, volume, and silhouette. The planet is bright and legible. The world does not have the richest fiction, but the main object of play is clear.

The problem is interface pressure. The top HUD behaves like a developer cockpit. It is useful, but the game asks for calm and the UI answers with instrumentation. On mobile it remains playable, but it feels closer to a debugging build than a finished toy.

The cost note is favorable if you care about engineering leverage. A high-reasoning model is expensive, but this version returned a compact, legible, shippable slice with the smallest production JavaScript bundle in my pass, around 775 KB before gzip and 210 KB gzipped. The premium model did not spend its effort on a giant architecture. It spent it on getting a coherent loop into a small shape. That is a good trade when the goal is to learn quickly.

## opencode / GLM 5.2: The Systems Surprise

![GLM 5.2 opencode fluffy planet game](/content/images/fluffy-vibe-glm52-gameplay.png)

The GLM version surprised me. It looks and behaves like a real prototype, not a novelty screenshot. It has React Three Fiber, Zustand state, separate modules for codec, decorations, planet generation, quests, random generation, and shared types. The HUD is tidy. The planet palette is gentle. The compass and quest list make the next action readable.

This is the build I would show someone who believes cheaper models can only make disposable scaffolds. It has the right decomposition for the prompt. Persistence and journey codes live away from rendering. Quest generation is its own concern. The scene components do not feel randomly dumped into one file. Those are boring choices, which is exactly why they matter.

The mobile read is also strong. The top controls stay compact, the quest panel has a clean hierarchy, and the planet keeps enough screen real estate to feel playable. The art direction is not the most expensive-looking of the set, but it is disciplined. Pastel without becoming beige fog. Low-poly without becoming empty.

The caveat is the compass bug. In one later session, I was standing beside a collectible and the compass pointed the wrong way. Codex with GPT-5.5 audited the bug and fixed two details: an extra inversion in the projected tangent direction, and the Font Awesome arrow's base rotation. That is a meaningful footnote. GLM produced the systems-heavy body of the game, but a premium model helped repair a subtle spatial UI bug.

That footnote is also the cost lesson. A cheaper model plus a targeted expensive debugging pass can be a very attractive workflow. You do not always need the most expensive model to write every line. Sometimes the right economic shape is: let the cheaper model build the bulk of the system, then bring in the expensive model when the bug requires geometry, browser evidence, and careful reasoning.

The downside is asset and dependency weight. Font Awesome arrives as font files and a larger CSS footprint. The JavaScript bundle is also large. For a one-off prototype I can live with that. For a serious browser game, I would put it on a diet early.

## Claude Code / Opus 4.8: World-Building Appetite

![Claude Opus 4.8 Claude Code fluffy planet game](/content/images/fluffy-vibe-claude-opus48-gameplay.png)

The Claude version has the most world-building appetite. The file tree is large and granular: audio, colliders, compass, input, noise, planet, quests, share codes, storage, theme, plus separate scene components for atmosphere, aurora, clouds, comets, floating islets, landmarks, moons, particles, portal, rings, sky dome, starfield, suns, and the fluffball.

That can be good. The world has presence. The start screen has color selection, clear control hints, and a nice sense of invitation. The planet behind it has terrain details, crystals, trees, floating pieces, and atmospheric dressing. This build understands that "ethereal" is not a material setting. It is composition, softness, depth, and a bit of restraint.

It also shows the risk of expensive abundance. Opus-class work can give you a lot of architecture very quickly. Some of it is tasteful. Some of it becomes surface area you now own. More modules mean more places where state can get sticky, where first-run behavior can depend on the wrong subsystem, where a beautiful intro can hide a broken transition.

That happened here in my production browser check. The start button accepted pointer and keyboard activation, but the game stayed on the intro layer under automation. Reading the code, the likely culprit is that `beginPlay()` waits for Web Audio startup before changing the phase from `start` to `playing`. A browser game should not make the first click hostage to audio policy. Flip the game state, let audio resume if it can, and keep playing if it cannot.

The cost read is mixed. The expensive model gave the richest sense of place and the broadest future game skeleton. It also produced the most architecture to audit. If I were exploring art direction, mood, and world language, I would pay attention to this version. If I needed a lean production path, I would start cutting immediately.

## Antigravity / Gemini Flash 3.5: Quest Clarity Per Dollar

![Gemini Flash 3.5 Antigravity fluffy planet game](/content/images/fluffy-vibe-gemini35flash-gameplay.png)

The Gemini Flash version is the clearest about quests. It names the five activities: Starflower Gathering, Ancient Beacons, Lost Friend, High Summit Altar, and Song of the Cosmos. That matters. Relaxed games still need verbs. "Collect five tokens" is a mechanic. "Guide a lost mini-fluffy home" is a tiny story.

The guidance layer is also strong. The circular radar, collapsible quest panel, and per-quest progress counters make the objective state obvious. On mobile the quest panel collapses into a bottom control, and the paw jump button stays reachable. It is the most tutorial-minded build, in a good way.

The character reads more like a chibi bear than a pure abstract ball. I like that choice. The prompt asked for a fluffy ball, but the emotional brief asked for anime, pastel, and ethereal. A face, ears, blush, and soft body language do more work than a perfect sphere would.

The cost angle is interesting because Flash-class models are usually attractive for iteration. You expect speed and lower cost, and here the result has plenty of player-facing design. The model did not merely make scenery. It authored quest concepts and HUD affordances.

The tradeoff is production hygiene. This build had the largest single JavaScript bundle in my pass, and it emitted a Three.js `Clock` deprecation warning. The expanded desktop quest panel is also heavy. The information design is useful, but the screen could breathe more.

I would use this version as a reminder that cheaper or faster models can be very good at player guidance. I would not assume they will make the leanest bundle or the cleanest technical baseline without supervision.

## Cost And Taste

The interesting pattern is not "expensive model wins" or "cheap model catches up." The pattern is more useful than that.

- Codex / GPT-5.5 x-high gave the cleanest small playable slice. Expensive, but efficient in code shape.
- GLM 5.2 gave the best cost-surprise: solid systems, good mobile read, and one subtle bug that benefited from a premium assist.
- Claude / Opus 4.8 gave the richest world and the biggest ownership surface.
- Gemini Flash 3.5 gave the clearest quest language and guidance, with bundle and HUD cleanup left on the table.

Taste showed up in different places. Codex had engineering taste. GLM had systems taste. Claude had atmosphere taste. Gemini had objective-design taste.

That is the part I wanted to learn. The model choice changes the default bias of the build. It changes what you get for free, what you must correct, and where your own judgment has to enter.

## What I Would Steal

From Codex, I would steal the direct-to-game opening, the compact custom loop, and the willingness to expose performance numbers while the prototype is young.

From GLM, I would steal the state model, the codec separation, the mobile HUD, and the idea that a cheaper model can own the main system if the human keeps pressure on correctness.

From Claude, I would steal the world-language modules, the start-screen taste, and the richer environmental vocabulary. I would also move the first-play state transition away from audio startup before doing anything else.

From Gemini, I would steal the named quests, the radar, the progress clarity, and the instinct to make each goal feel like a small event rather than a pickup counter.

The best version is a composite: Codex's immediacy, GLM's structure, Claude's atmosphere, and Gemini's player guidance.

## Takeaway

The same prompt did not produce four interchangeable games. It produced four biases.

That is what makes this kind of comparison useful. A model is not only a code generator. It is a taste vector, an architecture prior, a cost profile, and a debugging partner. The productive question is not which one is smartest in the abstract. The useful question is where each one bends the project, and whether that bend is worth the money.
