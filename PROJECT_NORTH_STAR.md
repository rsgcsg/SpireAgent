# PROJECT_NORTH_STAR.md

> This is the long-term constitution of the Slay the Spire 2 AI agent project. It should change rarely. It intentionally avoids temporary implementation details, current run state, exact command output, short-term milestones, and project-local accidents. Operational plans, schemas, commands, adapters, and implementation status belong in the project plan, architecture, data schema, handoff, and engineering documents.

---

## 1. North Star

The project exists to build a high-performing Slay the Spire 2 agent that can play the real local game quickly, safely, observably, and with improving strategic judgment.

The agent is **LLM-first**, but not LLM-only. The LLM is the strategic player: it handles judgment, tradeoffs, long-term planning, uncertain choices, and reflective improvement. The local system is the scaffold: it reads state, normalizes state, computes deterministic facts, generates candidates, compresses context, executes actions, records outcomes, and supports learning.

The goal is not to build a rigid rules bot. The goal is also not to dump raw game state into an LLM every tick. The goal is a layered agent where the LLM sees the right decision at the right abstraction level.

The enduring success criteria are:

- **Play quality:** the agent makes increasingly strong strategic decisions.
- **Speed:** obvious or low-dispute situations are handled locally without unnecessary LLM calls.
- **Reliability:** every executed action is legal, grounded in current state, and recoverable after uncertainty.
- **Observability:** decisions are recorded as state/action/result transitions that can be replayed and evaluated.
- **Learning:** run outcomes conservatively update structured memory, derived knowledge, reward records, and strategy parameters.
- **Maintainability:** the project remains understandable to humans and future coding agents.

---

## 2. Permanent Product Principle

The product is not a single controller file, a prompt, a collection of heuristics, or a mod. It is an **agent system** made of cooperating layers.

The durable mental model is:

```text
Game integration
  -> canonical state
  -> deterministic mechanics
  -> facts + derived knowledge + memory
  -> candidate generation and planning
  -> local/LLM decision routing
  -> validated execution
  -> transition recording
  -> replay/eval/review
  -> conservative learning
```

Every future feature should strengthen this loop. Features that bypass it, obscure it, or make it harder to audit should be rejected or isolated.

---

## 3. Roles of LLM and Local Scaffold

### 3.1 The LLM is the strategic player

The LLM should decide when the situation involves genuine strategic tradeoffs, including:

- meaningful card rewards;
- route decisions with health, elite, shop, rest, and boss implications;
- shop purchases and removals;
- event choices with long-term cost;
- rest-site tradeoffs;
- complex combat plans;
- potion/resource usage under uncertainty;
- life-or-death turns;
- post-run reflection;
- controlled improvement proposals.

The LLM must output short, structured decisions. It should select from validated candidates or plans. It should not directly call the game interface, invent actions, or rely on raw state dumps.

### 3.2 The local scaffold makes the LLM effective

The local system should handle:

- game I/O;
- state normalization;
- legality and affordability checks;
- deterministic mechanics and estimates;
- candidate generation;
- local scoring and risk estimation;
- decision routing;
- prompt/context compression;
- LLM output validation;
- action execution;
- checkpoint detection;
- data recording;
- replay/eval/review;
- memory and derived retrieval;
- conservative learning updates.

The scaffold should not become a brittle strategy script that silently replaces the LLM on important strategic choices. It should reduce noise, not remove judgment.

---

## 4. Layering Doctrine

The project should preserve a clean dependency direction. Lower layers may not depend on higher layers.

### 4.1 Game Integration Plane

This plane talks to the game or mod layer.

It may:

- read raw game state;
- execute actions;
- expose action results;
- read event logs if available;
- report adapter capabilities;
- handle connection and settlement behavior.

It must not:

- contain strategy;
- call LLMs;
- mutate memory or derived knowledge;
- decide card rewards, routes, shops, or combat strategy;
- expose raw external formats directly to the agent core.

External game projects are adapters, not architecture.

### 4.2 Canonical State and Mechanics Plane

This plane converts unstable external state into stable internal state and performs deterministic reasoning.

It may:

- normalize raw state;
- define canonical state, action, event, and transition schemas;
- validate legality, energy, targets, affordability, and screen options;
- estimate damage, block, lethal, incoming damage, and simple risks;
- compute state diffs and checkpoint classifications;
- query objective facts.

It must not:

- call LLMs;
- use long-term memory as a source of mechanical truth;
- store learned strategy inside raw fact data;
- hide uncertainty behind overconfident estimates.

### 4.3 Planning and Decision Plane

This plane turns state into candidate decisions.

It may:

- generate candidate actions and candidate plans;
- score candidates;
- classify low-dispute versus strategic decisions;
- construct compact decision contexts;
- call the LLM when useful;
- validate LLM output;
- choose fallback actions when LLM is unavailable or invalid.

It must not:

- execute arbitrary LLM-invented actions;
- let the LLM bypass candidate validation;
- expand real-time prompts into full histories or raw dumps.

