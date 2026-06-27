---
title: "Four Alien Weather Observatories From One Prompt"
slug: "alien-weather-observatory-model-comparison"
description: "A technical field report on four React and Three.js alien weather observatories generated from the same prompt, deployed to GitHub Pages, and tested in the browser."
date: "2026-06-27T18:30:00+02:00"
category: "ai"
tags: ["AI Build", "Three.js", "React", "WebGL", "Vibe Coding"]
coverImage: "/content/images/alien-weather-observatory-comparison-cover.jpg"
draft: false
---

I repeated the same comparison pattern as the fluffy-planet run, but changed the brief from a character game to a tiny scientific instrument.

Same prompt, four coding environments, four public GitHub repositories, four GitHub Pages deployments. I let each model take the first swing, then I did the boring release work: install, build, run, check the subpath, click the thing, inspect console output, capture desktop and mobile screenshots, and fix only the parts that blocked a working public site.

The prompt:

> Make a mobile-first but desktop-usable website using React, Three.js, WebGL, and Font Awesome. It should be a tiny interactive 3D observatory for studying imaginary weather on alien worlds. The user can rotate and inspect a procedurally generated planet, launch weather probes, collect atmospheric readings, and unlock five discoveries per planet. After five discoveries, the site generates a new planet with a different climate, palette, terrain, sky, and weather behavior. Progress is stored in localStorage, and the user also gets a short recovery code they can enter on another device to restore their current planet and discovery state. The mood should be quiet, tactile, scientific, anime-adjacent, pastel but not childish, with soft shadows, elegant UI, and a sense of wonder. It must run well on mobile and also be comfortable on desktop.

This is a useful prompt because it is awkward in several places. It asks for mood and machinery at the same time. It asks for 3D inspection, procedural planets, state persistence, recovery codes, five discoveries, and a mobile layout. It is easy to make a pretty sphere. It is harder to make a small instrument that survives deployment.

![Four alien weather observatories from one prompt](/content/images/alien-weather-observatory-comparison-cover.jpg)

## Play And Source Links

