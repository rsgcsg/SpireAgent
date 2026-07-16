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
