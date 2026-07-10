# STS2 MCP — AI Gameplay Guide

## Project Steering For Agents

Before changing this project, read:

- `docs/00_START_HERE.md`
- `PROJECT_NORTH_STAR.md`
- `PROJECT_NORTH_STAR_CHINESE.md` if Chinese context is helpful
- `PROJECT_AUTHORITY_GUIDE.md`
- `docs/phases/P8_CLOSEOUT.md`
- `docs/phases/P9_ENTRY_CRITERIA.md`
- `docs/phases/P9_GUARDED_LEARNING_PLAN.md` when working on P9-facing changes
- `docs/phases/P9_P15_EXECUTION_ROADMAP.md` for forward phase ordering
- `docs/decisions/ADR-0003-strategic-authority-and-experience-shell.md`
- `docs/decisions/ADR-0004-environment-scoped-evidence-and-knowledge.md`
- `PROJECT_PLAN.md`
- `ARCHITECTURE.md`
- `DATA_SCHEMA.md`
- `REPLAY_AND_EVAL.md`
- `LLM_HANDOFF.md`
- `CONTRIBUTING_OR_ENGINEERING_RULES.md`
- `DEBUG_REPORT.md`

This repository is intended to be pushed to GitHub and redeployed by other users. Keep docs, commands, and tests in sync with behavior.

Historical `docs/PROJECT_STEERING.md`, `docs/PROJECT_BOUNDARIES.md`, `docs/agent-system-principles.md`, and `docs/ai-agent-architecture.md` are redirect pointers only. Do not treat them as active architecture authority.

## Documentation Operating System

Treat the repository documentation as a small operating system, not as a pile of notes.

Authority order:

- `docs/00_START_HERE.md`: documentation entrypoint for humans and agents.
- `PROJECT_NORTH_STAR.md`: highest-priority long-term constitution.
- `docs/04_CURRENT_STATUS.md`: canonical current phase, blocker, and next-step snapshot.
- `docs/phases/*.md`: canonical active phase closeout, rollout policy, and next-phase plan docs.
- `docs/debt/*.md`: active debt registers and cleanup tracking.
- `docs/runbooks/*.md`: operational procedures only.
- `PROJECT_PLAN.md`: canonical long-horizon roadmap and phase book.
- `ARCHITECTURE.md`, `DATA_SCHEMA.md`, `REPLAY_AND_EVAL.md`, `BUDGET_GOVERNANCE.md`, `ENVIRONMENT_COMPATIBILITY.md`: canonical subsystem sources.
- `docs/decisions/*.md`: ADRs for durable project decisions.
- `LLM_HANDOFF.md` and `DEBUG_REPORT.md`: working handoff and historical/debug context only, not canonical project truth.

When you are changing docs, read `docs/00_START_HERE.md` first and update the canonical target instead of only editing handoff/debug notes.

Write each kind of information in the right place:

- current phase / blocker / next step: `docs/04_CURRENT_STATUS.md`
- phase closeout / next-phase implementation plan: `docs/phases/*.md`
- long-term roadmap and P1-P10 route: `PROJECT_PLAN.md`
- architecture and boundaries: `ARCHITECTURE.md`
- schemas and telemetry fields: `DATA_SCHEMA.md`
- replay/eval/review behavior: `REPLAY_AND_EVAL.md`
- durable governance decisions: `docs/decisions/*.md`
- run procedures: `docs/runbooks/*.md`
- historical findings, debug chronology, and local context: `LLM_HANDOFF.md` / `DEBUG_REPORT.md`

Do not let README, handoff notes, or debug logs become the only source of truth for current status or future plan.

End-of-task documentation checklist:

- update the canonical doc for any behavior or policy that changed
- update `docs/04_CURRENT_STATUS.md` if current blocker, phase, or next step changed
- add or update an ADR when the rule is durable and cross-cutting
- add a short pointer in `LLM_HANDOFF.md` or `DEBUG_REPORT.md` only when historical context helps
- keep redirects and archive material non-authoritative
- push stale or low-priority docs toward `docs/archive/legacy/` and leave redirect stubs when path stability matters
- keep docs synchronized with tests and commands

`PROJECT_NORTH_STAR.md` is the highest-priority long-term constitution. The project is not trying to build the strongest arbitrary algorithmic bot; it is trying to maximize an LLM strategic player's game ability through a predictive cognitive scaffold.

The target architecture is:

```text
raw game state
  -> canonical state
  -> Strategic Impression / Salience
  -> Memory Activation
  -> Candidate Futures
  -> Deliberation Packet
  -> LLM strategic decision
  -> validated safe execution
  -> transition recording
  -> replay / evaluation / review
  -> prediction-error-driven learning
```

Keep these boundaries intact:

