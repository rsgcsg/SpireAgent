# LLM Run Modes

This runbook explains the project's current LLM operating modes.

It is intentionally operational, not architectural.

## Do Not Confuse Mode Families

The names below primarily describe provider/rollout behavior. They do not by themselves define strategic authority or learning permissions.

Keep four dimensions separate:

- **provider mode:** DeepSeek, bridge, another LLM, or local component
- **rollout mode:** local, shadow, explicit-whitelist live, or forbidden wildcard
- **learning mode:** read-only, proposal-only, shadow overlay, or future guarded stable policy
- **decision-authority mode:** `llm_primary`, `llm_full_control`, `local_shadow`, or isolated `local_autonomy_experimental`

For example, `deepseek_explicit_whitelist_live` says which provider path and rollout gate were used. It does not give DeepSeek authority to write memory, approve learning, change budgets, or bypass validation. Current runs should be interpreted as `llm_primary` unless a future explicit authority record says otherwise.

## Mode Map

### `local_only`

- Default local behavior when no live LLM call is requested.
- Local scoring, fallback, and validation remain in charge.
- This is an operational baseline, not the long-term definition of local strategic authority.

### `shadow_workspace`

- P8 structured workspace is built and recorded.
- Shadow provider calls may occur if explicitly enabled.
- Shadow decisions do not execute.

### `bridge_live`

- Live LLM calls go through a bridge responder command.
- Useful for debugging and manual/interactive windows.
- Not the preferred default for current DeepSeek live rollout.

### `deepseek_explicit_whitelist_live`

- Live additive prompt path is enabled only for explicitly whitelisted decision classes.
- Current built-in command path is `tsx src/agent/deepseekLiveCommand.ts`.
- This is the current recommended real live path when using DeepSeek locally.

### `wildcard_live`

- Forbidden.
- The project must not treat every `:llm_required` class as live by default.

## Current Recommended Commands

General run:

```bash
npm run agent:run
```

Combat-only DeepSeek live:

```bash
npm run agent:run:deepseek-combat-live -- --max-ticks <N> --delay-ms 120
```

Explicit broad-whitelist DeepSeek live:

```bash
npm run agent:run:deepseek-broad-live -- --max-ticks <N> --delay-ms 120
```

Manual bridge run:

```bash
npm run agent:run:bridge -- --max-ticks <N> --delay-ms 120
```

## Current Broad-Whitelist Meaning

The explicit broad-whitelist runner is still not wildcard live.

It currently whitelists only:

- `combat:llm_required`
- `card_reward:llm_required`
- `map:llm_required`
- `rest:llm_required`
- `shop:llm_required`
- `event:llm_required`
- `card_select:local_recommended_llm_arbitrate`

Unlisted classes remain local or follow existing fallback routes.

## Hard Boundaries

- Live additive must stay feature-flagged.
- Selected candidates must come from allowed candidates.
- Validation and execution rules do not change by run mode.
- Live/provider paths must not write stable memory, derived knowledge, or strategy params.
- Runtime evidence and console fixtures are not stable-learning proof by themselves.
- Provider or rollout mode must not silently change decision-authority mode.
- A future delegated skill requires explicit scope, qualification, termination, invalidation, escalation, version, and rollback.
- Stable policy/skill use must be environment-compatible; a successful action alone does not prove compatibility.
