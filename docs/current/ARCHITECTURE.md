# Current Architecture: Player Environment C

Authority: [ADR-0009](decisions/ADR-0009-player-environment-core-boundaries.md)

## One Production Path

```text
STS2 rules, RNG, objects and UI lifecycle
  -> LiveHost: current fair-player facts and current owner
  -> NativeUi: private exact binding and native input callback
  -> PlayerEnvironment: Snapshot / Read / BoundAction / Receipt / successor
  -> REST or optional MCP transport
  -> consumer projection such as Re
```

Identity and single-writer control are a hard shell around delivery, not a
second source of game legality. Current UI actionability publishes actions;
execute-time native revalidation decides whether that exact input can still be
delivered.

## Public Contract

- **Snapshot:** stable current player-visible state, current Interaction,
  Referents, complete finite BoundActions, Reads, completeness and exact session
  identity.
- **Read:** one advertised, state-bound, read-only player information path.
- **BoundAction:** an opaque finite projection of one private native binding.
  It does not expose native operands or create legality.
- **Action request:** request ID, expected snapshot, bound action and controller
  lease.
- **Receipt:** `delivered | not_delivered | unknown`, retry policy and an
  immediate successor when readable. Delivery is not business completion.

The public wire is understandable without Bridge/V2/V3 history. Interaction
content is tagged by `surface.kind` and `context.kind`; exact Godot/STS2 objects
never leave the Host.

Visible interaction content is projected before action materialization. Only
those facts create Referents. A Host-local candidate cannot synthesize a public
Referent; if any public operand is missing from current facts, the finite
projection is `truncated`, the Snapshot remains readable, and execution
authority is empty.

## Ownership

- **Game/Host:** rules, RNG, effects, native legality and object lifetime.
- **LiveHost:** visible fact extraction and current owner/readiness.
- **NativeUi:** entity registry, exact private binding, execution revalidation,
  native adapters and main-thread input.
- **PlayerEnvironment:** public truth, reads, projection, stale/idempotent
  submission, receipts and successor.
- **Identity/Control:** exact provenance, one writer and attribution only.
- **Transport:** serialization and delivery only.
- **Consumer/A:** model projection, read policy, strategy, progress
  interpretation and recovery; never game legality.
- **D/P:** optional non-authorizing evaluation and deployment/rollback; neither
  changes C truth or actions.

## Consumer Boundary

Re uses compact Snapshot plus optional Reads and finite BoundActions. A future
RL adapter may eagerly aggregate advertised Reads into one snapshot-coherent
feature tensor and action mask. Search/Replay may build different deterministic
views. Every view resolves to the same Host-local binding and Receipt path;
none redefines C ontology or authority.

## Information Boundary

Stable current facts belong in Snapshot. Stable player-reachable detail may be
advertised as a state-bound Read. Missing player-visible information is marked
partial/unsupported; it is not moved to A or D. Hidden RNG, true draw order,
future events/rewards and inaccessible native state are omitted by policy.

See [Player Environment Information Closure](PLAYER_ENVIRONMENT_INFORMATION_CLOSURE.md).

## Non-Goals

C is not an LLM API, reward API, strategy engine, business transaction model,
coordinate/reflection service, privileged simulator or second game engine.
Headless lifecycle, Training, Search, learning and transient PlayerCue are
separate work after the C1 stable/inspectable contract is sealed.