- The LLM is the core strategic player; local scaffold must not quietly replace it.
- The main product is LLM-centered, not LLM-exclusive. Provider mode, rollout mode, learning mode, and decision-authority mode are independent.
- Capability, confidence, execution permission, and strategic authority are not interchangeable. Local skills require explicit scope, qualification, termination, escalation, versioning, and rollback.
- Local code should shape the decision problem through salience, candidate futures, validation, and replayable evidence.
- Prompt context should be compact but strategically complete, never a raw state dump.
- Facts, observations, inference, memory, derived knowledge, LLM reflection, and prediction errors must stay separable.
- Transition recording is the foundation for replay, eval, and learning.
- Memory and strategy updates require evidence, conditions, confidence, and rollback.
- External game projects are adapters, not architecture core. Mods are sensors/actuators, not the brain.
- Promotion-grade evidence and learned objects must be environment-scoped. Unknown or incompatible game/mod/adapter evidence cannot silently support stable promotion.

The formal mainline now runs through Phase 15: P9 Trustworthy Change Kernel; P10 Repeatable Experience Learning; P11 Learned Deliberation OS; P12 Environment Compatibility and Revalidation; P13 Player Runtime Beta; P14 Delegated Skills and Authority Qualification; P15 Product Release and Operations. Optional local-autonomy work is isolated research track R1, not a phase. Current P9.5D/P9.5E work maps to P9-G2; do not design P9-G3 stable change before authority, environment, paired-evidence, and counterexample integrity pass.

## Live Testing Policy

When testing in a real game, normal HP loss is not a stop condition. Do not pause a live run just because the agent took damage, made a debatable card pick, or chose an imperfect route.

Stop and patch mid-run only for clear program/design bugs:

- invalid MCP/REST action
- no candidates on an actionable screen
- unknown screen that blocks progress
- repeated same action without progress
- stale card index or illegal target
- settlement/polling loop
- crash/type error
- invalid LLM output escaping validation

Strategy quality issues should usually be logged, collected, reviewed, and fixed after the run or at a natural room/node boundary.

## MCP Tool Calling Tips

### State Polling
- After `combat_end_turn`, the state may show `is_play_phase: false` or `turn: enemy`. Call `get_game_state` again to advance to the next player turn.
- Sometimes you need to call `get_game_state` twice — once to see enemy turn results, once to see your new hand.
- Use `format: "json"` during combat for structured data; `format: "markdown"` for map/event overview.

### Card Index Shifting
- **CRITICAL**: Playing a card removes it from hand and shifts all indices. Play cards from RIGHT to LEFT (highest index first) to keep lower indices stable, or re-check state between plays.
- When targeting, always provide `target` for single-target cards. Entity IDs are UPPER_SNAKE_CASE with a `_0` suffix (e.g. `KIN_PRIEST_0`).

### Event & Reward Flow
- Events: `event_choose_option`. After choosing, there's often a "Proceed" option at index 0.
- Rest sites: `rest_choose_option`, then `proceed_to_map`.
- Rewards: claim from right-to-left (highest index first) to avoid index shifting. Card rewards open a sub-screen; use `rewards_pick_card` or `rewards_skip_card`.

### Potions
- `use_potion(slot=N)` — slot is the potion slot index, not a card index.
- `discard_potion(slot=N)` — discard a potion to free up the slot when full.
- Potions don't cost energy or count as card plays. Use buff potions BEFORE playing cards.

---

## General Strategy

### Core Principles
1. **HP is a resource, not a score.** Take calculated damage to deal more. Don't waste energy on block when enemies aren't attacking.
2. **Deck quality > deck size.** Skip card rewards if nothing synergizes. A lean deck draws key cards more often.
3. **Front-load damage.** Killing enemies faster means less total damage taken.
4. **Read intents carefully.** Sleep/Buff = go all-out offense. Attack = balance block and damage. Debuff = usually no damage, offense turn.

### Combat Sequencing (General)
1. Play 0-cost utility/setup cards first.
2. Play skills before attacks when possible — many mechanics reward this order (e.g. Slow debuff on enemies stacks per card played).
3. Play biggest attacks last to benefit from accumulated buffs/debuffs.
4. Check enemy HP — if you can kill this turn, skip blocking entirely.

### Map Pathing
- **Elites** give relics — fight them when healthy (>70% HP).
- **Rest before Boss** — heal if below 80% HP. Boss fights are long and punishing.
- **Unknown nodes** are safer than Elites. Good at medium HP.
- **Shops** — visit with 100+ gold.
- **Deck quality matters more than quantity** — don't add cards just because they're offered.

### Boss Fights
- **Kill the leader, not the minions.** Enemies with "Minion" power flee when their leader dies.
- Use potions aggressively in boss fights — they don't carry between acts.
- Boss fights are wars of attrition. The longer they go, the more enemies scale with Strength buffs.

### Potion Usage
- Don't hoard potions. Dying with full potions is the worst outcome.
- Use permanent-value potions (Fruit Juice = +5 Max HP) early in any combat.
- Use buff potions (Flex Potion) on turns with multiple attacks.

### Common Mistakes
- Blocking when enemies are sleeping/buffing — waste of energy.
- Not checking card indices after playing — indices shift left.
- Taking too long to kill bosses — enemies scale every turn.
- Adding mediocre cards that dilute the deck before boss fights.
