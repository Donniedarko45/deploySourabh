# Project inventory for the film

| Project | Source available | Visual material | Native resolution | Attribution | Film decision |
| --- | --- | --- | --- | --- | --- |
| **CloudFire website** | Full source (this repo), local production build | Live local build: hero WebGL, architecture diagram, capability tabs, footer wordmark | Captured at device scale 2 (3840 × 2160 from a 1920 × 1080 viewport): **native 4K** | CloudFire's own product | Brand reference. The architecture vocabulary and logo come from its code. Brief appearance in Act IV is optional. |
| **AegisStore** | Public repo `Donniedarko45/AegisStore` @ `d03248b`, cloned and run locally (API, worker, 3 storage nodes, PostgreSQL 16, Redis 7, Vite dashboard), seeded with its own `scripts/seed-demo.mjs` | Real dashboard: overview, nodes, Simulation Lab (crash a node), object replicas, analytics | Captured at device scale 2: **native 4K** | E1: same GitHub owner and commit author as the CloudFire site | **Lead proof** (Act III Product Engineering and Act IV failover) |
| **MODULX** | Website record + `public/work/modulx.jpg` (full page) and `public/work/hero/modulx.jpg` (16:10 crop) | Static page capture of modulx.in | **1440 px wide**: upscaled about 1.3× in the film. Disclosed. | E2 owner-attested | Act IV, presented as a page inside a browser frame with a slow scroll and perspective. Client permission is an open item. |
| Death Wish Coffee, 101 Blockchains, Kleenly, Remedy Films | Page captures in `public/work` | Static, 1440 px | — | E2 | Excluded (see verified-claims.md) |
| Headspace, Sephora, others | Records only | none | — | E2 | Excluded |

## Capture plan

- AegisStore, a controlled local build:
  1. Overview at 3/3 healthy.
  2. Upload dialog (Product Engineering).
  3. Simulation Lab: "Crash node" toggled on storage-node-2.
  4. Node card shows OFFLINE.
  5. Object detail Replicas tab, with the fallback download and checksum match.
  
  The demo data comes from the repo's own seed script. Sample filenames such as `q3-board-deck — FINAL (revised) v12.pdf` are the repository's demo fixtures, not client data.
- A virtual-time capture shim makes UI animation frame-exact: `requestAnimationFrame`, `performance.now`, `Date.now` and timers are driven by the frame clock, and Web Animations are seeked per frame. Server-side events (heartbeats, node state) happen in real time before or between captures, so on-screen state changes are genuine.
- CloudFire site: 1920 × 1080 viewport at device scale 2.
