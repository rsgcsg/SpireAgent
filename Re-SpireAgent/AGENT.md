# Re-SpireAgent Engineering Guide

Re is a consumer of Human Environment C. Read ADR-0009 and
`docs/HUMAN_ENVIRONMENT_INTEGRATION.md` before changing its connector path.

## Current Pipeline

```text
HE JSON -> strict decoder -> HumanEnvironmentRawState
-> normalizeHumanEnvironmentCurrentState
-> buildHumanEnvironmentAllowedActions
-> prompt -> strict model decision
-> exact advertised action submit -> receipt -> successor supervision
```

- The model chooses a local ID, never a native payload.
- Allowed actions come only from the current complete HE bound-action catalog.
- Re does not reconstruct native legality, effects or completion.
- Invalid schema, stale snapshot, unknown choice or receipt mismatch fails
  closed. Unknown delivery is never retried.
- Lazy/eager read selection is consumer policy; reads remain C-issued,
  snapshot-coherent and non-authorizing.

## Module Ownership

- `src/integrations/sts2mcp/humanEnvironment*`: strict wire/client adapter
- `src/normalization/normalizeHumanEnvironmentCurrentState.ts`: raw-to-domain
- `src/domain/actions/buildHumanEnvironmentAllowedActions.ts`: finite import
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
