# Bridge v2 And Re-SpireAgent Integration Audit - 2026-07-16

## Executive Verdict

Bridge v2 has the correct safety core but not broad player-visible coverage.
Preserve exact-build identity, player-visible observation policy, state-bound
opaque actions, execution revalidation, idempotency, and honest unknown
outcomes. The bridge remains an adapter, never the strategic brain.

The first client gap is resolved: Re-SpireAgent can consume and execute a
qualified v2 surface without merging legacy actions. Protocol source
`2.0-preview.2` now defines three typed vertical slices. Only deck enchant is
organically runtime-qualified; event and combat are build/fixture-qualified and
must not be described as game-qualified before fresh smokes.

## Runtime Follow-up

The original audit wording above is historical. After its publication, the
exact `2.0-preview.2` DLL was installed while the game was closed and three
bounded organic lifecycles were observed: deck enchant, an ordinary
`SUNKEN_STATUE` event choice, and one player-phase targeted combat card. Each
used Bridge-advertised opaque actions, exact-state revalidation, command
lifecycle evidence, and Re-SpireAgent settlement. The three slices are now
runtime-qualified only within their stated surface and action diversity; this
does not make Bridge v2 broad game coverage.

## Verified Baseline

- Imported upstream: `20eadebde358a37cca41f8b38728099e6d0d19db`.
- Exact game: `v0.108.0`, commit `58694f64`, assembly hash `-2044609792`.
- Running game at audit time: protocol `2.0-preview.1`, deck capability only.
- Source under test: protocol `2.0-preview.2`, deck/event/combat capabilities.
- Organic deck Bridge and Re-SpireAgent select/confirm lifecycle: passed.
- Event/combat C# build and Re strict contract fixtures: passed.
- Event/combat organic lifecycle: pending mod install/restart.

Slay the Spire 2 is still evolving, so upstream claims and decompiled type
compatibility are evidence inputs, not runtime qualification:

- https://store.steampowered.com/app/2868840/Slay_the_Spire_2/
- https://steamcommunity.com/app/2868840
- https://github.com/Gennadiyev/STS2MCP

## Findings And Decisions

| Severity | Finding | Decision |
|---|---|---|
| Critical, fixed | Re previously reconstructed index actions where v2 had authoritative opaque actions. | One observed state has one executor; v2-owned surfaces import only Bridge actions. |
| Critical, fixed | Unsupported-surface fallback could hide identity drift. | v1 fallback requires a coherent exact v2 unsupported response; all drift fails closed. |
| Critical, fixed | Valid JSON command responses could carry the wrong request/state/action identity. | Identity mismatch is unknown outcome and never retried. |
| Critical, fixed | `failed`/`timed_out` could be mistaken for safe rejection. | Only `rejected/not_applied` is safely rejected; failed/timeout remain unknown. |
| High, fixed | Interface serialization initially emitted only `surface.kind`. | Response-only typed union converter plus wire regression test. |
| High, fixed | `context.kind` was treated as if it named the whole state. | Display and validate `context.kind + surface.kind + action authority`. |
| High, fixed | Surface risked becoming a world-state bag. | Add typed context; keep shared combat/player semantics out of `combat_turn.surface`. |
| High, open | Three slices are not a complete player-visible protocol. | Keep exact per-surface coverage and explicit non-claims. |
| Medium, fixed | Hand-selected branching would become ambiguous. | Explicit ordered provider registry; multiple matches fail closed. |
| Medium, open | v1 sidecar may be incomplete or broader than v2 visibility. | It may supplement run/non-action shared facts only; Bridge combat context replaces action-relevant player/enemy facts. |
| Medium, open | Player-visible deck/pile inspection does not fit immediate action surfaces. | Future state-scoped read-only inspection; never expose hidden order. |
| Medium, open | Warnings remain free text. | Introduce structured diagnostics before broad coverage. |
| Medium, open | Runtime state and entity registries are process-global. | Accept only bounded singleplayer now; isolate sessions before multiplayer/concurrency. |
| Medium, open | Completion probes may under-model long transitions. | Add per-action evidence from organic event/combat smokes; never use generic “state changed” success. |

## Boundary Model

```text
exact environment identity
  -> semantic context
  -> player-visible common semantics
  -> blocking interaction surface
  -> effective action authority
  -> state-bound opaque legal actions
  -> command lifecycle and observed outcome
```

- context describes the game situation;
- surface describes the blocking interaction protocol;
- authority describes who may construct executable actions;
- legal actions describe current mutations/navigation;
- read-only inspection is not a fake mutation;
- hidden RNG, draw order, unrevealed outcomes, future rewards, and future enemy
  moves remain excluded.

## Three-Surface Abstraction Review

Deck enchant validates overlay stage, per-instance identity, effect semantics,
and exact completion. Event option validates that rich narrative context must
remain separate from a simple option protocol. Combat validates common
entities/resources, target legality, settling phases, and the need for future
read-only pile inspection.

Together they justify typed contexts, typed surfaces, state-level action
authority, stable entity IDs, an explicit provider registry, and completeness
metadata. They do not justify a universal ECS, reflection auto-discovery,
generic action payloads, or a complete world model.

## Re-SpireAgent Migration Contract

`STS2_MCP_PROTOCOL=auto` remains the migration default:

- strict protocol, build, observation, context/surface, and action validation;
- qualified v2 states use only Bridge actions and command settlement;
- unsupported coherent v2 states may delegate to v1;
- exact mismatch never silently regains v1 authority;
- unknown command outcomes stop without retry;
- planning code sees normalized state, not arbitrary Bridge JSON.

Strict `v2` stops on every unsupported surface. `v1` remains compatibility
mode and uses explicit `local_reconstruction` authority.

## Reference Audit Disposition

- typed surface DTO: resolved;
- client v2 integration: resolved for three fixture contracts, with two organic
  qualifications pending;
- provider registry: resolved narrowly;
- context/surface conflation: resolved in schema and CLI;
- post-close deck verification: open;
- structured diagnostics: open;
- global runtime singleton: open;
- observation ID versus executable state ID: deferred pending real need;
- read-only inspection/zone protocol: direction accepted, implementation open;
- universal entity/world model: rejected as premature;
- reflection-based automatic provider discovery: rejected.

## Next Qualification Steps

1. Reassess completion, performance, warning structure, and inspection needs
   from the three organic slices before adding a fourth surface.
2. Define a composition contract for known context plus overlay, rather than
   treating any new screen as a generic extension of combat or event.
3. Add structured diagnostics and a read-only inspection design before growing
   broad player-visible coverage.

## Non-Claims

This audit does not claim all player-visible information is exposed, fixture
tests prove game compatibility, v1 is a safe long-term authority, every
event/combat variant is runtime-qualified, or Re-SpireAgent has memory,
learning, scoring, or autonomous policy changes.
