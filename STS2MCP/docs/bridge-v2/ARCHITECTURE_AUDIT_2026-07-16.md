# Bridge v2 And Re-SpireAgent Integration Audit - 2026-07-16

## Executive Verdict

Bridge v2 has the right safety core but not broad player-visible coverage. Its
exact-build binding, player-visible observation policy, state-scoped opaque
actions, execution-time revalidation, idempotent command ledger, and honest
completion lifecycle should be preserved. The bridge remains an adapter, not a
strategic brain.

At the audited baseline, the immediate architectural failure was at the client
boundary: Re-SpireAgent consumed v1 index actions and could not use the one
runtime-qualified v2 surface. That gap is now addressed by a strict decoder and
an `auto` dual-read/single-executor adapter for `deck_enchant_selection` only.
This does not make the protocol broadly complete.

## Verified Baseline

- Repository baseline audited: `ed610cdb57119b585b7a81895169caa51f04f0ab`.
- Imported upstream baseline: `20eadebde358a37cca41f8b38728099e6d0d19db`.
- Installed game identity observed during the existing smoke: game `v0.108.0`,
  commit `58694f64`, main assembly hash `-2044609792`.
- Bridge protocol: `2.0-preview.1`; bridge version: `0.5.0-dev`.
- Runtime-qualified v2 surface: `deck_enchant_selection` only.
- All other v2 surfaces remain unsupported with zero v2 legal actions.

External version evidence reinforces this policy. The official Steam page
describes the game as Early Access with further content and balance changes,
and the official community page documents v0.108.0 plus modding changes. The
upstream STS2MCP repository is useful prior art, but its published compatibility
claims are not a substitute for this installed-build identity.

- https://store.steampowered.com/app/2868840/Slay_the_Spire_2/
- https://steamcommunity.com/app/2868840
- https://github.com/Gennadiyev/STS2MCP

The existing organic smoke proves the Bridge deck-enchant surface. The new
Re-SpireAgent contract tests prove decoding, projection, authority selection,
and command-result handling against fixtures. A fresh Re-SpireAgent-to-game
deck-enchant smoke is still required before calling that client path
end-to-end runtime-qualified.

A read-only Re-SpireAgent `auto` negotiation smoke also passed at the main menu:
it recorded Bridge `0.5.0-dev`, protocol `2.0-preview.1`, exact game identity,
and `deck_enchant_selection` capability, then correctly used v1 for the menu
because v2 reported that surface unsupported. It called no model and executed
no action.

## Findings And Decisions

| Severity | Finding | Decision |
|---|---|---|
| Critical, fixed | Re-SpireAgent had no v2 consumer and reconstructed index actions even where the bridge had authoritative opaque actions. | Add a parallel strict v2 decoder/projector and negotiated hybrid adapter. |
| Critical, fixed | `auto` fallback could have hidden a drifted v2 state contract when the current surface was unsupported. | Permit v1 authority only when a coherent exact v2 contract explicitly reports the surface unsupported; otherwise retain the v2 wrapper and fail closed. |
| Critical, fixed | A command response could be valid JSON yet carry a different request, state, or action identity. | Treat identity mismatch as unknown outcome, stop, and never retry automatically. |
| Critical, fixed | Bridge command `failed` means unknown application outcome, not a safe rejection. | Classify `failed` and `timed_out` as unknown; only `rejected/not_applied` is safely rejected. |
| High, fixed | Changing `surface` from `object` to an interface initially caused `System.Text.Json` to emit only `kind`. | Add a response-only converter and a wire regression test preserving all concrete fields. |
| High, fixed | Exact-build authority could be represented by a boolean without requiring concrete version, commit, and assembly identity at the client. | Require `supported_exact`, execution permission, and non-empty exact identity; compare state and capabilities. |
| High, fixed | Advertised surface operations and returned legal-action kinds were not cross-checked by the client. | Reject the surface if any action kind is not advertised for that exact surface. |
| High, open | Bridge v2 exposes one surface, not a complete current-game semantic model. | Keep the coverage matrix honest; add one game-fact-audited vertical slice at a time. |
| Medium, open | v1 sidecar context is incomplete and locally reconstructed. | Use it only as migration context, never as action authority for a v2-owned surface. |
| Medium, deferred | The envelope has no universal context/entity/zone/inspection model. | Wait for a second real surface to expose shared requirements before adding abstractions. |
| Medium, deferred | Runtime is static and providers are hand-selected. | Do not refactor until a second surface creates a concrete lifecycle/testability problem. |

## Boundary Model

The durable boundary is:

```text
player-visible semantics
  -> semantic context
  -> active interaction surface
  -> bridge-advertised legal actions
  -> state-bound opaque command
  -> observed command outcome
```

These concepts must not collapse into one object:

- semantics are facts a normal player can currently know;
- context is the game situation;
- surface is the active interaction protocol;
- legal actions are currently valid mutations or necessary navigation.

Ordinary read-only inspection should not be faked as a mutating legal action.
Hidden draw order, RNG, unrevealed event outcomes, future rewards, and future
enemy moves remain out of scope even if available in memory.

## Re-SpireAgent Migration Contract

`STS2_MCP_PROTOCOL=auto` is the migration default:

- v2 capabilities and state are strictly decoded;
- exact compatibility failure never silently regains v1 authority;
- a qualified deck-enchant surface uses only v2 legal actions and v2 command
  settlement;
- the optional v1 sidecar may supplement context/run/player facts only;
- unsupported v2 surfaces continue through the existing v1 path;
- one observed state has one executor;
- unknown command outcomes stop without automatic retry.

`v1` remains a compatibility mode. `v2` is a strict mode and therefore stops on
every surface not implemented in Bridge v2.

## Deliberate Deferrals

The following ideas from the reference audit are plausible but premature:

- a universal entity store or ECS-shaped protocol;
- separate observation and decision state identifiers;
- a generic inspection-query subsystem;
- a provider registry and large runtime/session refactor;
- generalized zones and narrative schemas;
- broad protocol enums for facts not yet observed on a second surface.

Adding them now would produce schema confidence without game evidence. The
second real surface should determine which shared abstractions are necessary.

## Next Qualification Steps

1. At a fresh organic deck-enchant screen, run Re-SpireAgent inspect/dry-run and
   one bounded action lifecycle; verify exact identity, opaque action import,
   command identity, and terminal outcome.
2. Keep all other surfaces on v1 in `auto` mode.
3. Select the second v2 surface from repeated real client information/action
   failures, then audit its exact game facts and normal UI before coding it.
4. Only after two surfaces share a proven concept should it become a common
   protocol abstraction.

## Non-Claims

This audit does not claim all player-visible information is exposed, that v1 is
safe enough for long-term use, that fixture tests prove game compatibility, or
that Re-SpireAgent has memory, learning, scoring, or autonomous policy changes.
