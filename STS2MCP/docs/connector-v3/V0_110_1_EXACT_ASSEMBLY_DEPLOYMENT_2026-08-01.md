# Connector V3 v0.110.1 Exact-Assembly Deployment: 2026-08-01

This record closes source, test, build and local installation alignment. It is
not loaded-runtime, mutation or qualification evidence.

## Exact Boundary

- branch: `connectorV3`;
- committed baseline: `7b3567775f5cea7d3e27679db721a695e99d46bd`;
- protocol: Connector and Re `3.0-preview.1`;
- game: `v0.110.1`, commit `db5d3552`;
- declared release assembly hash: `348485714`;
- `sts2.dll` SHA:
  `5a8fb7eb62510a86fd03653b9210cd8f67b511b632331a1f174042de39c92bd9`;
- `sts2.dll` MVID: `f8b13902-74e6-4c41-9d83-7ea2bbf61567`.

This assembly differs from the earlier installation carrying the same game
version and commit. A separate exact static scenario preserves both evidence
identities. The new scenario has `authorization_effect: none` and
`qualification_effect: none`.

## Verification And Installation

- exact compatibility audit: 14 registered matches; existing Tutor holdout is
  still diagnostic `code_required`; no additional caller;
- reviewed operation-binding probes: matched;
- Gateway: 235 tests passed;
- Re: 223 tests, strict typecheck and production build passed;
- docs, CLI, run identity, compatibility fixtures, permissions,
  qualification, Profile and migration checks passed;
- Release/installed SHA:
  `3faf7cf2f402cafec0db40ea90a4212aef35c590c093caf6b114b69b7dba2d2b`;
- Release/installed MVID: `ebbea794-be0a-422d-a2ce-e2b981e664a5`;
- rollback:
  `STS2MCP/.local/deployments/2026-08-01T10-30-16-282Z`;
- one canonical `STS2_MCP` manifest is installed.

The game was stopped before installation. A subsequent Steam cold start loaded
the exact built/installed SHA and MVID as runtime
`0d517090cd3f4a10a2d844e423f01e5f`, protocol `3.0-preview.1`, with
exact-bridge-only Modset fingerprint
`1bf26047b68166b98b967e691d4a8d2630ed09092010bd1f20939432ca1c435f`.

The normal local Re `agent:inspect` entry negotiated Connector V3 and decoded
the current main-menu observation without schema errors. That read established
encounter-scoped provisional trial authority; inspection and mutation are now
reported ready. No command was submitted. Mutation behavior, Organic journey
coverage and durable qualification remain non-claims.

## Next Runtime Check

With the verified game process running, use the normal local entry:

```bash
cd /Users/fire/Desktop/SpireAgent/Re-SpireAgent
npm run agent:run
```

Preflight must verify the new loaded SHA/MVID, exact game assembly and Modset
before any mutation.
