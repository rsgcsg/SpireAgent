# Prompt Contract

RE-P1 has one prompt path:

```text
global system contract + semantic-context guide + interaction-surface guide
runtime JSON payload
```

The v3 runtime payload contains the complete normalized current state,
`contextKind`, `surfaceKind`, `actionAuthority`, both guide identities, action
summaries, schema versions, and output contract. It never includes executable
MCP payloads or an API key. This avoids a custom prompt for every
context/surface combination while retaining combat facts under an overlay and
making the action source explicit. Surface guides also prohibit factual claims
about selected cards or capacity when the adapter does not expose them.

This full-state serialization is current behavior, not a settled compression
architecture. The normalized state also contains evidence/governance metadata,
and some Inspection and action facts appear in both normalized evidence and the
model-oriented action list. A future compact projection must first be measured
in shadow, remain deterministic/versioned/recorded, preserve the full state for
replay and validation, and never create action authority. No such projection or
model-driven detail-request path is implemented or approved. See the
[visibility and observation audit](../../docs/current/audits/VISIBILITY_AND_OBSERVATION_ARCHITECTURE_AUDIT_2026-07-22.md).

Expected model output:

```json
{
  "selectedActionId": "one exact allowed action id",
  "reasonBrief": "one concise decision-relevant conclusion",
  "confidence": 0.8
}
```

The object is strict. Extra fields, code fences, trailing text, multiple objects, blank reasons, out-of-range confidence, and unknown action IDs are rejected. Provider JSON mode is transport assistance, not local authorization.

State guides explain field and action semantics only. The deck-enchant guide explains its two-stage protocol and visible constraints, but does not prescribe which card is strategically best. Guides must not grow into per-screen hand-authored strategy piles. Strategic knowledge belongs in a later, separately designed layer after RE-P1 is stable.

Each prompt file stores the full system and user strings, prompt payload, versions, hashes, and byte counts. Headers and secrets are never recorded.
