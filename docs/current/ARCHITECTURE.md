# Current Architecture: Human Environment C

Authority: [ADR-0009](decisions/ADR-0009-human-environment-core-boundaries.md)

## Production Path

```text
real STS2 runtime
  -> LiveHost observation readers
  -> NativeUi candidate discovery and exact native binding
  -> Authority environment/controller/request admission
  -> HumanEnvironment Observe / Read / Interact contract
  -> REST or optional thin MCP transport
  -> consumer-owned projection such as Re
```

There is one production path. Bridge v2 and Connector V3 do not publish state,
actions or HTTP authority. Retired endpoints return `410` and cannot silently
resume execution.

## C-Core

C-Core is a behavior boundary, not one giant assembly namespace. It contains:

- a canonical fair-player snapshot: persistent facts, current interaction,
  visible referents, completeness, session identity and policy;
- state-bound, read-only information opportunities;
- a complete finite projection of current bound actions;
- one Host-local binding/execution authority;
- controller, stale-state and idempotency enforcement;
- `applied | not_applied | unknown` delivery receipts and successor snapshots.

The wire is independently meaningful without knowing Provider, Surface preview,
Bridge or Connector history. `interaction.content` is tagged by both
`surface.kind` and `context.kind`. Native objects and operands remain Host-local.

## Ownership

- **Game/Host:** rules, RNG, effects, object lifetime, native legality and Commit.
- **LiveHost:** visible facts, one current owner and readiness.
- **NativeUi:** exact candidates, controls, entities, operands and revalidation.
- **Authority:** exact environment, one controller, qualification and request
  lifecycle.
- **HumanEnvironment:** canonical public observation, reads, bound actions,
  receipts and successor projection.
- **Transport:** serialization and transport only.
- **Consumer:** strategy, model formatting, lazy/eager read policy and progress
  interpretation. It cannot create facts or legality.

## Consumer Boundary

An LLM consumer may use compact observation plus lazy reads and finite choices.
A memoryless RL consumer may eagerly aggregate advertised reads into one
snapshot-coherent bundle. Search or Replay may own different projections. All
must consume the same C truth and submit the same opaque bound-action identity.

No consumer format defines the C ontology, native operands, legality or result.
The existing Re decision bundle is a downstream convenience, not a second C.
Re's production executable action type contains only the opaque HE action.
Historical index, V2 and V3 action unions live in a fixture-only module that is
excluded from the production build. Shared orchestration utilities are generic
and do not interpret retired transport families.

## Information Boundary

Player-visible facts are either in the hot observation, reachable through an
advertised state-bound read, or explicitly classified partial/unsupported.
Inspection and native-page evidence never grant mutation authority. Hidden RNG,
draw order, future events/rewards and inaccessible native state are excluded.

See [Human Information Closure](HUMAN_INFORMATION_CLOSURE.md).

## Delivery Semantics

`applied` proves that C delivered the exact current native input through the
game-owned path. It does not claim arbitrary downstream business completion.
Re observes successor stability without reconstructing game rules. `unknown`
is terminal for automatic retry.

## Non-Goals

C is not a second game engine, business effect simulator, reward API, model API,
coordinate click service, arbitrary reflection surface or privileged Headless
lifecycle. Headless, Training, Search and A strategy changes are separate work.
