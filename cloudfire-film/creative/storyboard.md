# Storyboard: "Beneath the Surface"

Stills are rendered by the production compositor itself (`renders/frames/master`), so the storyboard is the film's actual look. Three frames per shot: first, key, last. The v1 (animatic) boards are in `assets/keyframes/v1/`, and the critique that changed them is in `qa/animatic/critic-report.md`.

![contact sheet](../assets/keyframes/v2/storyboard-contact.png)

## S01 · The Press  (0.00–2.00 s, frames 0–48)

![S01 first](../assets/keyframes/v2/S01_first_f00000.jpg) ![S01 key](../assets/keyframes/v2/S01_key_f00023.jpg) ![S01 last](../assets/keyframes/v2/S01_last_f00047.jpg)

- **Purpose:** Hook: an expensive-looking macro of one real-feeling interaction; establishes the dot.
- **Picture:** Black, then an extreme close-up of an order card at a grazing angle. A button labelled 'Place order' depresses (scale .97), resolves to a spinner, then 'Order placed' with a vermilion status dot that ignites.
- **Camera:** Macro, 20 deg FOV, tilted plane for natural focus falloff, slow 4% push-in, 1 deg drift.
- **Technique:** three.js + CSS3D (DOM typography), per-element depth blur
- **Sound:** click@8, sub_pulse@12, dot_ignite@33

## S02 · Layers Part  (2.00–3.75 s, frames 48–90)

![S02 first](../assets/keyframes/v2/S02_first_f00048.jpg) ![S02 key](../assets/keyframes/v2/S02_key_f00068.jpg) ![S02 last](../assets/keyframes/v2/S02_last_f00089.jpg)

- **Purpose:** The interface separates into its working layers: layout, request, services, data, infrastructure.
- **Picture:** Camera pulls back to a 3/4 axonometric view. Beneath the card, layers drop away in sequence. A packet leaves the dot and falls along a wire labelled POST /orders.
- **Camera:** Pull back and orbit 35 deg, ease-in-out.
- **Technique:** three.js + CSS3D
- **Sound:** layer_settle@54, layer_settle@60, layer_settle@66, layer_settle@72

## S03 · The Dive  (3.75–5.00 s, frames 90–120)

![S03 first](../assets/keyframes/v2/S03_first_f00090.jpg) ![S03 key](../assets/keyframes/v2/S03_key_f00104.jpg) ![S03 last](../assets/keyframes/v2/S03_last_f00119.jpg)

- **Purpose:** Discovery: we fall through the layers after the request into a different world.
- **Picture:** Camera dives with the packet through each plane, accelerating, and emerges beneath the floor grid.
- **Camera:** Vertical dive, packet locked to frame centre, arrival ease-out at 120.
- **Technique:** three.js
- **Sound:** dive_air@90, arrival_bloom@118

## S04 · Beneath  (5.00–11.25 s, frames 120–270)

![S04 first](../assets/keyframes/v2/S04_first_f00120.jpg) ![S04 key](../assets/keyframes/v2/S04_key_f00194.jpg) ![S04 last](../assets/keyframes/v2/S04_last_f00269.jpg)

- **Purpose:** The central image: a ceiling of light (the surface everyone sees) above, a vast quiet structure below.
- **Picture:** Threads of requests descend from the luminous underside of the interface into a sparse field of service nodes. Our vermilion packet travels its route.
- **Camera:** Slow lateral crane, 28 deg FOV, horizon at 45%.
- **Technique:** three.js · generative: optional atmosphere plate (Veo/Seedance) — not used in this cut
- **Narration:** “Just after someone presses a button, a product keeps its promise, or quietly breaks it.”
- **Sound:** thread_ticks, connect@200

## S05 · Shaped and Checked  (11.25–14.38 s, frames 270–345)

![S05 first](../assets/keyframes/v2/S05_first_f00270.jpg) ![S05 key](../assets/keyframes/v2/S05_key_f00307.jpg) ![S05 last](../assets/keyframes/v2/S05_last_f00344.jpg)

