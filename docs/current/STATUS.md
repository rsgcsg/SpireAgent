# Current Status

Baseline date: 2026-08-14

SpireAgent now owns the Agent, evaluation and product-integration layers. The
real-game Host, Player Environment contract, REST/MCP transports, Connector
tests and Connector SDK are owned by
[`rsgcsg/STS2-Connector`](https://github.com/rsgcsg/STS2-Connector).

## Consumer Contract

- accepted Player Environment protocol: `1.0-rc.2`;
- Connector client: `@rsgcsg/sts2-connector-client@1.0.0-rc.1`;
- immutable package source: Connector GitHub release `v1.0.0-rc.1`;
- requirements authority: [`connector-requirements.json`](../../connector-requirements.json);
- Re imports strict wire validators, REST and controller coordination from the
  Connector package;
- Re owns only normalization, finite model-choice projection, provider calls,
  progress supervision, recording and evaluation.

The public Connector prerelease is tag/source
`v1.0.0-rc.1` / `a5db1aea0aabfde457383012b4cae9aa41c92a74`, protocol
`1.0-rc.2`, DLL SHA-256
`d28bffe134b3716d5acbf22599fc3e2d93cc6307979c4ed19d6b3cec0f8e1752`
and MVID `5b24fa87-bb21-499f-b5c9-7fccc1714d34`. It was cold-loaded on
`v0.111.0/41cef1ea` with the exact Connector-only Modset and completed targeted
controller/idempotency/stale/Read/native-page gates, a fresh ordinary Journey
to `game_over`, and an actual rollback/cold-load/restore roundtrip. Canonical
runtime evidence and release assets remain owned by the Connector release.

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
