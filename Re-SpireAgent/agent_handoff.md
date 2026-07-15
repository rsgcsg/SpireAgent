# RE-P1 Handoff

Status: implementation complete offline; real MCP smoke pending because the local REST service was unavailable during this build.

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

- A real MCP read/execute smoke has not yet run in this package.
- `bundle_select` has old-project examples but no verified organic raw fixture in the inspected run evidence, so it remains unsupported.
- Complete deck context is not visible on every MCP state; the normalizer does not fabricate it.
- Shop exit uses one documented, diagnostics-visible inference from verified old live behavior.
- Game updates or MCP serialization changes may introduce unknown states, which stop safely and require fixture-led support.

## Validation

On 2026-07-15, a clean `npm ci` reported zero vulnerabilities, then `npm run check` passed strict source-and-test typechecking, 39 tests across 6 files, and the production TypeScript build. `npm run agent:inspect` failed safely because `http://localhost:15526` was not listening; it did not create a run or call DeepSeek.

## Next Step

With Slay the Spire 2 and STS2 MCP running:

```bash
cd Re-SpireAgent
npm run agent:inspect
npm run agent:tick -- --dry-run
npm run agent:tick
npm run agent:replay
```

Confirm that the real decision record contains the expected pre/post raw snapshots, full prompt, DeepSeek response, selected allowed action, MCP result, and settled post-state. Fix protocol mismatches with a new raw fixture and contract test before running a longer loop.