### 4.4 Execution Plane

This plane safely applies selected decisions to the real game.

It may:

- execute one or more planned actions;
- re-read state after action;
- detect hard checkpoints;
- stop, continue, or replan;
- record execution results.

It must not:

- assume multi-action plans remain valid after draw, generation, target death, screen change, or unexpected state change;
- rely on stale card indices;
- continue after a hard checkpoint without re-reading state.

### 4.5 Data, Memory, and Learning Plane

This plane records what happened and improves future decisions.

It may:

- record snapshots, events, transitions, decisions, checkpoints, and replay frames;
- maintain run memory;
- retrieve long-term memory;
- retrieve derived knowledge;
- score runs with lightweight reward;
- propose conservative updates;
- maintain experiment logs and rollback paths.

It must not:

- mutate objective fact data with learned beliefs;
- treat one run as definitive proof;
- update strategy in ways that cannot be explained or rolled back;
- treat ambiguous human inference as ground truth.

---

## 5. External Dependency Doctrine

External projects and services provide capabilities. They do not define the agent core.

Every external dependency must be isolated behind an adapter with explicit capabilities, tests, and replacement paths. The rest of the project should depend on stable internal interfaces, not on raw external formats.

For each external dependency, the project should know:

- what it can reliably do;
- what it cannot reliably do;
- what is unknown;
- what license or maintenance risk exists;
- how the dependency can be replaced;
- which fallback is used when a capability is missing.

Do not assume an external project provides a capability merely because it would be useful. Capabilities must be detected, documented, and tested.

---

## 6. Mod Boundary Doctrine

Some capabilities belong in a game-side mod. Most agent intelligence does not.

### 6.1 Appropriate mod responsibilities

A mod or mod patch may provide:

- raw game state;
- action execution;
- action results;
- legal-action exposure or raw actionable state;
- game event logs;
- human UI/action event capture;
- card instance IDs, target IDs, option IDs, and screen identity;
- pre/post state references or hashes.

### 6.2 Inappropriate mod responsibilities

A mod should not contain:

- LLM calls;
- prompts;
- API keys;
- long-term memory;
- derived strategy knowledge;
- reward logic;
- experiment management;
- route/shop/card/combat planning;
- post-run review;
- vector databases;
- training-data export logic.

The mod should be a sensor and actuator. The local agent system should be the brain and learning loop.

---

## 7. Data Truth Doctrine

The project must distinguish truth, observation, inference, and opinion.

### 7.1 Objective facts

Objective facts include card names, costs, rarity, descriptions, relic effects, keywords, characters, potions, enemies, and game text. They belong in the fact layer.

Learned beliefs must not be written into the raw fact layer.

### 7.2 Derived knowledge

Derived knowledge says when facts matter. It may include tags, synergies, anti-synergies, pick conditions, avoid conditions, route preferences, enemy risk notes, and strategy claims.

Derived knowledge should include evidence, confidence, source, conditions, and rollback information.

### 7.3 Memory

Memory stores run-specific state and cross-run lessons. It should be structured, searchable, compressible, and reversible.

Memory is not a raw log dump. It must influence decisions, but only relevant subsets should enter real-time prompts.

### 7.4 Transition data

A decision should eventually be recorded as a transition:

```text
preState -> selectedAction -> postState -> stateDiff -> audit metadata
```

Transitions are the foundation for replay, eval, review, reward, and future learning.

### 7.5 Ground truth rules

Agent actions sent through the executor can be ground truth for the selected action.

Mod/MCP event actions can be ground truth only when the event contains enough identity and timing information.

Human diff inference is never ground truth. It may be useful for review, fixture construction, and exploratory analysis, but it must carry confidence, uncertainty, candidate actions, and inference reasons.

Snapshot-only records are observations, not actions.

---

## 8. Human Data Capture Doctrine

Human play data is valuable only if its reliability is explicit.

The correct long-term design is two-layer capture:

```text
Game-side event log mod
  captures real human/game events
Local HumanPlayRecorder
  joins events with pre/post state and writes transitions
```

If event logs are unavailable, the system may use snapshot polling and state-diff inference, but it must mark the result as inferred and not ground truth.

The project should never silently convert ambiguous human state changes into high-confidence labels.

---

## 9. Combat Doctrine

Combat should be fast, but not reckless.

The long-term combat model is segmented planning with checkpoints:

```text
candidate combat plans
  -> execute safe initial segment
  -> re-read state
  -> classify checkpoint
  -> continue, replan, or ask LLM
```

The system should not ask the LLM for every card in ordinary combat. It should also not blindly execute a long fixed chain in a game where drawing, generating, discovering, enemy death, relic triggers, energy changes, target changes, and screen changes can invalidate the plan.

Hard checkpoints require re-reading state and reconsidering the plan.

Index safety is permanent: card and reward indices can shift after actions. The executor must avoid stale indices.

---

## 10. Prompt Doctrine

Real-time prompts are a scarce resource. They should be short, structured, and decision-specific.

