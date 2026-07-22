# Audited Baseline

## Source

- Upstream: `https://github.com/Gennadiyev/STS2MCP`
- Imported commit: `20eadebde358a37cca41f8b38728099e6d0d19db`
- Upstream commit date: 2026-06-16
- License: MIT

A separate local upstream worktree was intentionally not copied because it
contained unrelated untracked agent/runtime data and local modifications. Only
the clean Git object at the fixed commit was imported, then each compatibility
change was reapplied from current-game evidence.

## Local Toolchain And Game

- Slay the Spire 2: `v0.108.0`
- Game commit: `58694f64`
- Main assembly hash: `-2044609792`
- Godot reported by game log: `4.5.1-m.14`
- .NET SDK used: `9.0.117`
- Runtime used: `9.0.16`
- Decompiled assembly: installed arm64 macOS `sts2.dll`

## Baseline Result

The clean upstream commit does not compile against `v0.108.0`: 11 API errors
were reproduced. Confirmed API migrations include:

- removed `CombatManager.IsPlayPhase`;
- combat state exposed as `ICombatState` in affected paths;
- merchant inventory now obtained through `GetLocalInventory()`.

The compatibility patch builds with zero warnings and zero errors against the
installed assembly. This proves type compatibility only, not behavioral parity.

## Existing Runtime Characterization

The previously installed v1 mod was `v0.4.0`. At an active deck enchant
selection, it returned cards plus `can_confirm=true`, but omitted:

- enchantment identity, title, description, and amount;
- selected-card identities;
- minimum/maximum selection constraints;
- selecting versus preview stage;
- which confirm button was being advertised.

That runtime observation is debug characterization only. It is not v2 smoke.

## V2 Runtime Qualification

The final `0.5.0-dev` Release was installed and loaded successfully. Capabilities
reported the exact fingerprint:

```text
v0.108.0|58694f64|-2044609792
```

The event was restored organically through the saved `Wood Carvings` state and
the visible `Snake` option. The complete v2 smoke is recorded in
[`SMOKE_2026-07-16.md`](SMOKE_2026-07-16.md).
