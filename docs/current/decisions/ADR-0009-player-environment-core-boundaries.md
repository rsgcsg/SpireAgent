# ADR-0009: Player Environment Core Boundaries

Status: accepted for the clean-baseline candidate

Date: 2026-08-12

## Decision

The production connector is organized by current ownership:

```text
LiveHost -> NativeUi -> PlayerEnvironment -> Transport -> Consumer
                    \-> Identity + Control
```

Bridge v2 and Connector V3 names, endpoints and runtime ownership are retired.
No compatibility shim or dual authority remains in the game-side production
path.

## Rationale

The former Provider/V3/Bridge layering made current behavior require historical
knowledge and scattered action ownership across observation, binding,
qualification and transport types. The new boundary names what each layer owns
while retaining the proven safety shell.

## Consequences

- `LiveHost` readers publish visible facts, never executable actions.
- `PlayerEnvironment/Observation` explicitly projects public Surface fields;
  Host-private binding IDs and action-derived referents are forbidden.
- `NativeUi` owns exact Host-local bindings and execute-time revalidation.
- `Identity` records the exact runtime, artifact, game and Modset; identity does
  not grant per-operation permission.
- `Control` owns the one-writer lease and request attribution.
- `PlayerEnvironment` owns canonical Observe/Read/Interact semantics, stale
  rejection, idempotency and delivery receipts.
- consumer projections may differ but cannot create legality.
- old public routes are retired with `410`, not silently mapped.
- old wire/source evidence remains historical and cannot qualify new artifacts.

## Preserved Invariants

One input owner, player-visible boundary, exact snapshot/entity/control binding,
game-owned input callbacks, execute-time revalidation, idempotency, unknown-no-retry,
state-bound read isolation, receipt attribution and successor evidence remain
mandatory.

## Rollback

Deployment tooling retains the previous installed artifact. Rollback changes the
whole loaded DLL after a clean game shutdown; it never enables mixed old/new
authority inside one process.
