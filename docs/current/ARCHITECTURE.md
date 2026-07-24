# Current Architecture

## Product Boundary

```text
Slay the Spire 2 process
  -> STS2MCP Semantic Gateway Mod
       -> versioned local REST Connector Contract
       -> optional MCP adapter
  -> Re-SpireAgent Connector and Agent Runtime
       -> LLM provider selected by local configuration
```

The current direct Re-to-Gateway path is a developer integration, not a
consumer security boundary. The intended future product adds an external
Companion between the Gateway and Agent/provider layers; it is not implemented
yet.

## Ownership

| Owner | Responsibilities | Must not own |
|---|---|---|
| `STS2MCP` Gateway | exact game identity, player-visible facts, active input ownership, opaque actions, execute-time validation, main-thread commit, semantic completion, command lifecycle | strategy, provider keys, long-term memory, arbitrary client game calls |
| REST contract | transport of Gateway-owned observation, capabilities, action submission, and outcome state | independent legality or completion rules |
| Optional MCP adapter | ergonomic read/action adaptation over the Gateway contract | a second game-rule engine or a bypass around Gateway permission |
| `Re-SpireAgent` | strict decoding, normalized current state, prompt construction, model invocation, allowed-action selection, run recording, local settlement observation | strict-v2 legality reconstruction, native semantic completion, arbitrary mutation |
| Future Companion | controller/session authority, secret storage, provider brokerage, diagnostics, recovery, optional external Agent boundary | direct game-object access or independent action execution |

## Connector Safety Kernel

- One resolved Active Surface has mutation authority.
- Every mutation is an opaque, exact-state action; clients cannot submit game
  indices, target paths, or arbitrary payloads.
- Publication and execution use the same Gateway legality; execution adds fresh
  identity and temporal revalidation.
- Completion proves the specific semantic result. An unknown outcome is
  terminal and is never automatically retried.
- Inspection is separately authorized, read-only, state-bound, and outside the
  command ledger.
- Player-visible information is modeled by shared state, context, active
  surface, preview/tooltip, inspection, and transient lifecycle facts rather
  than a raw object dump.
- Version, module, Modset, source binding, ownership, visibility, permission,
  or outcome uncertainty fails closed.
- Embedded adaptation data is validated before scope publication. Invalid
  source registries suppress their affected Surface only; invalid environment
  policy suppresses all authority and both cases emit typed diagnostics.

## Rule-Aware Adaptation Boundary

The Gateway may model a finite native interaction contract: owner references,
visible candidates, selector, bounds, native Commit and semantic post-state
Witness. This is required for safe adaptation and does not make the Gateway a
replacement game engine. It must never calculate or apply native card effects,
Power, Relic, RNG or arbitrary Mod behavior itself.

The closed combat-pile contract catalog is the current single machine source
for seven proven transaction topologies. Runtime validation, offline checks
and compatibility audit consume it; source identity and reviewed permission
remain separate. D-lane fingerprints, classifications, scenarios and graders
have no action authority. Static structure, fixture success and a matching
catalog entry cannot bypass exact runtime identity, execute-time validation,
native Commit or Organic evidence.

Build and Modset permission remains intentionally conservative. Operation-level
compatibility cannot replace the exact-environment gate until runtime
action-relevant patch closure and an evidence-backed policy path exist. See the
[automatic-adaptation audit](audits/CONNECTOR_AUTOMATIC_ADAPTATION_AND_D_WORKFLOW_AUDIT_2026-07-24.md).

## Current Architectural Constraint

The Gateway and Re share the mechanically checked `2.0-preview.62` source
contract. Gate 1 establishes a bounded v2 connector baseline: Re and the
default MCP adapter are v2-only, and the current-source Gateway v1 HTTP surface
is retired.
Historical v1 JSONL remains replay-readable as stored evidence, but no v1
sidecar may contribute live facts or action authority. The final Preview.61
Neow's Fury lifecycle supplied the Gate 1 runtime seal. Preview.62 source,
tests, audit and exact cold-loaded deployment remain separate evidence; none
inherits Preview.61 Organic qualification.

Combat-pile choice is the first production structural transaction contract.
Re reads closed mutation and commit semantics rather than a union of source
card names. The Gateway still proves the exact native source task, publishes
only opaque actions, resumes the game-owned continuation, and checks a semantic
post-state witness. This reduces consumer coupling without creating a universal
effect API or automatic authority for unknown sources.

Preview.62 makes the proven repetition explicit:

- a reviewed embedded source registry maps exact native source tasks onto a
  closed interaction/witness topology;
- one generic binding and provider path consumes that registry;
- a reviewed embedded exact-environment policy owns build-level Surface and
  Inspection tiers;
- a non-authorizing exact-assembly audit discovers callers and verifies
  selector/commit structure.

Discovery, verification, authorization and qualification remain separate.
Registry or policy presence cannot bypass exact runtime identity, operation
scope, current legality, execute-time revalidation or runtime evidence.

## Observation And Strategy Projection Boundary

The Gateway's complete evidence contract is not the same thing as an Agent's
strategy input, and neither grants action authority. Today Re serializes the
complete `NormalizedCurrentState` into every model Prompt and eagerly reads all
advertised Inspections. That is current behavior, not a settled long-term
architecture. It preserves evidence but duplicates some Inspection/action data
and sends governance metadata to the model.

The first generic strategy projection failed its cross-Surface evidence gate
and is not a runtime candidate. This does not make today's
`NormalizedCurrentState` a permanent public SDK or reject all future
consumer-specific views. Retain complete evidence for validation/replay,
investigate another projection only within an evidenced scope, and introduce
fact-group availability only when real ambiguity justifies it. See the
[visibility and observation audit](audits/VISIBILITY_AND_OBSERVATION_ARCHITECTURE_AUDIT_2026-07-22.md)
and the
[future program audit](audits/FUTURE_PROGRAM_AND_CONSUMER_ARCHITECTURE_AUDIT_2026-07-23.md).