- Codex / GPT-5.5: [open the live observatory](https://ramonlinares.github.io/alien-weather-observatory-codex-gpt55/) and [open the repository](https://github.com/RamonLinares/alien-weather-observatory-codex-gpt55).
- Claude Code / Opus 4.8: [open the live observatory](https://ramonlinares.github.io/alien-weather-observatory-claude-opus48/) and [open the repository](https://github.com/RamonLinares/alien-weather-observatory-claude-opus48).
- opencode / GLM 5.2: [open the live observatory](https://ramonlinares.github.io/alien-weather-observatory-opencode-glm52/) and [open the repository](https://github.com/RamonLinares/alien-weather-observatory-opencode-glm52).
- Google Antigravity / Gemini Flash 3.5: [open the live observatory](https://ramonlinares.github.io/alien-weather-observatory-antigravity-gemini-flash35/) and [open the repository](https://github.com/RamonLinares/alien-weather-observatory-antigravity-gemini-flash35).

## What I Checked

I built the four projects on June 27, 2026, deployed each one from a `gh-pages` branch, then tested the public GitHub Pages URLs.

The release checklist was simple:

- Production build passes.
- Vite asset paths work from the GitHub Pages project subpath.
- The public URL returns HTTP 200.
- A WebGL canvas appears and the screenshot is not blank.
- Recovery code UI exists and can be opened when hidden behind a menu or icon.
- One probe interaction changes state.
- localStorage receives the expected project key.
- Desktop and mobile layouts avoid horizontal overflow.

The live screenshot pixel checks all passed. The browser console checks were more informative than the screenshots. OpenCode had a real shader compile error before repair. Antigravity shipped with nonfatal WebGL warnings. Claude shipped with deprecation warnings. Codex was clean apart from Chromium GPU readback warnings caused by screenshot capture.

![Mobile comparison of the four alien weather observatories](/content/images/alien-weather-observatory-mobile-strip.jpg)

## Codex / GPT-5.5: The Small Instrument

![Codex GPT-5.5 alien weather observatory](/content/images/alien-weather-observatory-codex-gpt55-desktop.jpg)

The Codex build feels like a compact field instrument. It opens straight into a pale observatory layout with a central planet, readings on the left, discoveries on the right, and clear controls under the canvas. The recovery code is visible without hunting through a menu. Probe launch changes the readings and unlocks the first discovery.

The source shape is also compact: React for UI, a lazy-loaded Three.js scene, a planet catalog module, storage helpers, and one main stylesheet. It is the easiest of the four to scan.

Codex did one thing that matters for the comparison: during its own first run it hit a rendered runtime error, `React is not defined`, then fixed the import path and reran browser QA. I did not add a better prompt. The model repaired itself inside the initial generation session.

My release cleanup was small. Codex did not create a Vite config, so I added the exact GitHub Pages `base` path. After that, `npm run build` passed and the public URL loaded correctly.

Observable latency and cost notes: the Codex CLI reported `real 923.79s` and `271,214` tokens. I did not get a dollar figure from the local CLI. It was slow enough to feel like a premium run, but the result needed the least external repair.

Natural strengths:

- Clear product surface.
- Recovery code and restore UI are obvious.
- Good browser QA habits inside the initial run.
- Small architecture with low ownership overhead.

Cleanup work:

- Add Vite `base` for GitHub Pages.
- Note that the harness generated a visual concept reference, which was useful for its own process but not part of the shared prompt.

## Claude Code / Opus 4.8: The Atmospheric One

![Claude Opus 4.8 alien weather observatory](/content/images/alien-weather-observatory-claude-opus48-desktop.jpg)

Claude produced the most atmospheric planet. The scene has a confident low-poly read, soft particles, rings when the planet calls for them, and a HUD that treats the planet as a place rather than a demo object. Its language is also good: climates such as `Tideglass` and `Emberwild` feel like labels an observatory might actually use.

The implementation uses React Three Fiber and Drei instead of plain imperative Three.js. It also has a well-separated internal model: seeded RNG, noise, planet generation, discoveries, storage, recovery codes, and Three scene components. Recovery exists behind a key icon. My first smoke script missed it because the visible button text is empty, but the `aria-label` is correct and the modal works.

Claude's cleanup was mostly release plumbing. I changed the Vite `base` from `./` to the exact repository path. The app then built and deployed without runtime errors.

The tradeoff is bundle size and dependency surface. The built JavaScript was about `1,223.84 kB` before gzip and `338.70 kB` gzip. That is not catastrophic for a WebGL toy, but it is a real difference. The live console also reports Three.js deprecation warnings for `THREE.Clock` and `PCFSoftShadowMap`.

Observable latency and cost notes: the accepted CLI model ID was `claude-opus-4-8`; the friendly label `Opus 4.8` failed. The generation run reported `real 934.69s`. I did not get a final dollar number. A tiny budget probe did trip its budget limit, which confirmed that the model path was live but was not part of the app generation.

Natural strengths:

- Strong atmosphere and naming.
- Sensible state and recovery-code modules.
- Accessible icon buttons with labels.
- Good spatial composition on desktop and mobile.

Cleanup work:

- Exact GitHub Pages base path.
- Bundle and deprecation cleanup if this were more than a comparison artifact.

## opencode / GLM 5.2: The Ambitious Systems Build

![OpenCode GLM 5.2 alien weather observatory](/content/images/alien-weather-observatory-opencode-glm52-desktop.jpg)

The OpenCode GLM build is the most ambitious codebase. It generated a TypeScript project with separate modules for climates, discoveries, names, noise, planet generation, readings, recovery codes, storage, UI labels, React state, and a custom Three.js scene. It also wrote logic tests and a browser test.

That structure is the impressive part. A cheaper model class produced a serious system outline, with custom shaders and a dense scientific UI. The recovery code exists in a menu. The localStorage key is clean. The dashboard has the most technical feel of the four.

It also created the most cleanup work.

The OpenCode app itself became stale. The UI sat in a "Thinking / Visual Design" state long after the project had source files, screenshots, tests, and a built `dist`. Attempts to stop it through the UI did not visibly cancel the session. I stopped trusting the harness state and moved to filesystem verification.

The generated Vite base path was `/opencode-glm52/`, which did not match the final repository slug. There was no `.gitignore`, so `node_modules`, `dist`, and generated screenshot artifacts would have been committed. Those were straightforward release fixes.

The real breakage was in WebGL. The cloud fragment shader used `uLightDirW` but did not declare it, which caused a live shader compile error. I patched that by adding the missing uniform declaration. After that, the console error disappeared.

The second real bug was interaction. `element.click()` on the launch button worked, but real pointer clicks did not change state reliably in browser automation. I patched the launch button to fire on pointer-down with event isolation, while keeping keyboard activation. After rebuilding and redeploying, a real browser click on the public GitHub Pages site created a reading and unlocked discoveries.

This is the clearest cross-model assistance case in the run. OpenCode and GLM produced the application body. Codex, acting as orchestrator, repaired the shader and pointer interaction after OpenCode stalled.

Observable latency and cost notes: the OpenCode GUI did not give me a clean final timing or cost. Wall-clock behavior was worse than the generated code suggested because the harness state stalled. The app had generated enough artifacts to build, but I had to decide when to stop waiting.

Natural strengths:

- Strong module decomposition for the price class.
- Real TypeScript architecture.
- Recovery-code implementation present.
- Richest generated test ambition.

Cleanup work:

- `.gitignore`.
- GitHub Pages base path.
- Shader uniform fix.
- Pointer-launch fix.
- Treat stale harness state as unreliable.

## Antigravity / Gemini Flash 3.5: The Dashboard

![Antigravity Gemini Flash 3.5 alien weather observatory](/content/images/alien-weather-observatory-antigravity-gemini-flash35-desktop.jpg)

Antigravity produced the most dashboard-like result. It names the app `Aetheria Observatory`, wraps the planet in telemetry panels, adds scan modes, lists gas composition, and gives the user a `Menu / Restore` button. The probe loop works: tap the planet, get `Probe Alpha`, readings, and one unlocked anomaly.

The UI has a strong instrument fantasy. It is less pastel and quiet than the prompt asked for, but it has taste. It feels like a sci-fi diagnostic panel rather than a toy planet. That is a defensible interpretation, even if it bends the mood toward dark neon.

The harness had two important behaviors. First, it stopped after about `50s` with an implementation plan and required a `Proceed` click. I treated that as a harness gate, not a prompt improvement. Second, after about `11m` of implementation it reported that its browser subagent could not run because Chromium automation was only supported on Linux in its sandbox. I did the external Playwright QA myself.

The code is less tidy than the best parts of Claude or GLM. Much of the core implementation sits in a large `App.tsx`, with generated assets and template leftovers around it. Font Awesome is loaded from a CDN rather than installed as a local dependency. After the first deployment, a small generated component diff appeared in the working tree. I treated it as part of the Antigravity run, committed it, rebuilt, and redeployed. It replaced `THREE.Clock` timing with capped `performance.now()` timing, which removed the Three.js deprecation warning. The final live browser console still reports WebGL `texImage3D` warnings.

Observable latency and cost notes: the visible harness timing was the clearest of the GUI tools, roughly `50s` to plan plus `11m` to implementation. I did not see a dollar number. It felt fast relative to the amount of player-facing UI it produced.

Natural strengths:

- Strong dashboard affordances.
- Clear telemetry fiction.
- Recovery and reset are discoverable.
- Fast route to a public, usable artifact.

Cleanup work:

- Exact GitHub Pages base path.
- External browser QA because its browser subagent could not run.
- Future cleanup would split the large app file and investigate the remaining WebGL warnings.

## Cost, Latency, And Where Attention Went

Exact cost data was uneven. Codex printed tokens, but not dollars. Claude printed wall time, not final dollars. OpenCode did not give me a trustworthy finish state. Antigravity gave visible work durations, but no cost.

The practical latency story was still clear:

- Codex and Claude both took about fifteen and a half minutes in CLI generation.
- Antigravity reached an implementation plan quickly, then finished the visible implementation in about eleven minutes after the gate.
- OpenCode produced a large codebase, but the app UI stayed stale and forced me to judge completion from disk.

Intervention effort was not evenly distributed:

- Codex needed one release edit.
- Claude needed one release edit.
- Antigravity needed one release edit, one late source fold-in, and external QA.
- OpenCode needed release edits plus two real runtime/usability fixes.

That is the part I care about. The model choice changed the initial screenshot, and it also changed the kind of cleanup I had to do afterward.

## What I Learned

For this prompt, Codex was the best default when I wanted a compact working instrument with the least repair. Claude was the best at mood, naming, and scene presence. OpenCode with GLM 5.2 was the best reminder that cheaper models can draft serious architecture, but I would budget time for browser-level correctness. Antigravity with Gemini Flash 3.5 was the quickest path to a rich dashboard surface, with the caveat that its own browser QA failed in the harness.

I would choose based on the cleanup I am willing to own.

If I need the first public artifact to be coherent with little surgery, I start with Codex. If I want world texture and am willing to prune, I use Claude. If I want a lower-cost model to draft the system, I give GLM a chance and reserve a stronger model for shader, pointer, and geometry bugs. If I need a fast UI-heavy concept with lots of telemetry flavor, Gemini Flash in Antigravity is useful, provided I run independent QA.

The final takeaway is less about a leaderboard and more about workflow design. A model is a generator, plus a source of future maintenance shape. Pick the one whose likely mess matches the time, budget, and debugging appetite you actually have.
