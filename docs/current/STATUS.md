# Current Status

Baseline date: 2026-08-15

SpireAgent now owns the Agent, evaluation and product-integration layers. The
real-game Host, Player Environment contract, REST/MCP transports, Connector
tests and Connector SDK are owned by
[`rsgcsg/STS2-Connector`](https://github.com/rsgcsg/STS2-Connector).

## Consumer Contract

- accepted Player Environment protocol: `1.0.0`;
- Connector client: `@rsgcsg/sts2-connector-client@1.0.0`;
- immutable package source: Connector GitHub release `v1.0.0`;
- requirements authority: [`connector-requirements.json`](../../connector-requirements.json);
- Re imports strict wire validators, REST and controller coordination from the
  Connector package;
- Re owns only normalization, finite model-choice projection, provider calls,
  progress supervision, recording and evaluation.

The recommended stable Connector is tag/source
`v1.0.0` / `c38d4ad2e9d6eb029f8853ed852cce1152bc6d50`, protocol
`1.0.0`, DLL SHA-256
`5014224ce8a1f5a61455f21d6873a87052eac533acffce04ac3fb75195bff185`
and MVID `68f7a9aa-c293-4897-94cd-1e59ab6dd180`. It was cold-loaded on
`v0.111.0/41cef1ea` with the exact Connector-only Modset and completed targeted
controller/idempotency/stale/Read/native-page gates, a fresh ordinary Journey
to `game_over`, an actual rollback/cold-load/restore roundtrip, and an
archive-extracted identity check. RC1/RC2 are retained only as superseded
predecessor evidence. Canonical runtime evidence and release assets remain
owned by the Connector release.

## Runtime Evidence Boundary

Standalone Connector source, build, install, loaded identity, Live exercise
and release are separate evidence levels. The current Connector repository
holds their canonical status. SpireAgent run records may cite a loaded
Connector identity, but cannot qualify or grant authority to that artifact.

Historical Bridge, V2, V3 and monorepo C reports live under `docs/history/`.
They are predecessor evidence, not current implementation instructions.

## Current Non-Claims

- A delivered Receipt proves native input delivery, not STS2 business-effect
  completion.
- SpireAgent does not support a fallback connector or locally reconstructed
  game legality.
- The stable exact-artifact evidence does not qualify arbitrary game versions,
  Mods, Headless,
  training, search or transient presentation history.
