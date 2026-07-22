# Human Capture Limits

Current STS2MCP does not reliably expose exact human UI actions. This matters for training data and replay.

## What Is Reliable Now

Reliable:

- Current visible state snapshots.
- Agent-selected actions sent through the executor.
- Agent action success/error response at a coarse level.
- Post-action effects after re-reading state.

Not reliable:

- "The human clicked this exact card."
- "The human targeted this exact enemy."
- "The human selected this exact reward."
- Human action ordering between polling intervals.

## Why Diff Inference Is Not Ground Truth

Diff inference can guess from:

- hand changed
- energy changed
- enemy hp changed
- discard/exhaust changed
- rewards/options changed

But it is ambiguous with:

- duplicate cards
- generated cards
- random effects
- relic triggers
- exhaust/retain
- multi-hit effects
- target death
- simultaneous screen changes
- missed poll intervals

Therefore human diff-inferred actions must be recorded with:

- `captureMode=diff_inferred`
- `isGroundTruth=false`
- `confidence`
- `uncertainty`
- `candidateActions`
- `inferenceReason`

## Correct Long-Term Solution

Add a real event log to the game-side mod:

```http
GET /api/v1/events?since=<eventId>
```

Events should include card identity, target, source, pre/post refs, floor, screen, timestamp, and raw event data.

Until this exists, human data can help with exploratory review but should not be used as high-confidence labeled training examples.
