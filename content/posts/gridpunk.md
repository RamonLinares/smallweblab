---
title: "GridPunk: Three Cities, Two Circuits"
slug: "gridpunk"
description: "GridPunk is a free browser racing game with Cyberpunk, Solarpunk, and Steampunk stages, two city circuits in each, two cars, five AI rivals, and a cinematic graphics mode."
date: "2026-09-20"
category: "games"
tags: ["GridPunk", "Browser Racing Game", "Cyberpunk", "Solarpunk", "Steampunk", "Three.js", "AI Game Development"]
coverImage: "/content/images/gridpunk-neon-race.png"
draft: false
---

[Play GridPunk](https://gridpunk.smallweblab.com/)  
[Explore the source on GitHub](https://github.com/RamonLinares/GridPunk)

GridPunk is a browser racing game set in fictional cities. You choose a stage, a circuit, and a car, then race five AI rivals over three laps. There is no account or separate installation.

When this entry was first published on 20 September, the game had one circuit: Neon District, a rainy cyberpunk city at night. Two days of work later, it has three stages — **Cyberpunk**, **Solarpunk**, and **Steampunk** — and each one contains two road layouts. That makes six circuit and scenery combinations, each with its own lap records. This update describes what was added and what needed fixing along the way.

## Stages And Circuits

The menu separates the world theme from the road layout. The stage decides the city, lighting, weather, signage, and HUD styling. The circuit decides the road:

- **Neon District** is 3.744 kilometres long, with twelve corners, banked turns, elevated sections, and a tunnel.
- **Kairo Loop** is 5.807 kilometres long, with eighteen corners and a figure-eight layout that crosses itself on an 8-metre flyover.

Switching stage keeps the selected layout and car, so it is easy to drive the same corners through different scenery. Personal bests and replay files are stored separately for each combination.

![GridPunk's session menu with the Steampunk stage, Neon District circuit, car, rivals, and graphics settings](/content/images/gridpunk-stage-select.webp)

Neon District's geometry is shared exactly across all three stages. An automated check compares the sampled position and orientation of the road at every point, including the banked turns, against the original. The tunnel keeps its 7.2 metres of clearance in each version, but it is dressed differently: a planted-roof underpass in the Solarpunk city and a passage lined with copper service mains and iron ribs in the Steampunk one.

## Kairo Loop

Kairo's centreline and corner order were adapted from mapped data of a real racing circuit, which OpenStreetMap contributors made available under the ODbL. The survey elevations were flattened to city level, apart from a smooth 8-metre flyover where the figure-eight crosses. The flyover has roughly 180-metre ramps, and the physics filters contacts by deck so that a car on the bridge cannot collide with one passing underneath. In a two-lap simulation with all six cars, no car hit a wall, left the road, or jumped between decks.

The Cyberpunk version keeps the night setting from Neon District and adds several landmarks. A 198-metre Ferris wheel with pink rim lights stands beyond the first turn and completes one rotation every nine minutes. Floating holograms show ramen and bonsai footage, and a Mars travel advert plays on a large screen with a processed public-address voice.

Two of these needed a second attempt. The Mars screen was first mounted on the side of a building, where it was hard to read at racing speed. It now sits on a dedicated media building beyond Turn 1, facing straight down the opening straight. The bonsai music was initially masked by the engines. I raised its level and extended its audible range, then lowered it again after hearing it in the game. The final track is a 10-second excerpt from a shamisen recording I supplied, looped quietly near the two bonsai holograms.

The underside of the flyover also received more detail after I noticed how plain it looked from the lower road: steel webs, crossmembers, service pipes, and maintenance lights, all generated in code and batched to keep the draw-call cost low.

## Solarpunk: A Garden City In Daylight

The Solarpunk stage moves the race into daylight. Its buildings have planted terraces, rooftop solar arrays, hanging vines, and glazing on every side. Street trees, hedges, and flower beds line the road, and mountains and a bay frame the skyline.

On Kairo Solar, three civic districts mark different parts of the lap: **Helios Grove**, with copper towers carrying photovoltaic canopies; **The Glasshouse**, a ribbed botanical conservatory; and **Harvest Commons**, a terraced vertical farm with a market. Three wind turbines turn beside the road, and three zeppelins drift above the towers.

![Kairo Solar, with Helios Grove's solar towers, a zeppelin, and planted buildings ahead of the player's car](/content/images/gridpunk-kairo-solar.webp)

This stage needed several repairs after I looked at the first version. The grandstands had been built with their rows turned 90 degrees from the direction the spectators were facing, leaving stair walls sideways and some spectators floating. They are now built in a single coordinate frame and checked against every road segment. A pale strip also appeared along the edge of the flyover at a distance and disappeared as the car came closer. It was caused by a depth offset on the verge material, and removing it fixed the problem on both Kairo circuits.

## Steampunk: A Foundry City At Sunset

The Steampunk stage uses warm sunset lighting, dry and worn asphalt, sandstone barriers, and brass lettering. The city is made of brick terraces, sawtooth-roofed foundries, glass market halls, copper-domed observatories, and mills. Water towers, loading cranes, fire escapes, and gas lanterns fill the rooftops and streets, while chimneys and pressure valves release steam.

Kairo Steam has its own three landmarks: the **Clockworks** tower with moving hands and large brass flywheels, the copper vessels and banded chimneys of **Boiler Works**, and the **Royal Kairo Aerodrome**, where cargo dirigibles are moored.

![Kairo Steam, with the Clockworks tower and its brass flywheels at the end of a straight](/content/images/gridpunk-kairo-steam.webp)

The first version of this city repeated one red-brick factory block too often. A second pass introduced six distinct building types, so the approaches to each landmark now read differently. A later inspection found rooftop water tanks whose legs stopped short of sloping roofs. The legs are now anchored to the roof surface, and a check raycasts 72 legs across 18 roof configurations to confirm they make contact.

All three stages use procedural geometry and textures written in the repository. No models or images were downloaded or generated for the scenery.

## Cars, Rivals, And Settings

The garage still offers the **Shinsei ND-01**, an armoured prototype, and the **Kurogane K89-R**, an open-cockpit car. The Shinsei wears different sponsor plates on the Solarpunk and Steampunk stages.

Driver assists are now fixed at Rookie, which provides forgiving, speed-weighted steering and traction control. The separate rival difficulty remains: Rookie, Sport, or Expert. I found Expert too easy on Kairo, where my own lap had been 1:54 with wall contact. The rivals were retuned to brake later and carry more speed through corners, using the same physics, grip, and engine as the player's car. There are no position-dependent speed boosts. In the benchmark, the Expert field averages about 108 seconds per lap on Kairo, and every rival finished ahead of a scripted reference driver that completed a clean 111.9-second lap.

The graphics settings gained a **Cinematic** tier above Extreme. It adds distance mist, a film-style colour grade, anamorphic light streaks, a subtle analogue-tape texture, and depth-of-field in replays. The same update fixed street lamps that appeared to switch on only as the car arrived: more lights now serve the nearest lamps and fade in gradually from 140 metres away.

The menu was also simplified into a single panel that fits on one screen on desktop and phone. Loading now shows a green phosphor terminal with scanlines, a shadow mask, and a short boot log.

## Cameras And Replays

One of the first playtesting changes was the close chase camera. It had moved farther away as the car accelerated, and its field of view widened with speed, making the car appear small. The follow distance changed from 9.2 metres to 5.4 metres, and the speed-based pullback and widening lens were removed from that view. A regression check varies speed and frame duration to confirm the framing stays steady.

Replays had a different problem: on some circuits, a trackside camera could end up behind a wall, hiding the car. The replay director now tests whether barriers, bridge decks, or tunnel walls block the car's body. If they do, it switches to one of several car-relative angles and widens the lens enough to keep the whole car in frame, including in portrait exports.

The close camera also exposed problems on the Shinsei's rear wing, including rivets outside the plate edges and a blocky finish on the upper flap. Those were fixed in the Blender export pipeline, and the upper wing now uses a dedicated texture baked from the car's worn crimson paint.

## Implementation And Verification

GridPunk uses TypeScript, Three.js, and Vite. Vehicle simulation runs on a fixed 120 Hz step. The public repository includes the source, asset credits, authoring files, build scripts, and notes for each circuit and repair. Claude Fable 5.1 was co-author on the Cinematic tier and the menu redesign. Codex handled the original camera and material work described above.

Each addition came with its own browser checks at 1440 × 900 and at a 390 × 844 touch-emulated phone size. The production test suite drives every stage with real keyboard and touch input: acceleration, braking, camera changes, pause, recovery, restart, car switching, and graphics presets. The stage release passed twelve production tests, including exact layout equality across the three versions of Neon District and independent lap records. Other scripts check scenery clearance from the road, landmark visibility, audio levels during drive-bys, and the replay camera's visibility logic. The final runs reported no browser errors or failed asset requests.

Some limits remain. Mobile testing uses browser emulation, so it does not measure performance on physical phones. The Solarpunk stage is the heaviest scene, and the renderer counts recorded during testing are observations rather than frame-rate guarantees. Gamepad hardware, the complete replay-export workflow, and subjective audio quality have not been assessed by automated tests. The main JavaScript bundle is also large enough to trigger Vite's size warning.

## How To Play

Open [GridPunk](https://gridpunk.smallweblab.com/), choose a stage, circuit, car, and settings, then press **Start race**. You can also link directly to a combination, for example [Kairo Solar](https://gridpunk.smallweblab.com/?circuit=solar) or [Neon District in the Steampunk stage](https://gridpunk.smallweblab.com/?stage=steampunk&circuit=neon).

- **WASD or arrow keys** control the car; **S or Down** brakes and reverses at rest.
- **Space** brakes.
- **C** changes the camera.
- **R** recovers the car to the track.
- **Escape** pauses or resumes the race.

On a gamepad, use the left stick and triggers; Start pauses, X changes the camera, and Y recovers the car. Touch devices show on-screen driving controls.

GridPunk joins [Horizon Drive](/posts/horizon-drive/) and [Bumper Hearts](/posts/bumper-hearts/) in the lab's browser games collection. Neon District at night is still a good place to start. Kairo is longer and more demanding, and the daylight stages make its corners easier to learn.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "@id": "https://smallweblab.com/posts/gridpunk/#game",
  "name": "GridPunk",
  "description": "A free browser racing game with Cyberpunk, Solarpunk, and Steampunk stages, two city circuits per stage, three-lap races, two selectable cars, and five AI rivals.",
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
