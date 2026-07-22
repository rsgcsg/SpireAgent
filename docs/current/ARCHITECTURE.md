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

## Current Architectural Constraint

The Gateway and Re now share one mechanically checked `2.0-preview.56`
connector contract. The next boundary is operational: build, install, and prove
one loaded artifact before adding Surface providers. This prevents source/test
agreement from being mistaken for current runtime evidence.
