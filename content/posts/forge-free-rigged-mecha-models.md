---
title: "FORGE: Seven Free Rigged Mecha Models With 61 Animations"
slug: "forge-free-rigged-mecha-models"
description: "Download seven free CC0 rigged mecha models with editable Blender files, GLB exports, and 61 animation clips, built with Codex and Fable 5.1."
date: "2026-09-07"
category: "ai"
tags: ["FORGE", "Mecha Models", "Rigged 3D Models", "Blender", "GLB", "Three.js", "Codex", "Fable 5.1", "Tripo", "CC0"]
coverImage: "/content/images/forge-seraph-wings-open.webp"
draft: false
---

[Explore the FORGE repository](https://github.com/RamonLinares/atlas-09)  
[Open the live 3D viewer](https://ramonlinares.github.io/atlas-09/)  
[Read the CC0 asset licence](https://github.com/RamonLinares/atlas-09/blob/main/ASSET-LICENSE.md)

The first robot looked convincing until it moved. Some geometry around its thighs had been assigned to the arm bones, so raising an arm could pull pieces of the legs along with it.

That error is a useful introduction to **FORGE**, my repository of seven free rigged mecha models, editable Blender sources, and animated GLB files. Generating a detailed robot was one part of the work. Making its armour belong to the correct limbs, keeping its feet on the floor, and giving its attacks a sense of weight required much more iteration.

The seven current GLBs contain **61 exported animation clips in total**. That count includes clips with the same name on different characters, so it should not be read as 61 unique movement designs. The repository also includes a Three.js studio for inspecting and downloading the models, plus a webcam mode that maps a player's pose onto the selected mecha.

The first five characters and the original viewer were developed with **Codex**. **TITAN and VANGUARD were created later with Fable 5.1 in Claude Code**, using the same project structure and character-creation brief.

![SERAPH in the FORGE studio with ten metal feathers fully deployed, alongside animation and inspection controls](/content/images/forge-seraph-wings-open.webp)

## Seven Mechas With Different Mechanical Problems

The collection began with ATLAS, a battle-worn heavy mecha with olive armour, exposed mechanics, a cyan reactor, and a pulse cannon. I wanted to take it beyond a concept image and complete the chain: textured geometry, a mechanical rig, animations, an editable Blender file, a portable GLB, and a browser viewer.

Six more characters followed. They share the same studio, but each has its own mesh, materials, skeleton, animation set, source files, and documentation.

| Character | Direction | Distinctive work |
| --- | --- | --- |
| **ATLAS / 09** | 18-metre weathered heavy mecha | Substantial boots, cyan reactor, pulse cannon, and deliberately heavy movement |
| **AETHER / 02** | 14-metre athletic frame | White armour, lighter proportions, and faster movement |
| **SERAPH / 03** | 20-metre aerial mecha | Articulated metal wings and ten independently hinged feathers |
| **RONIN / 04** | 16-metre samurai mecha | Crimson armour, crescent helmet, and a katana that stays aligned in its grip |
| **SCORPIO / 05** | 17-metre predator frame | Hydraulic pincers and a jointed stinger tail |
| **TITAN / 06** | 19-metre classic super robot | Rocket punch, chest beam, large gauntlets, and golden horns |
| **VANGUARD / 07** | 18-metre military real robot | Beam rifle, forearm shield, backpack thrusters, and boost movement |

![ATLAS, the weathered olive heavy mecha that started the collection, in the FORGE studio](/content/images/forge-atlas-studio.webp)

## From Generated Concepts To Blender And GLB

For the first five characters, OpenAI image generation supplied the visual references. Tripo reconstructed textured 3D surfaces from those images and performed smart retopology. Blender handled local mesh preparation, rigging, animation baking, packed sources, rendering, and GLB export. Three.js displays the results in the browser.

TITAN and VANGUARD used Gemini-generated reference images through local tooling, according to their saved provenance. They then followed a similar Tripo-to-Blender-to-Three.js path. The repository therefore records work across several tools and two coding environments rather than one uninterrupted generation process.

The intermediate material is part of the release. The repository contains concept prompts, original and retopologised models, provider receipts, Blender projects, textures, scripts, exported GLBs, and validation reports. That makes it possible to trace a character back through the stages that produced it.

Retopology made the generated surfaces easier to work with. ATLAS, for example, went from roughly 147,000 triangles in its documented source to about 26,500 in the prepared asset. The new topology still needed a suitable rig and visual inspection; automatic retopology did not turn it into a hand-authored animation mesh.

For the mechanical armour, I used rigid ownership. Each vertex belongs fully to one bone, and each triangle belongs to one mechanical section. An armour plate rotates as a solid plate rather than bending like skin. Where a large rotation exposed an empty joint, local geometry could add a housing or actuator.

The downloadable files keep their physical scale. The studio normalises the models for presentation and adds lighting, a floor, shadows, bloom, and effects around the underlying assets.

## Most Of The Work Appeared When The Models Moved

The early ATLAS binding error came from a broad spatial assumption. With the arms hanging beside the body, geometry far from the centre looked as if it probably belonged to an arm. The outside of a thigh occupied the same area, which caused unrelated panels to move together.

The repair used the actual anatomy and added an isolation check: rotating an arm must leave the thigh panels still, while rotating the thigh must move those panels. That lesson became one of the rules in the reusable workflow.

Running needed another pass. The cycles were revised around narrower foot placement, heel settling, toe-off, and counter-rotation between the pelvis and chest. Thick robotic boots make sliding and floating easy to see. ATLAS and AETHER could share the same principles while keeping different timings and weight.

SCORPIO exposed a different problem. Its tail had to articulate at visible couplings while the stinger remained attached to the chain. The repaired strike uses several joints, followed by a pullback, a fast extension, torso participation, and recovery. The validation also changed: measurements that had previously been written to a report now became assertions capable of failing the build.

RONIN required repeated work on its grip, blade alignment, shoulder armour, and the sword's route through the stance. A stronger combination eventually made the original slash look weak. The revised slash uses the stance, hips, chest, shoulder, and arm in one faster diagonal action.

![RONIN leaning through its full-body katana strike in the FORGE viewer](/content/images/forge-ronin-sword-slash.webp)

SERAPH's wing deployment began with the same issue in another form. Moving the whole wing assembly did not give the folded structure enough mechanical detail. The current animation uses ten rigid feathers on individual hinges. They begin as compact bundles behind the shoulders, open with slightly staggered timing, and fold back during the six-second loop.

The wing checks sample the motion between keyframes, inspect hinge positions and floor clearance, and look for contact between feather surfaces. SERAPH's other animations were compared with their earlier poses so the new deployment could not quietly alter the rest of the character.

![SERAPH at the beginning of WingDeploy, with the metal feathers folded behind its shoulders](/content/images/forge-seraph-wings-folded.webp)

## Adapted Motions And Viewer Effects

Some movements were authored locally. Others were adapted from the CC0 Universal Animation Libraries by Quaternius and Gonzalo Furnier. The source libraries supplied motions such as walking, punches, hit reactions, and knockback.

Those clips still needed to be fitted to different proportions, rest orientations, rigid armour, and ground contact. A thick boot, a cannon arm, or a long katana changes what an otherwise sound human motion looks like on a robot. The repository preserves the source licences, selected motion data, hashes, and rebuild instructions.

The exported GLBs contain ordinary baked skeletal animation, allowing the movement to travel with the model. The live viewer adds effects such as muzzle flashes, projectiles, beams, and thruster flames. Those effects are separate Three.js code. A downloaded GLB contains the model and its animation clips, but it does not recreate every effect from the website in another engine.

## A Browser Studio For Inspection

FORGE is a static Three.js and Vite site hosted on GitHub Pages. The viewer provides orbit and zoom controls, animation selection, pause and replay, camera reset, turntable movement, wireframe and skeleton views, reactor intensity, concept-image comparison, and direct model downloads.

Framing also became part of the asset work. A camera that fits a resting pose can lose a launched fist, a backflip, or the end of a long tail. The project records motion bounds so that the relevant action remains visible. The layout and framing were also checked at a 390-pixel mobile viewport, although that was desktop Chromium emulation rather than testing on a physical phone.

![SERAPH with the skeleton overlay enabled, showing the articulated structure inside the model](/content/images/forge-seraph-skeleton.webp)

The GLBs were checked with the Khronos glTF validator. Blender validation covers rigid binding, UV coordinates, finite geometry, joint continuity, loop closure, and floor contact. Browser review remains necessary because a structurally valid export can still move badly or frame an action poorly.

These are useful real-time presentation and prototyping assets with known limits. The generated topology has rigid cuts and open boundaries, lacks a hand-authored subdivision cage, and is not watertight or ready for 3D printing. A shipping game would still need collision proxies, distance-based levels of detail, texture compression, and tests on its target devices. Close film shots would need more modelling and texture work.

## Webcam Control With An Upper-Body Fallback

The viewer can use MediaPipe Pose Landmarker Lite to map a player's body onto the selected mecha. Camera frames are processed locally in a background worker. The pose mapper smooths rotations, preserves child-joint offsets, and uses the skinned geometry to keep the lowest boot grounded.

Camera access begins only after the player selects **Webcam control**. The application does not request the microphone, record the frames, or upload them for inference. Stopping control, switching characters or animations, or leaving the page releases the camera resources.

The first version required visible hips before accepting a pose. That worked poorly for somebody sitting at a desk in front of a laptop camera. The revised mode can use visible shoulders and arms while the legs settle into a stable standing pose. Full-body tracking resumes when the lower body returns to frame.

It remains approximate single-camera control. Occlusion and uncertain depth limit what it can reproduce, and it is not a professional motion-capture system. The numeric webcam regression reports cover the first five rigs; TITAN and VANGUARD have Blender and browser validation but were not included in a new physical-webcam certification pass for this article.

## Turning The Repairs Into A Reusable Workflow

The project produced a [public character-creation prompt](https://github.com/RamonLinares/atlas-09/blob/main/CHARACTER-CREATION-PROMPT.md) and a local Codex skill named `rigged-3d-character`. The prompt requests the complete delivery, from an original concept and controlled generation budget through Blender sources, animations, the viewer, provenance, and validation.

The skill is a reusable set of instructions for the coding agent. It is not a trained model or a one-click rigging tool. Its rules come directly from problems found in FORGE: inspect the character from several directions before placing joints, assign armour by actual anatomy, test every limb independently, give attacks anticipation and recovery, check movement between keyframes, and inspect the exported animation in a browser.

TITAN and VANGUARD showed that the project structure could be extended from another coding environment. Fable 5.1 in Claude Code used the established character brief while giving the two additions distinct directions. TITAN has a classic super-robot form and an intentionally detachable rocket fist. VANGUARD uses a rifle, shield, backpack thrusters, and a more military silhouette.

![TITAN firing its detached rocket fist with a thruster effect in the shared viewer](/content/images/forge-titan-rocket-punch.webp)

![VANGUARD bringing its forearm shield across its upper body while carrying a beam rifle](/content/images/forge-vanguard-shield-guard.webp)

This was not a controlled comparison between Codex and Fable. The later characters inherited a working viewer, conventions, scripts, and a clearer delivery standard. Their value here is evidence that the workflow could support two more designs without starting over.

## Cost, Licensing, And What Is Free

The recorded Tripo use was 60 credits for each character: 30 for image-to-model generation and 30 for smart retopology. At the historical rate recorded by the project, that was **US$0.60 per character**, or **US$4.20 for seven**.

That figure is the Tripo generation and retopology subtotal. It excludes coding tools, image generation, local compute, and the time spent directing, inspecting, and repairing the work. It also describes the recorded rate at the time, rather than current Tripo pricing.

All seven mecha asset collections are released under **CC0 1.0**. Their models, Blender sources, textures, rigs, and baked animations can be used, modified, redistributed, and sold for commercial or noncommercial projects without required attribution. The viewer code uses the MIT licence. MediaPipe, the tracking model, source animation libraries, and other dependencies retain their own terms and notices.

The public repository makes the visible models available together with the history behind them. The failed thigh assignment became an anatomical isolation test. Weak attacks became rules about timing and whole-body movement. A laptop camera crop produced the upper-body tracking mode. The final asset collection is useful, but those recorded corrections are the part I expect to reuse most often.

[Open FORGE and inspect the animations](https://ramonlinares.github.io/atlas-09/)  
[Download the models and Blender sources from GitHub](https://github.com/RamonLinares/atlas-09)

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "@id": "https://smallweblab.com/posts/forge-free-rigged-mecha-models/#repository",
  "name": "FORGE",
  "alternateName": "atlas-09",
  "description": "A public repository of seven free CC0 rigged mecha models with editable Blender sources, animated GLB exports, 61 animation clips, and a Three.js inspection studio.",
  "url": "https://ramonlinares.github.io/atlas-09/",
  "codeRepository": "https://github.com/RamonLinares/atlas-09",
  "mainEntityOfPage": "https://smallweblab.com/posts/forge-free-rigged-mecha-models/",
  "image": "https://smallweblab.com/content/images/forge-seraph-wings-open.webp",
  "programmingLanguage": ["JavaScript", "Python"],
  "runtimePlatform": "Web browser and Blender",
  "license": [
    "https://creativecommons.org/publicdomain/zero/1.0/",
    "https://github.com/RamonLinares/atlas-09/blob/main/LICENSE"
  ],
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
