# Verified claims register

Every statement the film makes, in narration or on screen, must appear in the **Used** table with its evidence. Anything else stays out.

Evidence levels:
- **E1 Independent**: verifiable from a public artifact (repository, commit history, running software) without relying on CloudFire's word.
- **E2 Owner-attested**: recorded in the website's approved content with an owner confirmation date. This is CloudFire's own statement, not independent proof.
- **E3 Unverified**: not used.

## Used in the film

| Claim (as worded in film) | Where | Evidence | Level |
| --- | --- | --- | --- |
| CloudFire builds products, AI automation, cloud platforms and experience design | throughout | `lib/content.ts` capabilities; site copy | E2 (self-description of services, which is acceptable for a brand film) |
| "When a storage node goes dark in AegisStore, the files keep coming back, verified." | narration L7 + footage | AegisStore README: "Downloading still works, because the API falls back to the other replica"; "SHA-256 verified on upload (all replicas must match) and on download". **Demonstrated on camera**: the local AegisStore build had storage-node-2 crashed through its Simulation Lab, and the objects were downloaded with a checksum match (see `qa/aegisstore-failover-evidence.json`). | E1 |
| AegisStore is CloudFire work | on-screen label | Repository `github.com/Donniedarko45/AegisStore` belongs to the same GitHub account as the CloudFire website repository. Commits are authored by Kartikey Pandey, the same author as the website repository. Website record: "Public repository listed by the CloudFire team as its own work". | E1 (same owner and author) + E2 |
| AegisStore is a distributed object store | on-screen label | README, running software | E1 |
| MODULX product and quote site, industrial manufacturing | on-screen label, footage | `lib/content.ts` record approved 2026-10-05; "User confirmed from-scratch delivery, 2026-10-06"; `public/work/modulx.jpg` page capture from the website repository | E2 |
| "Automation carries the busywork, and a person still approves what matters." | narration L4 | Describes CloudFire's stated approach ("Human-reviewed AI assistants", "clear checks before AI takes action"). It is a description of method, not a client result. | E2 |
| "Releases go out on an ordinary afternoon…" | narration L5 | Describes the Cloud & Platform offer ("repeatable releases"). This is a general aspiration, with no client or metric implied. | E2 |
| Tagline "Products that ship. Systems that last." and domain | end card | Website hero and metadata | brand asset |

## Deliberately excluded

| Item | Reason |
| --- | --- |
| Headspace, Sephora | Recognizable global brands. Records describe website delivery only, attested by the owner, with no independent evidence available. Showing them would risk implying sponsorship or endorsement. |
| Death Wish Coffee, 101 Blockchains | Recognizable brands with owner attestation only. Their live sites are unreachable from this environment for fresh capture. Excluded to avoid implied endorsement. Their screenshots also appear in the website's hero deck, so the film crops that deck to avoid showing them. |
| Kleenly, Remedy Films, Ashwini Trading Academy, Kudose, Seawag, Momo & Co | Owner-attested only, with no imagery approved at film quality. Not needed. |
| "20+ products live" / "India · UK · US" | Counts and geography are owner statements. The brief forbids metric emphasis, and they are not independently verifiable. |
| Figures visible inside the MODULX page capture ("32.5%", "5,000+", "ISO 22241", "Since 2020") | These are MODULX's own product facts on MODULX's site, not CloudFire claims. The capture is framed so these figures are not legible or emphasized. They are not narrated. |
| Lighthouse scores in `docs/verification.md` | Performance metrics are not used ("no obsession with numbers"), and the doc says they are not a measurement of the restored hero. |
| Any client testimonial, award, partnership or certification | None exist in approved records (`clientStories = []`, `trustItems = []`). |
| AI acting autonomously | Never shown. Every AI step ends in a visible human approval. |

## Open items for the owner

1. MODULX: written permission from the client to feature the site in a promotional film. Website listing permission may not extend to advertising use.
2. MODULX: a fresh high-resolution capture of `modulx.in`. The domain is blocked from this environment, and the available capture is 1440 px wide.
3. Confirm that AegisStore may be presented as CloudFire work in paid media (it is a public open-source project in the founder's account).