- **Purpose:** Information travels a clean pipeline and is checked along the way.
- **Picture:** Side-on tracking past a channel of gates. Each packet enters as a loose cluster and leaves as an aligned record; gates mark VALIDATE, ENRICH, STORE.
- **Camera:** Long-lens track left to right, foreground gates defocused.
- **Technique:** three.js
- **Narration:** “What decides it is rarely on the screen.”
- **Sound:** gate_tick@288, gate_tick@306, gate_tick@324

## S06 · The Worst Day  (14.38–17.50 s, frames 345–420)

![S06 first](../assets/keyframes/v2/S06_first_f00345.jpg) ![S06 key](../assets/keyframes/v2/S06_key_f00382.jpg) ![S06 last](../assets/keyframes/v2/S06_last_f00419.jpg)

- **Purpose:** Set up the payoff: a node fails and the route finds another way; complexity resolves to one line.
- **Picture:** Top-down mesh with a lit route. One node dims to a dashed outline; the route redraws around it. The mesh fades and the single route straightens into one line that rises.
- **Camera:** Top-down, slow rise, roll 90 deg so the line becomes horizontal.
- **Technique:** three.js
- **Sound:** node_down@362, reroute@372, resolve_swell@400

## S07 · Both Sides — Product Engineering  (17.50–21.88 s, frames 420–525)

![S07 first](../assets/keyframes/v2/S07_first_f00420.jpg) ![S07 key](../assets/keyframes/v2/S07_key_f00472.jpg) ![S07 last](../assets/keyframes/v2/S07_last_f00524.jpg)

- **Purpose:** A real web product responding to interaction, shown with the structure beneath it.
- **Picture:** Horizon at 58%. Above, the real AegisStore dashboard in a browser frame: an object is uploaded and the dialog reports which nodes hold the copies. Below the line, the same moment as structure: the upload descends to two storage nodes.
- **Camera:** Slow push-in, 2% lateral.
- **Technique:** authentic UI capture (local AegisStore build, 4K) composited in three.js
- **Narration:** “We build both sides of that moment.”
- **Sound:** ui_click@440, replicate@470

## S08 · A Person Approves — AI & Automation  (21.88–27.50 s, frames 525–660)

![S08 first](../assets/keyframes/v2/S08_first_f00525.jpg) ![S08 key](../assets/keyframes/v2/S08_key_f00592.jpg) ![S08 last](../assets/keyframes/v2/S08_last_f00659.jpg)

- **Purpose:** AI with controls: request, context retrieval, document processing, human review, useful result.
- **Picture:** An incoming request card; three context cards are retrieved along converging lines; a draft forms; a reviewer presses Approve; it is sent.
- **Camera:** Lateral glide following the flow, left to right.
- **Technique:** three.js + CSS3D
- **Narration:** “Automation carries the busywork, and a person still approves what matters.”
- **Sound:** retrieve@560, retrieve@570, retrieve@580, approve_click@622

## S09 · An Ordinary Afternoon — Cloud & Platform  (27.50–33.12 s, frames 660–795)

![S09 first](../assets/keyframes/v2/S09_first_f00660.jpg) ![S09 key](../assets/keyframes/v2/S09_key_f00727.jpg) ![S09 last](../assets/keyframes/v2/S09_last_f00794.jpg)

- **Purpose:** Deployment pipeline, containers and observability as a calm routine.
- **Picture:** The approval ring becomes a delivery loop (commit, build, test, deploy, observe). A rolling update turns containers over one by one; a calm latency trace runs beneath; the log reads 'Deployed · Tue 15:42'.
- **Camera:** Push into the ring, then drift across the container grid.
- **Technique:** three.js + CSS3D
- **Narration:** “Releases go out on an ordinary afternoon, and nobody holds their breath.”
- **Sound:** stage_tick x5, container_flip x8

## S10 · Obvious — Experience & Growth  (33.12–37.50 s, frames 795–900)

![S10 first](../assets/keyframes/v2/S10_first_f00795.jpg) ![S10 key](../assets/keyframes/v2/S10_key_f00847.jpg) ![S10 last](../assets/keyframes/v2/S10_last_f00899.jpg)

- **Purpose:** A difficult journey becomes one clear interaction.
- **Picture:** The trace twists into a tangled journey of eight screens with back-tracking arrows; it untangles to three steps, then to a single screen with one clear action.
- **Camera:** Static wide, then gentle push to the final screen.
- **Technique:** three.js + CSS3D
- **Sound:** untangle_swell@820, settle@872

