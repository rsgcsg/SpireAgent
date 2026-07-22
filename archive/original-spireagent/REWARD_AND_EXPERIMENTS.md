# Reward And Experiments

Reward is lightweight feedback, not neural reinforcement learning.

## Current Reward Behavior

`src/agent/memory.ts` retains a historical finalize path, but stable writes are blocked by default and audited as `legacy_local_learning`. This path is not P9 proposal promotion and must not be re-enabled as a shortcut.

Current P9 learning surfaces are append-only proposals, weak attribution, evidence slicing, review decisions, and bounded shadow comparison. Stable promotion remains disabled.

## Target Reward Inputs

- win/loss
- act and floor reached
- boss killed
- elites killed
- final hp
- resource use
- deck deficits
- route greed
- key decisions
- combat mistakes
- fallback/LLM issues

Failure categories:

- low_block
- low_draw
- low_energy
- low_damage
- low_scaling
- low_aoe
- deck_too_thick
- path_too_greedy
- potion_misuse
- shop_misprioritized
- bad_card_reward
- missed_lethal
- unsafe_auto_decision
- candidate_generation_miss
- combat_tempo_loss

## Strategy Update Rules

- One run can add observations or seed a draft hypothesis; it cannot establish causal truth.
- Repeated patterns may raise empirical support only within a compatible environment and after counterexample review.
- Future stable changes must be versioned, narrowly scoped, and bounded.
- Every update needs evidence, reason, timestamp, and rollback data.
- Reward never mutates raw fact data.
- Memory, derived, strategy, skill, context, classification, and budget updates must begin as proposals; confidence alone is never sufficient for stable promotion.
- Every promotion candidate needs environment scope, dependencies, invalidation triggers, authority impact, promotion criteria, and rollback.

Win/loss and floor reached are delayed, confounded outcomes. They do not prove that the final action or any single earlier decision caused the result. Attribution must remain weak and record alternative hypotheses and needed counterexamples.

## Experiment Log

Future `memory/experiments.jsonl` entries should include:

- `experimentId`
- `layer`
- `changeType`
- `reason`
- `expectedEffect`
- `risk`
- `tests`
- `rollback`
- `linkedRunIds`
- `result`
- `keepOrRollback`
- `authorityMode`
- `proposalBehaviorImpact`
- `environmentScope`
- `counterexamples`
- `invalidationTriggers`
