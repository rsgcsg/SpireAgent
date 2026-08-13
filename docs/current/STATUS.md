# Current Status

Baseline date: 2026-08-13

SpireAgent now owns the Agent, evaluation and product-integration layers. The
real-game Host, Player Environment contract, REST/MCP transports, Connector
tests and Connector SDK are owned by
[`rsgcsg/STS2-Connector`](https://github.com/rsgcsg/STS2-Connector).

## Consumer Contract

- accepted Player Environment protocol: `1.0-rc.2`;
- Connector client: `@rsgcsg/sts2-connector-client@1.0.0-rc.1`;
- requirements authority: [`connector-requirements.json`](../../connector-requirements.json);
- Re imports strict wire validators, REST and controller coordination from the
  Connector package;
- Re owns only normalization, finite model-choice projection, provider calls,
  progress supervision, recording and evaluation.

The checked-out development workspace uses the explicit sibling package source
`../STS2-Connector/sdk/typescript` until the first public Connector package is
published. This is a development dependency, not a branch-based product update
policy. A release consumer must use the exact package version in the machine
requirements.

The local standalone Connector runtime verified during the 2026-08-13 cutover
is source `f104e16b6585599e6acf5481c255fa74ea1d221e`, protocol
`1.0-rc.2`, DLL SHA-256
`8540a7ff54b26a1d34e9565636815272a0ad7a13b75cca4439a2d09d611a3157`,
MVID `a4b5cdac-3b9b-444a-8def-9d7a2f58f4a4`, and runtime instance
`91ebf7a4c1e9415d874c6985cc3cfe2c` on
`v0.110.1/db5d3552` with the exact Connector-only Modset. This is local loaded
and targeted Live evidence, not a published release or completed Journey.

## Runtime Evidence Boundary

Standalone Connector source, build, install, loaded identity, Live exercise
and release are separate evidence levels. The current Connector repository
holds their canonical status. SpireAgent run records may cite a loaded
Connector identity, but cannot qualify or grant authority to that artifact.

Historical Bridge, V2, V3 and monorepo C reports live under `docs/history/`.
They are predecessor evidence, not current implementation instructions.

## Current Non-Claims

- The standalone Connector has not yet been published as a GitHub or package
  release from this checkout.
- A local sibling dependency is not an ordinary-user installation channel.
- A delivered Receipt proves native input delivery, not STS2 business-effect
  completion.
- SpireAgent does not support a fallback connector or locally reconstructed
  game legality.
- The standalone Connector has not yet completed an ordinary same-artifact
  Journey or public package/binary publication.
