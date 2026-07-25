# Preview.36 Exact Modset Identity Closeout

Status date: 2026-07-18

## Problem

Preview.35 scoped action and Inspection authority to an exact game
version/commit/main-assembly hash and Bridge MVID, but it did not identify the
other Mods actually loaded into the process. A gameplay or patch Mod could
therefore change source bindings, visibility, legality, commit behavior, or
completion while the old exact-game permission matrix remained active.

## Decision

Preview.36 adds a typed loaded Modset identity to every game identity envelope.
It is derived from the public current-build `ModManager.State` and
`ModManager.Mods` APIs. Each entry records manifest identity, source, load
state, gameplay flag, exact-string Workshop ID, and loaded assembly MVIDs. It
never records local paths.

The current permission profile is deliberately narrow:

```text
ModManager initialized
+ exactly one Loaded Mod
+ ID/version are the current STS2_MCP manifest
+ loaded assembly MVID equals Bridge identity
+ no Failed or AddedAtRuntime Mod
= exact_bridge_only
```

Anything else keeps diagnostic observation only and clears every action and
Inspection scope. Disabled Mods remain represented but are not treated as
loaded code. This does not authorize future Mods, including Mods that reuse
native STS2 UI; those still require independent Source Binding, visibility,
legality, commit, completion, canary, and qualification evidence.

## Contract And Client Boundaries

- Bridge computes one deterministic Modset fingerprint and includes it in
  capabilities, state, and Inspection envelopes.
- Re strictly requires an exact Bridge-only claim to contain one loaded
  `STS2_MCP` whose assembly MVID matches the negotiated Bridge MVID.
- Re state normalization, Inspection projection, scoped v1 fallback, current-
  build acceptance, and candidate-build acceptance all use the same exact
  Modset equality helper.
- Steam Workshop IDs are decimal strings, not JavaScript numbers, preserving
  exact identity beyond `Number.MAX_SAFE_INTEGER`.
- No Surface, operation, legal action, completion witness, or permission list
  changed.

## Verification

- Bridge tests: `73/73` passed.
- Re-SpireAgent: typecheck, `130/130` tests, and production build passed.
- MCP Python syntax compilation passed.
- Bridge Release build passed with zero warnings.
- Release and installed DLL SHA-256:
  `81c7377fe3fee327c536c22d2b91e690031290c56c0877a3f93598b5cace795f`.
- Steam cold-loaded protocol: `2.0-preview.36`.
- Loaded MVID: `60c123ec-5fb0-43a1-81ff-a31ebc0f822d`.
- Runtime instance: `30ab7922e50549d28c8de37dcd40b802`.
- Exact game: `v0.109.0|c12f634d|-840572606`.
- Loaded Modset: only `STS2_MCP:Loaded`, status `exact_bridge_only`, fingerprint
  `8a3dad5b6f3d4c0e60615af2055962dfb247ec4a0bc29c7df94c65661051fa4e`.
- Normalized preview.35/preview.36 capabilities were identical after removing
  protocol, module/runtime identity, and the newly added Modset field.
- Re strict decoding accepted the current root-menu state as
  `unknown + unsupported + none_fail_closed`, with zero legal actions.

This is loaded-environment observation and permission-gate evidence. It is not
Organic action qualification and does not transfer older MVID evidence to this
DLL.

## Architecture Review

Selected abstraction: typed environment identity composed with the existing
exact-game compatibility assessment. Rejected alternatives were directory
scanning, manifest-only trust, trusting `affectsGameplay=false`, or using game
hash alone. The selected boundary localizes future Mod/update revalidation
without creating an automatic authorization mechanism.

The next highest-value independent slice is purpose-specific standard-run root
menu navigation. The current loaded root menu remains unsupported/v1-owned;
it should not become a universal menu or low-level click protocol.
