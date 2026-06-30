# Reward And Experiments

Reward is lightweight feedback, not neural reinforcement learning.

## Current Reward Behavior

`src/agent/memory.ts` finalizes a run, scores it, records long-term run summaries, updates lessons, and applies bounded strategy weight updates.

This is useful but should be made more observable and reversible.

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

- One run can add observations.
- Repeated patterns raise confidence.
- Weight changes must be small and bounded.
- Every update needs evidence, reason, timestamp, and rollback data.
- Reward never mutates raw fact data.
- Derived updates should be proposals unless confidence and evidence are sufficient.

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
