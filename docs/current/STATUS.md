# Current Status

Baseline date: 2026-08-14

SpireAgent now owns the Agent, evaluation and product-integration layers. The
real-game Host, Player Environment contract, REST/MCP transports, Connector
tests and Connector SDK are owned by
[`rsgcsg/STS2-Connector`](https://github.com/rsgcsg/STS2-Connector).

## Consumer Contract

- accepted Player Environment protocol: `1.0-rc.2`;
- Connector client: `@rsgcsg/sts2-connector-client@1.0.0-rc.2`;
- immutable package source: Connector GitHub release `v1.0.0-rc.2`;
- requirements authority: [`connector-requirements.json`](../../connector-requirements.json);
- Re imports strict wire validators, REST and controller coordination from the
  Connector package;
- Re owns only normalization, finite model-choice projection, provider calls,
  progress supervision, recording and evaluation.

The recommended public Connector prerelease is tag/source
`v1.0.0-rc.2` / `547c9addac624f7df363a93a3873ee1c2062ecc3`, protocol
`1.0-rc.2`, DLL SHA-256
`cf7ed1454437cb796f5931b361f655222d2f3f2e3da3a21f038a752694645cc6`
and MVID `6824e21d-7486-40fd-a131-43e789fdc8d2`. It was cold-loaded on
`v0.111.0/41cef1ea` with the exact Connector-only Modset and completed targeted
controller/idempotency/stale/Read/native-page gates, a fresh ordinary Journey
to `game_over`, an actual rollback/cold-load/restore roundtrip, and an
archive-extracted identity check. RC1 is retained only as superseded
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
- The RC evidence does not qualify arbitrary game versions, Mods, Headless,
  training, search or transient presentation history.
