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

For example, `deepseek_explicit_whitelist_live` says which provider path and rollout gate were used. It does not give DeepSeek authority to write memory, approve learning, change budgets, or bypass validation. Product authority mode is `unknown` unless explicitly supplied as `STS2_DECISION_AUTHORITY_MODE`; it must never be inferred from a provider or whitelist.

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

## P9-G2 Evidence Capture

New transitions record an audit-only authority chain and environment scope. This does not alter live decisions or enable promotion.

For an organic, promotion-comparable shadow or live window, set only verified values in the temporary process environment:

```bash
STS2_DECISION_AUTHORITY_MODE=llm_primary \
STS2_EVIDENCE_PROVENANCE=organic \
STS2_GAME_BUILD=<verified-game-build> \
STS2_GAME_RELEASE_CHANNEL=<main-or-beta> \
STS2_CONTENT_MANIFEST_HASH=<verified-content-manifest> \
STS2_MODS_JSON='[]' \
STS2_ADAPTER_VERSION=<verified-adapter-version> \
STS2_FACT_SNAPSHOT_VERSION=<verified-fact-snapshot> \
STS2_AGENT_REVISION=<verified-agent-revision> \
npm run agent:run:deepseek-combat-live -- --max-ticks <N>
```

If console commands, fixtures, or debug state were used, replace `STS2_EVIDENCE_PROVENANCE=organic` with `STS2_EVIDENCE_PROVENANCE=console_debug`. Do not invent missing hashes or versions. Unknown/partial scope remains readable but cannot satisfy a future stable-promotion slice.

Use exported process variables or a safe parser for temporary evidence settings. Do **not** shell-source `.env.local`: it is parsed as data by the agent and may contain command-style values that are not valid shell syntax. Confirm the actual flags are `STS2_P8_WORKSPACE_SHADOW=1`, `STS2_P8_WORKSPACE_CALL=1`, and `STS2_P8_LIVE_ADDITIVE=0` for a shadow-only window.

For a controlled direct-workspace shadow capture while local `.env.local` keeps additive live enabled, explicitly disable the legacy command in the child process and set one fixed shadow-call budget. This does not edit `.env.local` and must not be used as a live command:

```bash
env \
  STS2_LLM_COMMAND='' \
  STS2_P8_LIVE_ADDITIVE=0 \
  STS2_P8_WORKSPACE_SHADOW=1 \
  STS2_P8_WORKSPACE_CALL=1 \
  STS2_P8_WORKSPACE_MAX_SHADOW_CALLS=3 \
  STS2_P8_WORKSPACE_ABLATION_MODE=full_bounded_candidate_futures \
  STS2_DECISION_AUTHORITY_MODE=llm_primary \
  STS2_EVIDENCE_PROVENANCE=organic \
  <verified-environment-fingerprint-vars> \
  npm run agent:run -- --max-ticks <N> --delay-ms 220
```

`STS2_LLM_COMMAND=''` makes the legacy execution decider unavailable in that child so it cannot accidentally invoke the configured live adapter. The P8 workspace provider can still make explicitly budgeted shadow calls through its direct provider path; executed strategic routes may therefore use the existing local fallback. This is intentional evidence capture, not an LLM-live window. A run with a different `maxShadowCalls` is a different budget slice and cannot be mixed into a future paired comparison.

For one declared G2 evidence class, reserve the provider-call budget without changing routing or live authorization:

```bash
STS2_P8_WORKSPACE_SHADOW_DECISION_CLASSES=rest:llm_required
```

This shadow-only filter skips direct workspace calls for other classes with `shadow_capture_class_not_selected`; it does not alter candidate generation, local fallback, validation, execution, or the live whitelist. The capture scope is included in the recorded budget window, so focused evidence inspection must use `capture=rest:llm_required`, not `capture=all`.

Do not create a presentation-only overlay merely because a lexical smoke detector fired once. For example, a reason that states both immediate block value and deck-bloat cost can still be mislabeled `missing_tradeoff`; preserve it as a counterexample until repeated scoped evidence and review justify a proposal.

Inspect a fixed-profile capture without letting the surrounding run's historical or budget-mixed transitions define the result:

```bash
npm run data:replay -- evidence --run-id <runId> \
  --decision-class <class> \
  --revision-tag <revision> \
  --budget-window 'shadow=3;profile=shadow_exploration' \
  --environment-fingerprint <fingerprint-hash> \
  --authority-mode llm_primary \
  --capture-provenance organic \
  --shadow-called true
```

The resulting focused slice is an inspection aid. It does not approve a proposal, relax counterexample review, or enable promotion.

For an already inspected, same-slice cloned-packet pair, `npm run learning:proposals -- shadow-run ... --record-manifest` appends an audit-only manifest to that run. Omit `--record-manifest` by default. The manifest never approves, applies, or promotes a proposal.

Run `npm run learning:proposals -- shadow-preflight --run-id <runId> --id <proposalId> --transition-id <transitionId>` before a G2 provider call. A failed preflight is expected for historical records without explicit authority or complete organic environment scope; do not bypass it by inventing identity values.

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
