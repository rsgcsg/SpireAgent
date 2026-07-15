# Prompt Contract

RE-P1 has one prompt path:

```text
global system contract + state guide
runtime JSON payload
```

The runtime payload contains the complete normalized current state, action summaries, schema versions, guide identity, and output contract. It never includes executable MCP payloads or an API key.

Expected model output:

```json
{
  "selectedActionId": "one exact allowed action id",
  "reasonBrief": "one concise decision-relevant conclusion",
  "confidence": 0.8
}
```

The object is strict. Extra fields, code fences, trailing text, multiple objects, blank reasons, out-of-range confidence, and unknown action IDs are rejected. Provider JSON mode is transport assistance, not local authorization.

State guides explain field and action semantics only. They must not grow into per-screen hand-authored strategy piles. Strategic knowledge belongs in a later, separately designed layer after RE-P1 is stable.

Each prompt file stores the full system and user strings, prompt payload, versions, hashes, and byte counts. Headers and secrets are never recorded.
