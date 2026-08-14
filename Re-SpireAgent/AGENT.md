# Re-SpireAgent Engineering Guide

Re is a consumer of the standalone STS2 Connector. Read
`docs/PLAYER_ENVIRONMENT_INTEGRATION.md` and the root `connector-requirements.json`
before changing its connector path.

## Current Pipeline

```text
Player Environment Snapshot -> strict decoder -> PlayerEnvironmentRawState
-> normalizePlayerEnvironmentCurrentState
-> buildPlayerEnvironmentAllowedActions
-> prompt -> strict model decision
-> exact advertised action submit -> receipt -> successor supervision
```

- The model chooses a local ID, never a native payload.
- Allowed actions come only from the current complete bound-action catalog.
- Re does not reconstruct native legality, effects or completion.
- Invalid schema, stale snapshot, unknown choice or receipt mismatch fails
  closed. Unknown delivery is never retried.
- Lazy/eager read selection is consumer policy; reads remain C-issued,
  snapshot-coherent and non-authorizing.

## Module Ownership

- `@rsgcsg/sts2-connector-client`: strict wire, REST, controller and Read helpers
- `src/integrations/sts2Connector/`: thin Re adapter and presentation parsing
- `src/normalization/normalizePlayerEnvironmentCurrentState.ts`: raw-to-domain
- `src/domain/actions/buildPlayerEnvironmentAllowedActions.ts`: finite import
- `src/prompting/`: model format only
- `src/runtime/`: stale, loop, receipt and successor supervision
- `src/recording/`: append-only local evidence
- `src/app/`: CLI composition

Do not add a second connector authority, game rule evaluator, action scorer,
JSON repair path or legacy fallback. Do not commit `data/runs`, provider output,
`.env.local` or secrets.

## Validation

```bash
npm run typecheck
npm test
npm run build
```
