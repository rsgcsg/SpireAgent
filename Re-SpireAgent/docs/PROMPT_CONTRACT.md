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
model-oriented action list. A deterministic `shadowStrategyProjection` v1 now
exists only for offline comparison of already-recorded Prompts. It removes
governance-only fields, retains a small information boundary, deduplicates exact
player/Inspection pile copies, and carries source and projection hashes. It is
not wired into the live Prompt, provider, action selection, execution, replay,
or validation path. It therefore proves only structural byte savings, not
strategy fidelity or runtime eligibility.

Any future compact projection must remain deterministic/versioned/auditable,
preserve full evidence for replay and validation, and never create action
authority. A paired provider shadow experiment and semantic review are still
required before changing the Prompt path. No model-driven detail-request path
is implemented or approved. See the
[visibility and observation audit](../../docs/current/audits/VISIBILITY_AND_OBSERVATION_ARCHITECTURE_AUDIT_2026-07-22.md).

`npm run agent:prompt-audit` is a read-only aggregate report over ignored local
Prompt artifacts. It reports byte distributions, Surface groups, current-state
component sizes, and repeated-representation candidates without printing prompt
content or calling a provider. It does not create a compact Prompt, alter a
decision, or count as runtime evidence.

`npm run agent:prompt-shadow-compare -- --run-id <id> --decision-id <id>` is a
bounded provider-costing comparison over one exact recorded `PromptBundle`. It
calls the provider against the original full Prompt and the deterministic shadow
candidate, emits redacted outcome/latency/usage summaries, and performs no
Gateway request, action submission, command poll, run creation, or artifact
write. Agreement is neither strategy truth nor permission to change the runtime
Prompt; semantic review and multiple comparable samples remain required. The
reported byte delta is signed: small states can become larger when projection
metadata costs more than the removed repetition.

`npm run agent:prompt-repeat-baseline -- --run-id <id> --decision-id <id>
--samples <2-5> [--variant full|shadow]` repeats one exact recorded Prompt
variant without execution. It exists solely to bound provider variation before
interpreting a projection disagreement. It has the same no-Gateway/no-write
boundary as the paired comparison. The generic v1 candidate is currently
rejected for runtime use after stable reward-scope disagreement; these commands
remain investigation tools, not an approval path.

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
