# Current Status - Human Environment Contract

Baseline date: 2026-08-10

Branch: `human_equivalent_connector`

Current source protocol is `1.0-preview.3`.

## Verdict

Human-Equivalent C remains the only default product path. This revision makes
the public contract host-neutral enough for a Live UI host and a future
Headless host to implement the same fair-player boundary. It is not an LLM,
Gymnasium, reward, simulator or privileged research API.

The architecture verdict is **conditional freeze**. Snapshot binding,
single-writer control, current affordance authority, execute-time validation,
idempotent requests, delivery receipts and unknown-no-retry are retained.
The public ontology and ownership were not frozen at `preview.2` because they
still exposed Bridge/V3 names, split one target across entity/control arrays,
and repeated full deployment evidence on every observation.

## Current Source And Test Truth

`preview.3` provides:

- `snapshot_id`, one current owner and host-neutral session reference;
- schema-versioned persistent player-visible state and Surface content;
- one `elements[]` ontology for visible entities and actionable controls;
- affordances that target exact current element IDs;
- one state-bound `reads[]` catalog for Inspection and linked detail;
- typed completeness with explicit missing and hidden-by-policy facts;
- capabilities-owned host, game and Modset identity, exact environment
  fingerprint and optional implementation artifact provenance;
- generic opaque action request and `applied/not_applied/unknown` receipt;
- strict Re decoding, element/read normalization and exact opaque choice use.

The public C DTO file imports no BridgeV2 or ConnectorV3 type. Exact native
operands remain private to the Live host. D annotations, source contracts,
business Outcome, rewards, reset/seed/fork and hidden state are absent.

Automated evidence includes all Gateway tests, all Re tests and strict
schema/boundary checks. One local machine has also completed exact
build/install/load identity and a strictly decoded read-only observation; this
does not transfer to another machine or prove input delivery.

## Current Preview.3 Runtime Evidence

The committed `preview.3` code at `a0f218f990f049bc2f402647b9558d282289a94f`
was built, installed and Steam-cold-loaded with SHA
`7616c381f960d41ba2e9aa746d267b3136316fbf744433b9c51841f7ccab0cae`, MVID
`a086de75-2527-4b73-8f0c-3d9c45a1e012` and runtime
`3e717619bd5e42d5aa8caac785241069` on game `v0.110.1/db5d3552`.

The strict Re decoder accepted the exact `main_menu` snapshot and verified the
capability/snapshot environment fingerprint. This is loaded and read-only Live
evidence only: no `preview.3` action, successor, assisted journey, pure journey,
Organic evidence or qualification has been exercised.

## Latest Live Evidence

`run-20260809134724-5yfbuf` used final `preview.2` artifact SHA
`bd11374d...`, MVID `93e979d1...`, runtime `2d684668...`, and completed the
bounded ordinary journey after 286 decisions: 208 settled deliveries, 21
checkpoint-pending deliveries, 6 safe stale refusals and 51 non-actionable
transition polls. It ended at the completed-run top-menu boundary with no
unknown delivery. This is exact Live coverage-only evidence for `preview.2`,
not Organic evidence, durable qualification or evidence for `preview.3`.

Earlier `preview.2` runs include an assisted 261-decision complete journey and
an `he_pure` 231-decision complete journey. They prove that A+C-only operation
was possible on those exact artifacts; they do not transfer across this wire
revision.

## Remaining Limits

- the Live host internally retains five checked calls into V3-owned bounded
  adapter implementations; they do not define C wire or authority but remain
  ownership/readability debt;
- extensible content is explicitly schema-versioned but still represented by
  JSON objects rather than generated tagged-union SDKs;
- native element discovery is complete for current action targets, while some
  non-actionable player-visible entities remain Surface content rather than
  first-class elements;
- hover, focus, tooltip, scroll and native-page read/return are incomplete;
- no Headless host, Gym/Training adapter, vector environment, clone/fork API or
  Live-vs-Headless conformance implementation exists;
- `preview.3` has no mutation delivery or long-journey evidence yet.

## Per-machine Deployment Truth

Do not infer load or Live behavior from source/tests/build. Do not infer
Headless equivalence, ML suitability, arbitrary-version/Mod compatibility,
Organic evidence or qualification from a complete Live journey. Use
`npm run doctor`, `npm run deploy` and `npm run verify:loaded` for per-machine
deployment truth.
