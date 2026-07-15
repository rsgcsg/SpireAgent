# RE-P1 Handoff

Status: one real Act 1 run has been exercised through boss defeat. RE-P1 completed repeated state reads, DeepSeek JSON decisions, state validation, MCP execution, settlement, and evidence recording across combat and non-combat surfaces. It remains a protocol baseline, not a verified strategic player.

## Completed

- Independent Node/TypeScript package in `Re-SpireAgent/`
- Strongly typed discriminated `NormalizedCurrentState`
- Fixture-backed normalizers for observed MCP state families
- Deterministic, unscored allowed-action builder
- Verified MCP action serializer
- Single versioned prompt path
- DeepSeek V4 Flash JSON provider with explicit thinking mode and one bounded format retry
- Strict JSON/schema/action-ID validation
- Pre-execution state re-read using a full-RawState hash, plus a separate normalized projection hash for audit
- Post-execution settlement watcher with longer end-turn timeout
- Full local prompt/response/pre/post/decision evidence
- Inspect, dry-run tick, real tick, bounded run, and replay commands
- Offline unit and integration tests, including the REST adapter boundary
- Real MCP `event` decision: valid DeepSeek JSON, allowed ID, stale-state match, accepted MCP action, and settled post-state
- Real post-combat `monster` and `elite` shells recognized as transitions rather than invalid combat states
- Provider evidence redaction preserves output caps and usage counts while still removing credential-bearing fields
- Action-capable CLI commands use a local exclusive lock; settlement requires two matching stable observations
- Bounded real-game windows covered event, combat, rewards, card reward, map, rest, shop, and a boss fight. Clean windows recorded only `valid_json` responses with `finishReason=stop`, settled executions, and no stale execution.
- `agent:run` now stops at `game_over` or a top-level `menu` before the model can choose a restart; this was added after a real boss defeat showed that an unconstrained loop could otherwise cross the one-game boundary.

## Legacy Assessment

Reused as verified protocol evidence, not copied architecture:

- observed MCP endpoint and raw-state shapes
- verified MCP action names and request field names
- the known shop `proceed` compatibility behavior
- the principle that provider failures and unknown action IDs fail closed

Rewritten for RE-P1:

- normalized state ownership and discriminated state union
- allowed-action generation and opaque action IDs
- prompt contract and strict DeepSeek JSON parser
- state-drift guard, settlement loop, and tick orchestration
- append-only decision evidence and replay reader

Deliberately abandoned:

- the old controller, memory and scoring paths
- CandidateFuture / DeliberationPacket and cognitive-scaffold code
- shadow/additive rollout, command bridge, phase gates, policy proposals, and promotion machinery
- permissive JSON extraction/repair and strategic local fallback

## Deliberate Omissions

No memory, learning, scoring, strategic scaffold, shadow mode, live additive mode, proposal engine, promotion, policy overlay, or legacy fallback exists in RE-P1.

## Known Limits

- `bundle_select` has old-project examples but no verified organic raw fixture in the inspected run evidence, so it remains unsupported.
- Complete deck context is not visible on every MCP state; the normalizer does not fabricate it.
- Shop exit uses one documented, diagnostics-visible inference from verified old live behavior.
- Game updates or MCP serialization changes may introduce unknown states, which stop safely and require fixture-led support.
- A human or unrelated external process can still act in the same game session; the local lock prevents only concurrent RE-P1 processes. State drift remains recorded and blocks stale execution.
- One real combat action was rejected by MCP after a matching pre-execution snapshot reported a playable hand index. The same index also succeeded in other windows, so RE-P1 records this as a low-frequency MCP/UI synchronization risk rather than hard-coding a strategic restriction. Reproduce before changing the action protocol.
- The real Act 1 run ended in a boss defeat. Strategic quality has not been evaluated; current evidence verifies the closed-loop protocol only.

## Validation

On 2026-07-15, a clean `npm ci` reported zero vulnerabilities, then `npm run check` passed strict source-and-test typechecking, 39 tests across 6 files, and the production TypeScript build. On 2026-07-16 the MCP service became available: `inspect` normalized a live Neow event with `diagnostics.status=ok`; a dry run recorded its prompt/evidence; then DeepSeek selected a legal event option that MCP accepted and settled. The subsequent bounded run surfaced a real `monster` post-combat shell without `battle`, recorded it safely, and added fixture-backed transition support.

## Next Step

With Slay the Spire 2 and STS2 MCP running:

```bash
cd Re-SpireAgent
npm run agent:inspect
npm run agent:tick -- --dry-run
npm run agent:tick
npm run agent:replay
```

Start a fresh game manually, then run bounded windows and inspect each run with `npm run agent:replay`. Confirm that each record contains pre/post raw snapshots, the prompt, DeepSeek response, selected allowed action, MCP result, and settled post-state. Fix a repeatable protocol mismatch with a reduced raw fixture and contract test before running longer loops.
