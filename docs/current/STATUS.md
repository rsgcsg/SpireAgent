# Current Status - Human Environment Contract

Baseline date: 2026-08-11

Branch: `human_equivalent_connector`

Current source protocol is `1.0-preview.5`.

## Verdict

Human-Equivalent C remains the only default product path. The macro
architecture is retained, while Preview.5 corrects a structural coupling in
Preview.4: canonical visible truth and current interaction grammar no longer
derive their meaning from Re's finite action menu.

The freeze verdict remains **conditional freeze**. Core delivery invariants are
stable; the wire remains preview until Preview.5 is cold-loaded and exercised,
information parity improves, and a second Host or deterministic conformance
host tests the host-neutral meanings.

## Current Source And Automated Truth

Preview.5 implements:

- capabilities-owned Host/game/Modset/runtime identity;
- an independently meaningful snapshot, persistent visible summary, current
  interaction content, referents and reads;
- strategy-free `interaction.capabilities`;
- referent visible state with optional observed enabled/selected/focused state,
  never global actionability inferred from action tuples;
- a deterministic `bound_actions` projection with complete/truncated status,
  exact counts, limit and ordering;
- mutation authority only from a complete projection and one Host-local native
  binding/executor path;
- snapshot identity that includes canonical current binding authority but not
  consumer labels or finite projection order;
- stale rejection, execute-time revalidation, one controller, idempotent
  requests, applied/not-applied/unknown and unknown-no-retry;
- strict Re decoding and finite opaque choices using `bound_action_id`.

Gateway `303/303` tests and Re `296/296` tests, typecheck, build, Python syntax
and HE boundary checks cover these source claims. They are not loaded or Live
evidence.

## Latest Exact Live Evidence

The latest loaded artifact is Preview.4 SHA
`a74a6452f4e514e7bd74de6ba9206e24544df50ec9e46d95c9d4c5598b3f8a34`,
MVID `f7962056-bede-4793-b925-312f62e787e3`, runtime
`458866c580fd447d9e70e980608783b7`, game `v0.110.1/db5d3552`, Modset
`additional_loaded_mods` with fingerprint
`c8cd0ce0d4b5b71d8aecaacc06bfff85bbe0007b363e028f5446b062dfc181c3`.

- `run-20260810090056-n0qf8t`: one character-select decision attempt; provider
  `fetch failed`, no mutation. This is A/provider failure evidence.
- `run-20260810090428-4i8i9a`: 152 decisions, 115 settled, 11 delivery
  checkpoints, 25 transition polls, one safe stale refusal, completed boundary.
  It includes exact card-subject/enemy-target delivery and successor evidence.
- `run-20260810105732-l1zl09`: 213 decisions, 138 settled, 19 delivery
  checkpoints, 53 transition polls, three safe stale refusals, no unknown,
  completed boundary after game over and return to menu.

These runs prove broad Preview.4 HE observation, bound predecessor affordance
delivery, receipts, successors and bounded journeys on that exact artifact.
They do not prove Preview.5, another Host, conformance or qualification.

## Remaining Limits

- On this machine Preview.5 Release build/install is verified by local
  deployment records; cold-load identity and Live mutation remain pending. No
  Preview.4 evidence transfers.
- hover/focus/tooltip/scroll and native-page open/read/return parity is partial.
- the Live Host still reuses five checked V3-owned adapter-library seams; they
  are implementation debt, not public wire or a second authority.
- interaction content remains revisioned JSON rather than generated tagged SDK
  types.
- no Headless Host, cross-Host conformance suite, Training/Search adapter,
  clone/fork port or durable qualification exists.

Source, test, build, installed, loaded, Live mutation, journey, conformance and
qualification remain separate evidence levels.

## Per-machine Deployment Truth

Every checkout must independently run `npm run doctor`, deploy while the game
is closed, cold-start STS2 and run `npm run verify:loaded`. Repository source,
tests or Release output never prove another machine's installed or loaded
artifact. The Preview.4 tuple above is evidence only for its recorded runtime.
Final source/build/install identity is recorded by the deployment tool rather
than treated as portable repository truth.
