# Current Status: Human Environment C

Baseline date: 2026-08-12

Branch: `human_equivalent_connector`

Current source protocol is `1.0-preview.6`.

## Verdict

The source tree is a **clean-baseline candidate**, not frozen. Human Environment
is the only production connector. Current code no longer relies on Provider
action publication, V2/V3 runtime endpoints or a V2-shaped Re sidecar.

The current breaking source migration passes automated checks, is built and is
installed on the current machine, but its final artifact has not yet been
cold-loaded or exercised. Preview.5 Live
evidence remains historical evidence for its own SHA/MVID/runtime only.

## Current Source Truth

- `LiveHost` owns visible observation and one current input owner.
- `NativeUi` owns exact candidates, entity/control/operand binding and native
  delivery.
- `Authority` owns exact-environment admission, one controller, idempotency and
  qualification records.
- `HumanEnvironment` owns the public Observe/Read/Interact contract.
- `/api/he/*` is the only active API; retired V2/V3 routes return `410`.
- REST and optional MCP contain transport logic only.
- Re directly decodes HE, imports complete bound actions and submits opaque
  `bound_action_id` values. It does not reconstruct legality or effects.

## Human Information Closure

Persistent run/player facts, complete current interaction content, visible
referents and four state-bound read families are implemented. The optional
`native_pages.v1` evidence profile supports run deck, combat draw/discard/
exhaust piles and shop catalog with open/read/return/recovery contracts. It is
off by default, runtime/snapshot bound and non-authorizing.

Full active hover, arbitrary scroll traversal and every native tooltip subtype
remain partial or unsupported. This is explicit scope, not implied completion.

## Evidence Boundary

Gateway and Re tests, Re typecheck/build, Release build, and
Python/CLI/docs/schema/boundary checks pass. The current machine has matching
built/installed bytes recorded in the dated clean-baseline closeout. The DLL
still requires cold-load identity and an `he_pure` Live run. No old MVID or
journey qualifies this artifact.

## Per-machine Deployment Truth

Each checkout must run `npm run doctor`, deploy while the game is closed,
cold-start STS2 and run `npm run verify:loaded`. Repository source, tests,
Release output and installed bytes do not prove the process loaded that DLL.
