# Prompt Contract

RE-P1 has one production Prompt path:

```text
global system contract
+ semantic context guide
+ interaction Surface guide
+ deterministic compact JSON projection v1
```

## Model Payload

The JSON payload contains:

- `promptProjectionVersion`;
- one `actionAuthority`;
- `task=select_one_allowed_action`;
- compact `currentState`;
- one exact `allowedActions` menu;
- an optional bounded `informationBoundary`.

It preserves player-visible decision facts, current Surface/stage, exact
instance identities, legal actions and hidden/missing/coherence boundaries. It
removes governance-only diagnostics/catalogs, the duplicate
`surface.legalActions` menu and exact duplicate player/Inspection pile facts.
No API key or executable MCP payload enters the Prompt.

The complete normalized state is still recorded for replay, validation and
audit. Projection v1 records the source-state hash, exact projection hash,
omitted evidence fields and deduplicated fact groups. These hashes do not grant
action authority. Execution still checks the in-memory allowed-action
whitelist and current Gateway state.

The implementation file retains the historical
`shadowStrategyProjection.ts` name and `buildShadowStrategyProjection`
alias so recorded comparison tooling remains readable. Production Prompt
construction calls `buildStrategyProjection`; the projection is no longer
shadow-only.

## Output

```json
{
  "selectedActionId": "one exact allowed action id",
  "reasonBrief": "one concise decision-relevant conclusion",
  "confidence": 0.8
}
```

The object is strict. Extra fields, fences, trailing text, multiple objects,
blank reasons, invalid confidence and unknown IDs are rejected. Provider JSON
mode is transport assistance, not local authorization.

## Audit

`npm run agent:prompt-audit` is read-only over ignored local Prompt
artifacts. It reports full/projected byte distributions, duplicate
representations and malformed files without printing Prompt content or calling
the provider.

The 2026-08-03 audit over 628 Prompts found zero malformed artifacts, full
median/p95/max 12,071/28,937/38,004 bytes, projected
6,945/16,305/23,248 bytes, median savings 4,231 bytes and 507 duplicate action
menus removed.

`agent:prompt-shadow-compare` and `agent:prompt-repeat-baseline` remain
non-mutating provider experiments over recorded bundles. They never contact the
Gateway or create a run. The current provider comparison was blocked by the
network, so no strategy-equivalence claim exists.

State guides explain schema semantics and visible constraints only. They must
not become per-screen strategy scripts. Strategy, memory and learning remain
outside this V3 freeze.
