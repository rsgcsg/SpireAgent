# Current Program Plan — Human-Equivalent Connector

## Product Outcome

One Re-SpireAgent should operate the real STS2 UI with human-equivalent information and actions, continuously observe successors, and remain constrained by input integrity and explicit main-menu governance rather than per-source business authority.

## Current Boundary

This branch forks from `connectorV3@5e57e47028b780619a9cd37b0cd13aeaebddaa2a`. Existing V3 is the executable baseline; Human-Equivalent behavior is not yet implemented.

## Delivery Order

1. Close branch documentation under ADR-0008.
2. Add non-authorizing rendered-frame and structured-UI shadow observation.
3. Add hover/focus/tooltip/scroll/native-page reveal and navigation.
4. Add generic state/frame-bound current-affordance execution with delivery-only receipts.
5. Update Re for successor-driven reasoning and transition history.
6. Add main-menu governance for persistent/destructive operations and application exit.
7. Exercise Royal Stamp/source-unresolved, multi-stage selector, custom UI and abandon-run holdouts.
8. Compare against inherited source-contract V3 before cutover.

## Required Invariants

- exact current state/frame/owner/target binding;
- one current controller;
- execute-time actionability validation;
- idempotent delivery and no blind replay of unknown delivery;
- complete human-reachable observation with provenance;
- no hidden RNG/future/private information;
- no arbitrary method, node or reflection mutation;
- persistent management and quit-application policy separated from in-run strategy;
- no silent V3 fallback after cutover;
- honest source/test/build/install/load/Live evidence boundaries.

## Run Policy

The Connector does not protect run quality. Current human-operable bad choices, irreversible choices, losing, abandoning a run and returning to the main menu are allowed.

## Current Verdict

`ARCHITECTURE ACCEPTED / IMPLEMENTATION NOT STARTED`.

The inherited V3 branch remains a conditional freeze candidate and comparison path. It does not grant this branch implementation or runtime claims.

## Deferred

Learning, training, display-headless reimplementation, Companion packaging and broad product distribution remain separate. They must not be used to hide incomplete Human-Equivalent Connector evidence.