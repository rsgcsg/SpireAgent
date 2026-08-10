# Human Environment Contract Roadmap

## C-0: Execution Core

Status: architecture and Preview.4 Live behavior proven; Preview.5 exact-runtime
evidence pending.

Retain snapshot binding, current interaction, one controller, execute-time
validation, idempotency, delivery receipts, unknown-no-retry and successor.

## C-1: Contract Convergence

Status: Preview.5 source/test complete.

Preview.5 separates canonical HE truth, current interaction capabilities, the
Host-local binding authority and a finite bound-action consumer projection.
Projection truncation is explicit and fail closed; common `entity_id` facts no
longer depend on candidate materialization. Per-machine deployment, cold-load
and exact-runtime regression are next.

## C-2: Human Information Parity

Status: partial.

Complete hover/focus/tooltip/scroll and native-page open/read/return. Keep hot
observations compact, make all normal player-visible information reachable,
and keep reads non-authorizing.

## C-3: Host Neutrality

Status: design only.

Implement a second fair-player Host before freezing 1.0. Compare snapshots,
referents, interaction capabilities, bound actions, reads, stale behavior and
hidden-information policy.
Keep reset/seed/clone/fork/fast-step outside C.

## C-4: Internal Ownership

Status: five V3 adapter-library seams remain.

Move real native UI implementation into neutral ownership when touched. Do not
add shims, dual executors or a second authority merely to improve directory
names.

## A Mainline

After Preview.5 bound-action and read regressions, shift primary effort to
A strategy, planning and selector recovery. The latest Live failures were A/Re
cycle-supervision failures, not C delivery uncertainty.

Training, Search, Headless lifecycle, learning and arbitrary Mod support are
separate programs that may consume C without changing its authority.
