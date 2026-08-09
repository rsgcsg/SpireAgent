# Human Environment Contract Roadmap

## C-0: Fair-Player Execution Core

Status: source/test complete, `preview.3` exact-runtime pending.

Snapshot/owner/element binding, one controller, execute-time revalidation,
native delivery, idempotency, stale refusal, unknown-no-retry and successor.

## C-1: Contract And Ownership Convergence

Status: public contract complete; Live host ownership migration ongoing.

`preview.3` removes Bridge/V3 public DTOs, unifies entity/control targets as
elements, unifies read opportunities and separates session identity from the
hot path. Remaining work is five V3 adapter-library seams and generated typed
Surface SDKs, not a new authority model.

## C-2: Human Information Parity

Status: partial.

Complete truthful hover/focus/tooltip/scroll and native-page open/read/return.
Keep semantic accessibility default and all read operations non-authorizing.

## C-3: Host Conformance

Status: design boundary only; not implemented.

After a real Headless host exists, verify equivalent fair-player snapshots,
affordances, stale behavior and hidden-information policy against Live. Host
reset/seed/fork remain outside C.

## A Mainline

Status: ready after one `preview.3` exact-runtime regression.

Improve decision-lossless projection, transition context, planning, recovery
and long-run quality. Do not move native legality or completion into A.

## Separate Programs

Training/RL adapters, MCTS/search adapters, replay datasets, vector hosts,
learning, arbitrary Mod compatibility, Companion and Workshop are not C freeze
work. They may consume C without changing its fact or action authority.