Prompts should include:

- current screen and compact state;
- relevant health, floor, gold, energy, hand, options, enemies, and risks;
- top candidates or plans;
- local scores and uncertainty;
- run memory summary;
- a small set of relevant long-term memories;
- a small set of relevant derived knowledge;
- strict JSON output schema.

Prompts should not include:

- full raw state;
- full fact database;
- all memory;
- all history;
- unbounded reflection;
- unrelated lessons.

The LLM must return structured output. Invalid, unavailable, or unsafe LLM output must be rejected and handled by fallback.

---

## 11. Learning Doctrine

The system should improve conservatively.

Learning should happen through:

- transition recording;
- replay and review;
- lightweight reward;
- structured run memory updates;
- long-term lessons with evidence;
- derived knowledge proposals;
- small bounded strategy parameter changes;
- experiment logs;
- rollback paths.

The project should avoid overfitting to one run. Repeated patterns should raise confidence. One surprising result should usually create a low-confidence observation, not a permanent rule.

Learning must be auditable. If the system cannot explain why a strategy changed, the update is not acceptable.

---

## 12. Engineering Doctrine

The agent is a long-lived software system. It must remain maintainable.

Permanent engineering rules:

- Keep responsibilities separated.
- Keep external dependencies behind adapters.
- Keep schemas versioned.
- Keep prompts centralized and validated.
- Keep data formats durable.
- Keep replay/eval possible.
- Keep bottom-layer mechanics tested.
- Keep live-run strategy issues separate from program defects.
- Keep documentation aligned with behavior.
- Keep patch risk, tests, and rollback explicit.

A change is not mature until it is observable. A strategy improvement that cannot be replayed, measured, or reverted is not trustworthy.

---

## 13. What Must Never Be Optimized Away

Future changes must not remove or weaken these principles:

1. **LLM-first strategic control.** The scaffold supports the LLM; it does not silently replace strategic judgment with brittle rules.
2. **Validated candidates.** The LLM chooses among legal candidates/plans; it does not directly operate the game.
3. **Adapter isolation.** External projects are capabilities behind adapters, not architecture.
4. **Fact/derived/memory separation.** Objective facts, learned strategy, and run memory remain distinct.
5. **Ground-truth discipline.** Inferred human data is never treated as exact action truth.
6. **Transition recording.** The system must move toward preState/action/postState records for replay and learning.
7. **Checkpoint safety.** Execution must re-read state after meaningful uncertainty.
8. **Short real-time prompts.** The LLM receives compressed context, not dumps.
9. **Conservative learning.** Strategy changes require evidence, confidence, and rollback.
10. **Maintainability.** The project should become easier to understand as it grows, not harder.

---

## 14. What Counts as Progress

Progress is not measured by the number of heuristics, documents, or prompts added. Progress is measured by improvements to the agent loop.

Good progress includes:

- more complete and stable canonical state;
- better candidate generation;
- safer execution;
- fewer unnecessary LLM calls;
- better LLM context;
- stronger transition records;
- more useful replay/eval;
- clearer memory retrieval;
- derived knowledge with evidence;
- conservative reward updates;
- fewer repeated failures;
- cleaner module boundaries;
- more tests from real failures.

Bad progress includes:

- adding strategy rules that bypass the architecture;
- increasing prompt size instead of improving context selection;
- mixing facts, memory, and derived claims;
- relying on untested external fields;
- treating ambiguous inferred data as labels;
- changing bottom-layer mechanics without tests;
- adding documents that repeat existing documents without becoming source of truth;
- making the controller more central and less modular.

---

## 15. Conflict Resolution

When goals conflict, prefer this order:

1. **Safety and legality of real game actions.**
2. **Correctness of state and data truth.**
3. **Observability and replayability.**
4. **Strategic play quality.**
5. **Speed and token efficiency.**
6. **Learning and adaptation.**
7. **Convenience and short-term implementation speed.**

A faster agent that cannot be audited is worse than a slower agent that can improve. A clever strategy that corrupts data truth is worse than a conservative strategy that records uncertainty.

---

## 16. Permanent Instruction for Future Agents

Before making structural changes, future coding agents should internalize this document and then inspect the current project state. They should not assume that implementation details from old handoff or debug documents remain current.

Every substantial change should answer:

```text
Which layer does this belong to?
Does it preserve LLM-first strategic control?
Does it keep external dependencies behind adapters?
Does it preserve fact/derived/memory separation?
Does it improve or preserve transition recording and replay?
Does it make human-data reliability explicit?
Does it keep prompts compact and structured?
Does it include tests or fixtures for changed bottom-layer behavior?
Can it be rolled back?
```

If the answer is unclear, the change should be redesigned before implementation.

---

## 17. Enduring One-Sentence Summary

Build a real-game Slay the Spire 2 agent where the LLM makes strategic choices from compact, validated candidates, while a layered local system handles state, mechanics, execution, recording, replay, memory, derived knowledge, reward, and safe long-term improvement.
