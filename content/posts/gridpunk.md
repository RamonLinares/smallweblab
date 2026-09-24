---
title: "GridPunk: Three Worlds, Eight Circuits"
slug: "gridpunk"
description: "GridPunk is a free browser racing game with Cyberpunk, Solarpunk, and Steampunk worlds, eight circuits in each — six of them with real hills — two cars, five AI rivals, and a cinematic graphics mode."
date: "2026-09-20"
category: "games"
tags: ["GridPunk", "Browser Racing Game", "Cyberpunk", "Solarpunk", "Steampunk", "Three.js", "Claude Opus 5.5", "AI Game Development"]
coverImage: "/content/images/gridpunk-neon-race.png"
draft: false
---

[Play GridPunk](https://gridpunk.smallweblab.com/)  
[Explore the source on GitHub](https://github.com/RamonLinares/GridPunk)

GridPunk is a browser racing game set in fictional cities. You choose a world, a circuit, and a car, then race five AI rivals over three laps. There is no account or separate installation.

When this entry was first published on 20 September, the game had one circuit: Neon District, a rainy cyberpunk city at night. Two days later it had three worlds — **Cyberpunk**, **Solarpunk**, and **Steampunk** — with two road layouts in each. Since 22 September, almost all of the work has been done with **Claude Opus 5.5**, and the game now has **eight layouts in every world**: 24 circuit and scenery combinations, six of them on layouts with real elevation changes of up to 96 metres. This update describes what was added, what I asked for, and what still needed fixing after I drove it.

## Worlds And Circuits

The menu separates the world from the road layout. The world decides the city, lighting, weather, signage, and HUD styling. The circuit decides the road:

- **Neon District** — 3.744 km, 12 corners, banked turns, elevated sections, and a tunnel.
- **Kairo Loop** — 5.807 km, 18 corners, a figure-eight that crosses itself on an 8-metre flyover.
- **Mirage Streets** — 3.337 km, 19 corners. Walls within reach, a hairpin at walking pace, and a 40-metre climb through the old town.
- **Cinder Bend** — 3.602 km, 11 corners. Short and steep: a 55-metre climb to a crest, then a blind drop.
- **Sable Ring** — 4.657 km, 14 corners. A long opening straight and flowing mid-speed corners.
- **Orbit Bowl** — 5.414 km, 22 corners. Stop-start streets wrapped around a steeply banked sweep.
- **Zenith Park** — 5.513 km, 20 corners. A steep climb into turn one and fast esses.
- **Talon Run** — 7.004 km, 19 corners. A dive into a valley, a climb to a ridge, and long high-speed sweeps.

Switching world keeps the selected layout and car, so it is easy to drive the same corners through different scenery. Personal bests and replay files are stored separately for all 24 combinations.

![GridPunk's race-select screen in the Steampunk world, with all eight circuits, the track map and the start button](/content/images/gridpunk-race-select.webp)

## What Claude Opus 5.5 Built

Opus 5.5 co-authored the work below over about two days. I described what I wanted, played the result, and sent back screenshots whenever something looked wrong. Much of the interesting part is in those second rounds.

### A menu that feels like a game

A first stage-selection screen already existed, but it didn't have the feel of a AAA racing game. I asked Opus 5.5 to improve it or start again, and it rebuilt it from scratch. The backdrop art was re-shot in the game's own Cinematic mode with a low, long-lens camera. Each world has its own rain, pollen, or ember particles, and the screen plays an intro sequence and a light streak when you switch world. There are synthesised menu sounds, keyboard and gamepad navigation, and an animated map with a dot lapping the circuit. The old green terminal loading screen became a title card for the race you picked, with the circuit drawing itself in. I also pointed out that the race toolbar's dark square buttons didn't match the HUD, and they became line icons on thin rules with captions.

![The loading card: the circuit name, world and conditions over the world's artwork, with staged progress and the track map](/content/images/gridpunk-loading.webp)

### A building from a single picture

I gave Opus 5.5 one reference image of a steampunk factory and asked for it to be as close as possible. The result is **Brass & Co.**, an engine house on its own railed plaza. It has a clockwork rose window with turning gears and a glazed barrel vault with a ridge walkway. A copper boiler labelled FUEL / POWER / PROGRESS feeds an arching main, and there are two banded smokestacks, a tank on a braced balcony, a domed weather-vane tower, a flywheel gantry with an outside stair, and a crane with cargo. The metalwork carries riveted plate seams and soot streaks, and the whole landmark renders in about 25 draw calls. It closes the back straight on Kairo Steam and rises beside the start straight on Neon Steam.

![Brass & Co., the modelled engine house, at golden hour](/content/images/gridpunk-brass-co.webp)

### Streets with character

I liked Brass & Co. enough to ask for more of it: fewer "blocks of glass and bricks", more buildings with soul. Opus 5.5 built eight street set pieces in the same style and lined every Steampunk circuit with them:

- a guild hall with a clock spire
- a gasworks with a lattice-framed gasholder
- a pumping station with a beam engine and a turning flywheel
- an observatory with a telescope and orrery
- an airship chandlery with a moored dirigible
- a printing works with a round window and sawtooth roof
- a bank with a columned front and copper dome
- a railway depot with a locomotive and water tower

Each design is modelled once and repeated. Beyond 220 metres a building switches to a simpler version, and beyond one kilometre it is left to the skyline. The street ends up with fewer draw calls than the plain blocks it replaced. I then pointed out that the windows looked unfinished and the glass was flat yellow. They were rebuilt with proper arched frames, glazing bars, stone surrounds, sky reflections, and lamp-lit rooms behind tied-back curtains, with about three in ten left dark.

![An airship chandlery with a moored dirigible, between a domed observatory and brick terraces](/content/images/gridpunk-airship-chandlery.webp)

### Six circuits with hills

I asked for the layouts from the project GridPunk grew out of, under made-up names. Opus 5.5 imported six more layouts from mapped data (OpenStreetMap contributors, ODbL). When I found out it had planned to flatten them, I pushed back: half the fun of some circuits is the elevation. So the surveyed climbs stay in. The cities of all three worlds now sit on terrain that follows the road, with buildings seated on the slope, retaining walls where a higher part of the lap passes close by, and masonry shading on steep faces.

![Cinder Solar, climbing towards the crest between planted walls and street trees](/content/images/gridpunk-cinder-climb.webp)

This part took the most rounds, and each one came from me driving the game:

- **Mountains over the road.** The first terrain rose through the asphalt on steep sections, and several things floated. The ground is now carved below the road everywhere. Grandstands, flags, pedestrians, lamps and bridge legs were all seated properly, and every road point on all 18 new races is checked by casting rays down onto it.
- **Walls folding across hairpins.** Some mapped hairpins were tighter than the barriers' 12-metre offset, so the inner wall folded over the road. The import now eases any corner tighter than 16.5 metres while keeping its full turn and the lap length.
- **A skytrain floating in front of me.** The Cyberpunk skytrain's 110-metre beam was designed for flat streets. On hills it hung low over the other leg of a hairpin and ended in mid-air. On hilly circuits the transit portals are now gantries on their own columns and are skipped wherever the lap passes beneath them.
- **Vines hanging off nothing.** On Talon Solar, facade vines, terrace trees and printed slogans still used flat-city heights, so they hung beside their buildings. They now share the building's ground offset. A new audit checks that every plant and raised object across all 24 races touches the ground or something solid.

### Earlier in the same run

Before the menu work, Opus 5.5 had already given the Solarpunk and Steampunk worlds their own Cinematic looks: a golden-hour sun with shafts and lit gas lamps for Steampunk, an afternoon film-print grade and aerial haze for Solarpunk. It overhauled the Solarpunk cities with twisting vertical-forest towers, terraced hill blocks, sail towers, glasshouse domes, and a 300-metre Arbor Spire with a waterfall. Races gained rain spray thrown off every car's rear tyres, over-run backfires, rival tyre smoke, and contact debris. Rivals got team liveries. The HUD gained a live delta to your best lap, a running order, position-change feedback, a final-lap banner, and shift lights.

## Kairo Loop

Kairo's centreline and corner order were adapted from the same kind of mapped data. On Kairo the elevations are flattened to city level, apart from a smooth 8-metre flyover where the figure-eight crosses. The physics filters contacts by deck, so a car on the bridge cannot collide with one passing underneath.

The Cyberpunk version adds a 198-metre Ferris wheel with pink rim lights beyond the first turn, floating holograms showing ramen and bonsai footage, and a Mars travel advert with a processed public-address voice.

![Kairo Solar, with Helios Grove's solar towers, a zeppelin, and planted buildings ahead of the player's car](/content/images/gridpunk-kairo-solar.webp)

On Kairo Solar, three civic districts mark the lap: **Helios Grove**, **The Glasshouse**, and **Harvest Commons**. On Kairo Steam, the **Clockworks** tower, **Boiler Works**, the **Royal Kairo Aerodrome**, and now Brass & Co. do the same.

![Kairo Steam, with the Clockworks tower and its brass flywheels at the end of a straight](/content/images/gridpunk-kairo-steam.webp)

All scenery uses procedural geometry and textures written in the repository. No models or images were downloaded or generated for the cities.

## Cars, Rivals, And Settings

The garage offers the **Shinsei ND-01**, an armoured prototype, and the **Kurogane K89-R**, an open-cockpit car. Driver assists are fixed at Rookie. Rival difficulty can be Rookie, Sport, or Expert, and rivals use the same physics, grip, and engine as your car, with no position-dependent speed boosts. On every new layout, six AI cars complete two valid laps without touching a wall or leaving the road.

The **Cinematic** graphics tier adds distance mist, a film-style colour grade, anamorphic light streaks, and depth of field in replays, with a different look in each world.

## Implementation And Verification

GridPunk uses TypeScript, Three.js, and Vite. Vehicle simulation runs on a fixed 120 Hz step. The public repository includes the source, asset credits, authoring files, build scripts, and notes for each circuit and repair. Claude Opus 5.5 co-authored everything from 22 September onwards except the first stage-selection screen. Claude Fable 5.1 co-authored the original Cinematic tier and an earlier menu design, and Codex handled the original camera and material work.

The production suite now runs 64 browser tests at 1440 × 900 and at a 390 × 844 touch-emulated phone size. They drive every world with real keyboard and touch input, launch the new layouts from the menu, and check layout identity, keyboard navigation, and independent lap records. Alongside them are scripts that raycast every road point for anything covering it, audit every object for being attached to something, measure draw calls and triangles against the previous version, and simulate six-car races on every layout. When I found a problem in play, the fix usually came with a new check for the whole class of problem, not just the spot I had reported.

Some limits remain. Mobile testing uses browser emulation, not physical phones. The Solarpunk world is the heaviest scene, and renderer counts are observations rather than frame-rate guarantees. On the tightest hilly circuit, Mirage Streets, the retaining walls are large and still plain. Gamepad hardware, the full replay-export workflow, and subjective audio quality are not covered by automated tests.

## How To Play

Open [GridPunk](https://gridpunk.smallweblab.com/), choose a world with **Q / E** or the arrow keys, a circuit with **↑ / ↓**, and press **Enter**. You can also link directly to a combination, for example [Talon Run in the Steampunk world](https://gridpunk.smallweblab.com/?circuit=talon-steam) or [Cinder Bend by day](https://gridpunk.smallweblab.com/?circuit=cinder-solar).

- **WASD or arrow keys** control the car; **S or Down** brakes and reverses at rest.
- **Space** brakes.
- **C** changes the camera.
- **R** recovers the car to the track.
- **Escape** pauses or resumes the race.

On a gamepad, use the left stick and triggers; LB / RB and the D-pad work in the menu, Start pauses, X changes the camera, and Y recovers the car. Touch devices show on-screen driving controls.

GridPunk joins [Horizon Drive](/posts/horizon-drive/) and [Bumper Hearts](/posts/bumper-hearts/) in the lab's browser games collection. Neon District at night is still a good place to start. For elevation, try Talon Run, which drops into a valley and climbs 96 metres to a ridge.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "@id": "https://smallweblab.com/posts/gridpunk/#game",
  "name": "GridPunk",
  "description": "A free browser racing game with Cyberpunk, Solarpunk, and Steampunk worlds, eight circuits per world including six with real elevation changes, three-lap races, two selectable cars, and five AI rivals.",
  "url": "https://gridpunk.smallweblab.com/",
  "mainEntityOfPage": "https://smallweblab.com/posts/gridpunk/",
  "image": "https://smallweblab.com/content/images/gridpunk-neon-race.png",
  "sameAs": "https://github.com/RamonLinares/GridPunk",
  "genre": "Racing",
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