## S11 · AegisStore Keeps Serving  (37.50–45.00 s, frames 900–1080)

![S11 first](../assets/keyframes/v2/S11_first_f00900.jpg) ![S11 key](../assets/keyframes/v2/S11_key_f00989.jpg) ![S11 last](../assets/keyframes/v2/S11_last_f01079.jpg)

- **Purpose:** Proof: real software survives a deliberate failure on camera.
- **Picture:** Real AegisStore UI. (a) Overview, 3 of 3 nodes healthy. (b) Simulation Lab: 'Crash node' switched on for storage-node-2. (c) Node offline; object replicas show the surviving copies with matching SHA-256 and the download completes.
- **Camera:** Browser frame floating in the world at 8 deg yaw; slow push; behind it the node ring loses one node.
- **Technique:** authentic UI capture (local build, 4K) + three.js environment
- **Narration:** “When a storage node goes dark in AegisStore, the files keep coming back, verified.”
- **Sound:** toggle_click@968, node_down@984, verified@1050

## S12 · MODULX  (45.00–50.00 s, frames 1080–1200)

![S12 first](../assets/keyframes/v2/S12_first_f01080.jpg) ![S12 key](../assets/keyframes/v2/S12_key_f01139.jpg) ![S12 last](../assets/keyframes/v2/S12_last_f01199.jpg)

- **Purpose:** Proof: a shipped product site with a clear route from product to enquiry.
- **Picture:** The MODULX page in a browser frame (modulx.in). Camera pushes from the headline toward the pack-size selector and 'Ask for a price'.
- **Camera:** Slow push-in with 4 deg yaw change.
- **Technique:** approved page capture (1440 px source; ~1.3x scale; disclosed)
- **Sound:** soft_settle@1090

## S13 · Everything Resolves  (50.00–55.00 s, frames 1200–1320)

![S13 first](../assets/keyframes/v2/S13_first_f01200.jpg) ![S13 key](../assets/keyframes/v2/S13_key_f01259.jpg) ![S13 last](../assets/keyframes/v2/S13_last_f01319.jpg)

- **Purpose:** The visual systems come together and simplify into one calm line.
- **Picture:** The product frames recede; field, rings and threads converge and collapse into a single horizontal line with soft light above it.
- **Camera:** Rising pull-back, decelerating to stillness.
- **Technique:** three.js · generative: optional atmosphere plate — not used in this cut
- **Narration:** “Good engineering rarely asks to be noticed. It simply holds.”
- **Sound:** converge_swell@1200

## S14 · The Dot Returns  (55.00–57.50 s, frames 1320–1380)

![S14 first](../assets/keyframes/v2/S14_first_f01320.jpg) ![S14 key](../assets/keyframes/v2/S14_key_f01349.jpg) ![S14 last](../assets/keyframes/v2/S14_last_f01379.jpg)

- **Purpose:** Close the loop with the opening detail.
- **Picture:** On the line, the vermilion dot from the first shot glows; 'Order placed' appears faintly beside it and fades, leaving the dot.
- **Camera:** Macro push toward the dot.
- **Technique:** three.js + CSS3D
- **Sound:** dot_ignite@1332

## S15 · Reveal  (57.50–65.00 s, frames 1380–1560)

![S15 first](../assets/keyframes/v2/S15_first_f01380.jpg) ![S15 key](../assets/keyframes/v2/S15_key_f01469.jpg) ![S15 last](../assets/keyframes/v2/S15_last_f01559.jpg)

- **Purpose:** The dot becomes the period in the genuine wordmark; lockup held long enough to read.
- **Picture:** 'cloudfire' writes on to the left of the dot; the mark draws (cloud outline, then the flame rises); descriptor IT SERVICES. Tagline: 'Products that ship.' / 'Systems that last.' Domain: cloudfireitservices.com.
- **Camera:** Locked off with a 1.5% push across the hold.
- **Technique:** SVG paths from components/cloudfire/Brand.tsx in DOM
- **Narration:** “CloudFire.”
- **Sound:** signature@1392
