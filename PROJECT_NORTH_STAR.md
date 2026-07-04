# PROJECT_NORTH_STAR.md

> This is the long-term North Star document for the Slay the Spire 2 AI agent project.
> It defines the project’s core philosophy, product direction, agent architecture, cognitive scaffold, learning doctrine, engineering boundaries, and enduring success criteria.
> It should change rarely.
> It should not contain temporary implementation details, current runtime status, exact command output, short-term milestones, debug accidents, or one-off development plans.
> Operational plans, schemas, commands, adapters, implementation status, experiment results, debug notes, and short-term tasks belong in project plans, architecture documents, schema documents, handoff documents, and engineering notes.

---

## 1. North Star

The purpose of this project is to build a real-game Slay the Spire 2 agent where the LLM remains the core strategic player, while the local system acts as a predictive cognitive scaffold that maximizes what the LLM can perceive, remember, imagine, evaluate, execute, review, and learn.

This project is not trying to build the strongest possible AI under any arbitrary architecture.

It is trying to build:

```text
the strongest possible LLM-centered strategic player,
given that the LLM remains the core decision-maker,
and the surrounding scaffold exists to unlock the LLM’s potential.
```

The project should not degrade into a rules bot.
It should not hide the real player behind a hand-written strategy engine.
It should not let a black-box solver silently replace the LLM on important strategic decisions.
It should also not dump raw game state into the LLM every tick and hope intelligence emerges.

The real goal is:

```text
Help the LLM see what a strong player would notice,
imagine the futures a strong player would consider,
remember the experiences that should change future judgment,
deliberate over validated candidate futures,
and improve how it sees, imagines, judges, and acts through prediction error.
```

The core loop of the project is:

```text
real game environment
  -> canonical state
  -> strategic impression / salience compression
  -> memory activation
  -> candidate future prediction
  -> LLM strategic deliberation
  -> validated safe execution
  -> transition recording
  -> replay / evaluation / review
  -> prediction-error attribution
  -> controlled improvement of memory, candidate generation, context compression, and strategic judgment
```

The central long-term question is:

```text
Can an LLM begin with little game-specific experience,
play the real game through a structured scaffold,
observe outcomes,
turn experience into memory, derived knowledge, candidate templates, and strategic abstractions,
improve how it forms first impressions, activates experience, imagines futures, and evaluates risk,
and progressively approach the strongest level of play it is capable of?
```

The enduring success criteria are:

* **LLM potential:** the scaffold increases the LLM’s effective strategic ability instead of making the LLM irrelevant.
* **Strategic impressions:** the LLM sees increasingly strong, decision-relevant interpretations of the game state rather than raw state dumps.
* **Candidate futures:** candidate generation increasingly predicts the benefit, cost, risk, uncertainty, and invalidation conditions of possible plans.
* **Memory quality:** memory becomes conditional, evidence-linked, confidence-aware, and useful for future prediction rather than becoming an unstructured log.
* **Strategic quality:** the agent makes stronger decisions in combat, rewards, routes, shops, events, rest sites, potions, resources, and long-term deck development.
* **Learning loop integrity:** repeated play improves context compression, memory retrieval, candidate generation, prediction quality, LLM deliberation, and future decisions.
* **Reliable execution:** every executed action is legal, grounded in current state, and recoverable after meaningful uncertainty.
* **Observability and replayability:** decisions are recorded as replayable and evaluable transitions containing state, prediction, action, result, and error attribution.
* **Maintainability:** the project becomes clearer as it grows, not more like an unauditable pile of prompts, heuristics, rules, and logs.

---

## 2. Project Identity

This project is not a prompt.
It is not a single controller.
It is not a mod.
It is not a static strategy script.
It is not a collection of heuristics.
It is not an automation wrapper that makes the LLM take blame for bad scaffolding.
It is not a traditional solver with an LLM interface attached to it.

It is an **LLM-centered predictive cognitive scaffold**.

Its core identity is not:

```text
the local system plays the game for the LLM
```

but rather:

```text
the local system shapes the problem that the LLM sees
```

The local system should help the LLM do four things:

```text
See:
  transform raw state into strategic first impressions.

Remember:
  activate experience, lessons, conditions, and patterns that are truly relevant.

Imagine:
  generate validated candidate futures, not merely clickable actions.

Deliberate:
  let the LLM reason within a compact but strategically complete context.
```

The durable product loop is:

```text
Game integration
  -> canonical state
  -> mechanics and facts
  -> strategic impression
  -> memory activation
  -> candidate futures
  -> deliberation packet
  -> LLM-centered decision
  -> validated execution
  -> transition recording
  -> replay / eval / review
  -> prediction-error-driven learning
```

Every future feature should strengthen this loop.

Any feature that bypasses this loop, obscures it, silently replaces LLM strategic judgment, corrupts data truth, or makes failure harder to attribute should be rejected, isolated, or explicitly marked as an experimental baseline.

---

## 3. Core Cognitive Inspiration

This project may borrow ideas from cognitive science, neuroscience, reinforcement learning, and LLM-agent research, but these ideas are engineering inspirations, not biological claims.

The project does not claim that:

* an LLM is a human brain;
* a prompt is consciousness;
* a vector database is a hippocampus;
* a candidate generator is literally human imagination;
* context compression is literally biological perception;
* the agent replicates human cognition.

The value of these analogies is that they help the project ask better engineering questions:

```text
What should the agent notice first?
Which memories should this situation activate?
Which possible futures should be generated?
What are the benefits, costs, risks, and uncertainties of those futures?
What should enter the LLM’s deliberation context?
What did the system predict?
What actually happened?
Which module should change after the prediction error?
How should the agent see, remember, imagine, and choose better next time?
```

Therefore, every cognitive metaphor must eventually become one or more of the following:

* an inspectable software object;
* a durable data structure;
* a replayable transition;
* a testable behavior;
* a reversible update;
* an evaluable improvement.

If a metaphor cannot help implementation, diagnosis, or evaluation, it should remain background philosophy rather than architectural burden.

---

## 4. First Impression Doctrine: Context Compression as Strategic Perception

Context compression is not ordinary summarization.

Its purpose is not merely to reduce token count.
Its purpose is not merely to shorten the state.
Its purpose is not to hide complexity.

Its purpose is to transform raw game state into a first impression that the LLM can use for strategic thought.

A weak compressor says:

```text
Give the LLM less information.
```

A strong compressor says:

```text
Give the LLM the right abstraction.
```

In this project, context compression should produce a **Strategic Impression**.

A Strategic Impression should answer:

```text
What does this situation look like at first glance?
Is this an ordinary decision or a key decision?
Where is the danger?
Where is the opportunity?
Where is the uncertainty?
What is wrong with the deck?
What is wrong with the route?
What is the resource pressure?
Which past situation does this resemble?
Does this require LLM deliberation?
```

For example, the raw state may say:

```text
The enemy attacks for 18.
The player has 42 HP.
The hand contains cards A/B/C/D.
The player has one potion.
The next floor may be an elite.
```

A Strategic Impression should not merely repeat those fields. It should become:

```text
This is a potential resource tradeoff turn.
The turn can be defended with low damage taken, but using the potion may end the fight immediately.
The potion may be more valuable for the next elite.
The deck has low defensive density, which is not only a single-turn problem but a structural risk.
Similar low-defense situations in past runs were lost after over-prioritizing damage before an elite.
```

This is the kind of situation representation the LLM needs.

A short prompt that omits the decisive feature is worse than a longer prompt that preserves the real strategic problem.

---

## 5. Salience Doctrine: Not All Information Deserves Conscious Attention

The agent should not treat every state field as equally important.

Strong players do not merely see more raw fields.
They notice the important ones faster.

The system therefore needs salience judgment.

Salience may come from:

```text
Danger:
  current death risk, next-turn death risk, low health, unavoidable damage.

Value swing:
  choices that may significantly change future win probability,
  such as key relics, key removals, key scaling, or key defensive fixes.

Novelty:
  unusual relic combinations, strange deck direction, rare events, unusual route structure, or abnormal enemy pressure.

Uncertainty:
  unclear candidate ranking, conflicting estimates, unstable future risk, or missing information.

Memory resonance:
  similarity to past wins, losses, mistakes, warnings, or successful lines.

Irreversibility:
  route locks, missed shops, skipped key cards, lost potions, missed removals, or other choices that are difficult to undo.

Repeated failure pattern:
  situations where the system has made similar mistakes before.
```

Salience is an engineering signal, not a biological formula.

It should influence:

* what enters the Strategic Impression;
* what triggers memory retrieval;
* what enters the LLM’s deliberation packet;
* which transitions deserve replay;
* which errors should become long-term learning;
* which candidate futures must be generated.

---

## 6. Memory Doctrine: Memory as Material for Future Prediction

Memory is not a log warehouse.

Memory is not “store everything that happened.”
Memory is not “put every post-run summary into the prompt.”
Memory is not better simply because there is more of it.

The core value of memory is:

```text
help the system predict the future better
```

Good memory should change the next Strategic Impression, the next set of candidate futures, and the next LLM judgment.

When the system sees the current situation, memory should help answer:

```text
Which past situations does this resemble?
What happened after similar situations?
Which early signs predicted success or failure?
Which candidate was missing last time?
What did the prompt omit last time?
Where did the LLM judgment fail last time?
Are we repeating the same mistake?
```

Memory should support at least four roles:

```text
Episodic memory:
  concrete runs, fights, choices, outcomes, and transitions.

Semantic memory:
  abstract lessons, such as “this archetype has high Act 2 risk when it lacks AoE.”

Procedural memory:
  reusable decision procedures, such as “route-risk evaluation before taking an elite at low HP.”

Salience memory:
  high-danger, high-value, high-surprise, high-error, repeated-failure, or unusually successful situations.
```

Memory must carry conditions.

A lesson should not simply say:

```text
Do not skip cards.
```

It should say:

```text
In this deck type, at this stage, under this boss pressure,
with this deck thickness and resource state,
skipping this class of fixing card may increase future risk.

What runs support this?
What are the counterexamples?
What is the confidence?
When does this not apply?
```

Unconditioned memory becomes superstition.

Memory should have:

* source;
* evidence;
* confidence;
* applicable conditions;
* known counterexamples;
* decay behavior;
* contradiction handling;
* rollback path.

Memory should influence:

* Strategic Impressions;
* candidate future generation;
* candidate ranking;
* LLM deliberation;
* replay focus;
* derived knowledge proposals.

Memory must not pollute the fact layer.
Memory must not pretend to be objective truth.
Memory must not enter real-time prompts unconditionally.
Memory must not become stable strategy merely because it sounds plausible.

---

## 7. Candidate Future Doctrine: Candidate Generation as Future Prediction

The candidate generator is not a legal-action enumerator.

A legal action answers:

```text
What can be done now?
```

A candidate future answers:

```text
What may happen if this plan is chosen?
```

In this project, candidate generation should evolve from “action lists” into “candidate future generation.”

A Candidate Future should include:

```text
Plan:
  what the agent intends to do.

Predicted outcome:
  what may be gained.

Cost:
  what may be lost.

Risk:
  how the plan may become bad.

Uncertainty:
  which estimates are unstable.

Assumptions:
  what the prediction depends on.

Memory links:
  which past experiences support or warn against this future.

Invalidation triggers:
  when draw, generation, enemy death, relic triggers, target changes, screen changes, or other events invalidate the plan.

Execution requirements:
  how the plan can be converted into safe, legal, state-grounded actions.
```

A mature candidate future is not:

```text
Candidate A: play Strike.
Candidate B: play Defend.
Candidate C: end turn.
```

It is closer to:

```text
Candidate A: Conservative survival line
  Take low damage this turn and preserve the potion.
  Cost: the fight may continue and next turn still has kill pressure.
  Best when HP is low, the next floor may be an elite, and potion value is high.

Candidate B: Potion lethal line
  End the fight immediately and avoid future draw risk.
  Cost: lose a potion that may be valuable for the next elite.
  Best when current HP is very low or next-turn death risk is high.

Candidate C: Greedy damage line
  Push enemy HP lower while preserving some resources.
  Risk: if next turn draws poorly, damage taken may increase significantly.
```

Candidate generation should operate at multiple levels:

```text
Level 1: Legal action candidates
  What can be done now.

Level 2: Tactical plan candidates
  How to play the next few steps in the current fight.

Level 3: Strategic future candidates
  How this choice affects deck direction, route risk, resources, boss preparation, shops, and future survival.
```

If candidate generation is shallow, the LLM’s ceiling becomes candidate coverage rather than LLM strategic ability.

Therefore, the candidate generator is part of the learning system.

After failure, the project should not only ask:

```text
Why did the LLM choose wrong?
```

It should also ask:

```text
Did we show the LLM good enough futures?
Was a strong candidate future missing entirely?
Were the candidates too local?
Did the candidates fail to predict long-term risk?
Did the candidates lack memory support or counterexamples?
Did the LLM request a missing candidate?
```

Validated candidates are necessary for safety, but they must not become a prison.

---

## 8. The Loop Between Impression, Memory, and Candidate Futures

Context compression, memory, and candidate generation are not independent modules.

They should form a loop.

```text
First impressions determine what is noticed.
Memory determines which past experiences become active.
Candidate generation turns those experiences into imagined futures.
The disagreement between candidate futures reveals what the first impression missed.
Prediction error then updates first impressions, memory, and candidate generation.
```

The system should avoid a purely one-way pipeline:

```text
compress state -> retrieve memory -> generate candidates -> let LLM choose
```

A stronger process is:

```text
initial Strategic Impression
  -> salience judgment
  -> memory activation
  -> candidate future generation
  -> candidate disagreement analysis
  -> enriched strategic context
  -> LLM deliberation
```

For example, a shallow system may see:

```text
This is an ordinary card reward.
```

But candidate future generation may reveal:

```text
Candidate A fixes frontload.
Candidate B fixes scaling.
Candidate C preserves deck consistency.
```

Memory may then reveal:

```text
Similar decks repeatedly died to the boss because they lacked scaling.
```

The Strategic Impression should then become:

```text
This is not an ordinary card reward.
This is a deck-direction fork.
The current deck has acceptable frontload but insufficient boss scaling.
Short-term stability and long-term growth are in conflict.
```

This is the core value of the cognitive scaffold:
it does not merely shorten state; it helps the LLM see the real problem.

---

## 9. LLM Deliberation Doctrine: The LLM as Strategic Workspace

The LLM is the core strategic player, but it should not carry all low-level perception, calculation, retrieval, and validation alone.

In this system, the LLM functions as a strategic workspace:

```text
Context compression decides what enters the workspace.
Memory retrieval brings relevant experience into the workspace.
Candidate generation brings possible futures into the workspace.
The mechanics engine brings deterministic calculations into the workspace.
The LLM performs explicit tradeoff analysis, conflict resolution, and strategic judgment.
The executor turns the selected plan into safe actions.
Replay and evaluation update what enters the future workspace.
```

The LLM’s deliberation packet should include:

* Strategic Impression;
* salient risks;
* relevant memory;
* relevant derived knowledge;
* candidate futures;
* deterministic calculations;
* key tradeoffs;
* uncertainty;
* output schema;
* validation constraints.

The LLM should be able to:

* choose a candidate future;
* reject all candidates as too shallow;
* request a missing candidate type;
* identify key uncertainty;
* provide a concise strategic reason;
* suggest how the scaffold should improve.

The LLM should not need to parse:

* raw adapter noise;
* the full fact database;
* full history;
* all memory;
* unbounded review text;
* uncompressed state dumps.

If the deliberation packet contains the wrong problem, the LLM’s answer may be logically coherent but strategically wrong.

---

## 10. Prediction Error Doctrine: Learning From What Was Predicted Incorrectly

The project should not only ask:

```text
Did we win or lose?
```

It should not only ask:

```text
Did the LLM choose correctly?
```

It should ask:

```text
What did we predict?
What actually happened?
Where was the prediction wrong?
Which module caused the error?
How should the system change next time?
```

Prediction error may include:

* damage prediction error;
* block prediction error;
* lethal prediction error;
* draw prediction error;
* resource prediction error;
* combat-risk prediction error;
* route-risk prediction error;
* deck-quality prediction error;
* candidate-future outcome prediction error;
* memory-relevance error;
* context-omission error;
* LLM-judgment error;
* execution-state error.

Prediction error must be attributed.

If mechanics were wrong, fix the mechanics layer.
If the first impression omitted a key feature, fix context compression.
If a strong candidate future was missing, fix candidate generation.
If memory misled the judgment, fix memory conditions, confidence, or retrieval.
If the LLM had enough information and still chose poorly, record a strategic lesson.
If execution relied on stale state, fix execution and checkpoint handling.

Learning is not writing a longer failure summary.

Learning means that next time:

```text
the first impression notices better features;
the activated memory is more relevant;
the generated candidate futures are stronger;
the LLM sees a more complete tradeoff;
the predicted outcome is closer to reality;
execution is safer;
review is better at locating the cause.
```

---

## 11. Replay Doctrine: Replay as Offline Cognitive Training

Replay is not a decorative post-run summary.

Replay is the process of reconstructing important decisions, checking prediction error, locating the failing module, and proposing controlled updates.

Replay should reconstruct:

```text
preState
  -> strategic impression
  -> salience signals
  -> memory activation
  -> candidate futures
  -> deliberation packet
  -> LLM decision
  -> selected action
  -> postState
  -> stateDiff
  -> prediction error
  -> error attribution
  -> proposed update
```

Replay should prioritize high-salience transitions:

* the turns before death;
* near-death turns;
* high-damage turns;
* key card rewards;
* bad skips;
* bad removals;
* bad shop purchases;
* potion mistakes;
* route locks;
* pre-elite decisions;
* boss-preparation failures;
* early signs of archetype collapse;
* repeated failure patterns.

Replay should ask:

```text
Was the first impression correct?
Did salience capture the important features?
Was the right memory retrieved?
Were the right candidate futures generated?
Did the candidate futures predict the real risk?
Did the LLM receive enough information?
Did the LLM make a reasonable tradeoff?
Did execution remain safe?
Where did prediction fail?
Which module should change?
```

Replay output should not merely be review text.

It should produce controlled updates such as:

* memory update;
* derived knowledge proposal;
* candidate template proposal;
* context feature proposal;
* mechanics test;
* replay fixture;
* evaluation case;
* prompt improvement suggestion;
* rollback note.

---

## 12. Learning Doctrine: Getting Better Is Not Storing More Text

The system should improve through play, replay, evaluation, and controlled update.

Learning does not mean:

```text
more memory;
longer prompts;
prettier reviews.
```

Learning means:

```text
When a similar situation appears again,
the first impression is more accurate,
the activated memory is more relevant,
the candidate futures are stronger,
the LLM sees a more complete tradeoff,
prediction error becomes smaller,
execution becomes safer,
and long-term decisions improve.
```

The learning loop is:

```text
run experience
  -> transition records
  -> replay and review
  -> missing-impression detection
  -> missing-memory detection
  -> missing-candidate detection
  -> prediction-error attribution
  -> memory / derived knowledge / candidate template / context feature updates
  -> better future deliberation
```

The project should support a path from weak initial knowledge to stronger play.

At the beginning, the agent may have:

```text
little game-specific memory;
weak derived knowledge;
simple candidate generation;
basic mechanics calculation;
limited combat planning;
rough context compression.
```

Through repeated play, it should gradually acquire:

```text
better Strategic Impressions;
more relevant memory activation;
richer candidate futures;
more stable candidate prediction;
more reliable LLM deliberation packets;
clearer error attribution;
safer execution;
better-evidenced long-term strategy.
```

Learning should be separated into:

```text
Experimental layer:
  allows aggressive hypotheses, unusual lines, black-box discoveries,
  exploratory candidate templates, and statistical experiments.

Promotion layer:
  tests whether discoveries improve outcomes in relevant situations.

Stable layer:
  accepts only updates with evidence, confidence, conditions, evaluation, and rollback paths.
```

The stable system should be conservative.
The experimental system should not be suffocated.
The two must remain isolated.

---

## 13. Engineering Inspiration From Reflexion, Voyager, and Tree of Thoughts

The project may borrow from several LLM-agent directions, but it should not copy them blindly.

### 13.1 Reflexion-Inspired Learning

The Reflexion-style lesson is that an LLM can improve across trials through language feedback, reflection, and episodic memory without immediately updating model weights.

For this project, that means:

```text
After failure, the system does not need to train a model immediately.
It can first store prediction errors, error attribution, and improvement suggestions as structured memory.
```

However, this project must not rely on natural-language reflection alone.
Reflection must be attached to transitions, candidate futures, prediction errors, and applicability conditions.

### 13.2 Voyager-Inspired Skill Accumulation

The Voyager-style lesson is that experience is most useful when it becomes reusable skill rather than ordinary logs.

For this project, memory should eventually help create or improve things like:

```text
detect_deck_deficit(...)
generate_survival_line(...)
evaluate_card_reward(...)
evaluate_route_risk(...)
detect_missing_scaling(...)
estimate_shop_remove_value(...)
generate_boss_preparation_candidates(...)
```

Valuable experience should change how the system sees situations, generates candidates, and predicts futures — not merely add another paragraph to memory.

### 13.3 Tree-of-Thoughts-Inspired Deliberation

The Tree-of-Thoughts-style lesson is that complex decisions should not rely on one-shot generation.

The system should allow multiple candidate paths, foresight, self-evaluation, and backtracking when needed.

For this project, that means:

```text
The LLM should not merely choose from A/B/C.
It should be able to compare candidate futures,
ask for missing lines,
challenge candidate assumptions,
and perform deeper strategic search in key situations.
```

These research directions are inspirations, not architecture to copy directly.

Slay the Spire 2 is a real-game, high-constraint, long-horizon, high-risk execution environment.
Therefore, reflection, skills, candidates, and deliberation must all be constrained by legality validation, state records, execution safety, replay evaluation, and data-truth discipline.

---

## 14. Engineering Doctrine: Inspiration Must Become Objects

The philosophical center of this project is the predictive cognitive scaffold.

But philosophy must become engineering objects.

The core objects should eventually include:

```text
StrategicImpression:
  the strategic first impression of the current situation.

SalienceSignal:
  which risks, opportunities, uncertainties, or memory resonances deserve attention.

MemoryActivation:
  which experiences are activated by the current situation and why they are relevant.

CandidateFuture:
  a legal plan and its predicted benefit, cost, risk, assumptions, and invalidation conditions.

DeliberationPacket:
  the compact strategic workspace given to the LLM.

PredictionErrorRecord:
  the difference between prediction and reality, with error attribution.

ReplayFrame:
  an important decision frame that can be reconstructed, reviewed, and evaluated.

ConsolidationRecord:
  how this experience should change memory, derived knowledge, candidate templates, or context features.
```

These objects do not need to be fully mature at the beginning.

But the project should evolve toward them.

If an inspiration cannot become an object, record, test, or evaluation, it is not yet engineering architecture.

---

## 15. Layering Doctrine

The project must preserve clear dependency direction.
Lower layers must not depend on higher layers.
Each layer must have clear responsibility, inputs, outputs, and failure modes.

### 15.1 Game Integration Layer

This layer communicates with the game or mod.

It may:

* read raw game state;
* execute actions;
* expose action results;
* read event logs;
* report adapter capabilities;
* handle connection, waiting, settlement, and errors.

It must not:

* contain strategy;
* call the LLM;
* mutate memory or derived knowledge;
* decide rewards, routes, shops, or combat strategy;
* expose raw external formats directly to the agent core.

External game projects are adapters, not architecture.

### 15.2 Canonical State and Mechanics Layer

This layer converts unstable external state into stable internal state and performs deterministic reasoning.

It may:

* normalize raw state;
* define canonical state / action / event / transition structures;
* validate legality, energy, targets, costs, and options;
* calculate damage, block, lethal, incoming damage, draw probabilities, and simple risks;
* compute state diffs;
* identify checkpoints;
* query objective facts.

It must not:

* call the LLM;
* use long-term memory as mechanical truth;
* write learned strategy into the fact layer;
* hide uncertainty behind overconfident estimates.

### 15.3 First Impression and Salience Layer

This layer turns canonical state into a Strategic Impression.

It may:

* identify the current decision type;
* identify danger, opportunity, and uncertainty;
* identify deck deficits;
* identify resource pressure;
* identify route pressure;
* identify memory resonance;
* decide whether LLM deliberation is needed.

It must not:

* omit decisive information merely to shorten the prompt;
* present uncertain judgments as facts;
* flood the prompt with irrelevant experience;
* hide key assumptions.

### 15.4 Memory and Derived Knowledge Layer

This layer retrieves, organizes, and updates experience.

It may:

* retrieve episodic memory;
* retrieve semantic lessons;
* retrieve procedural templates;
* retrieve salience memory;
* propose derived knowledge;
* lower confidence in misleading memory;
* handle contradiction, decay, and applicability conditions.

It must not:

* treat experience as objective fact;
* generalize one failure unconditionally;
* let low-confidence experience dominate stable strategy;
* place all memory into real-time prompts.

### 15.5 Candidate Future Layer

This layer generates legal, validated, state-grounded candidate futures.

It may:

* generate legal actions;
* generate multi-step plans;
* generate combat lines;
* generate strategic candidates for rewards, routes, shops, upgrades, rests, and resources;
* predict benefits, costs, risks, and uncertainty;
* attach assumptions, memory links, and invalidation triggers;
* identify missing candidate types.

It must not:

* execute arbitrary LLM-invented actions;
* bypass legality validation;
* confuse speculative candidates with executable plans;
* limit the LLM’s ceiling with shallow candidates without exposing that limitation.

### 15.6 LLM Deliberation Layer

This layer lets the LLM make strategic judgments in the right context.

It may:

* construct deliberation packets;
* call the LLM;
* let the LLM choose, reject, or request candidates;
* ask the LLM for concise reasons;
* ask the LLM to identify uncertainty;
* ask the LLM for scaffold improvement suggestions.

It must not:

* let the LLM directly operate the game;
* accept unvalidated actions;
* rely on raw state dumps;
* treat LLM output as automatically true or executable.

### 15.7 Execution and Checkpoint Layer

This layer performs safe execution.

It may:

* execute planned actions;
* re-read state after actions;
* detect hard checkpoints;
* stop, continue, or replan;
* record execution results.

It must not:

* assume multi-action plans remain valid after draw, generation, enemy death, target changes, relic triggers, energy changes, or screen changes;
* rely on stale card indices;
* continue through hard checkpoints without re-reading state;
* treat execution success as strategic correctness.

### 15.8 Replay, Evaluation, and Learning Layer

This layer records, reviews, attributes error, and proposes controlled updates.

It may:

* record transitions;
* reconstruct replay frames;
* compute prediction error;
* attribute error to modules;
* propose memory / derived knowledge / candidate / context updates;
* maintain experiment logs;
* maintain rollback paths.

It must not:

* treat one run as definitive proof;
* automatically convert reflection into stable rules;
* update strategy in ways that cannot be evaluated or rolled back;
* treat human diff inference as exact action truth.

---

## 16. Data Truth Doctrine

The project must distinguish:

```text
facts
observations
inferences
memory
derived knowledge
strategy hypotheses
LLM reflection
executed action truth
```

These must not be mixed together.

### 16.1 Facts

Facts include card names, costs, descriptions, relic effects, keywords, characters, potions, enemies, and game text.

Facts belong in the fact layer.

Learned beliefs must not be written into the fact layer.

### 16.2 Observations

Observations are states, logs, snapshots, and adapter outputs that the system actually read.

Observations may be incomplete, stale, or noisy.

Observation is not the same as truth.

### 16.3 Inferences

Inference is a best explanation of what may have happened.

Inference must carry uncertainty.

Inferred human actions, inferred causes of death, inferred missed opportunities, and inferred strategic failures must not be treated as ground truth.

### 16.4 Memory

Memory is experience.

Memory may guide judgment, but it must remain conditional, evidence-linked, and confidence-aware.

### 16.5 Derived Knowledge

Derived knowledge describes when facts matter.

It may evolve, but it must not pretend to be fact.

### 16.6 LLM Reflection

LLM reflection is a candidate explanation or improvement suggestion.

It may be valuable, but it is not truth.

### 16.7 Executed Actions

Agent actions sent through the executor may be treated as ground truth for the selected action.

Mod / MCP event actions may be treated as ground truth only when identity and timing information are sufficient.

---

## 17. Transition Recording Doctrine

Eventually, an important decision should be recorded as:

```text
preState
  -> strategicImpression
  -> salienceSignals
  -> memoryActivation
  -> candidateFutures
  -> deliberationPacket
  -> llmDecision
  -> selectedPlan
  -> executedAction
  -> postState
  -> stateDiff
  -> predictionError
  -> auditMetadata
```

Transitions are the foundation of replay, evaluation, reward, review, and learning.

Snapshots alone are not actions.
Summaries alone are not learning.
Without preState / decision / postState, real review is difficult.
Without prediction error, the system cannot know which module to fix.
Without audit metadata, long-term learning cannot be trusted.

---

## 18. Combat Doctrine

Combat should be fast, but not reckless.

The long-term combat model is:

```text
candidate combat futures
  -> execute safe initial segment
  -> re-read state
  -> identify checkpoint
  -> continue, replan, or ask the LLM
```

Ordinary combat should not require asking the LLM for every card.

But the system must not blindly execute long fixed chains, because plans may be invalidated by:

* card draw;
* card generation;
* discovery;
* enemy death;
* relic triggers;
* energy changes;
* target changes;
* intent changes;
* screen changes;
* reward index changes.

Mature combat candidate futures should consider:

* lethal lines;
* survival lines;
* damage / block tradeoffs;
* enemy intent;
* energy;
* draw and discard state;
* potions;
* relic triggers;
* future-turn risk;
* resource preservation;
* plan invalidation conditions.

The goal of combat planning is not to make the LLM micro-manage every step.

The goal is to let the LLM see high-quality candidate futures when strategic judgment is needed.

---

## 19. Evaluation Doctrine

The project should evaluate the entire cognitive scaffold loop, not only final win/loss outcomes.

Winning matters, but win/loss is too coarse to guide learning by itself.

Evaluation should examine:

* Strategic Impression quality;
* salience judgment quality;
* memory retrieval relevance;
* memory condition accuracy;
* candidate future coverage;
* candidate prediction quality;
* LLM deliberation quality;
* execution safety;
* checkpoint behavior;
* transition record quality;
* replay quality;
* prediction-error attribution quality;
* learning update quality;
* reduction of repeated failures;
* improvement over time.

The evaluation system should help answer:

```text
Did the agent improve because the LLM judged better?
Or because the first impression became more accurate?
Or because memory retrieval became more relevant?
Or because candidate futures became stronger?
Or because mechanics became more accurate?
Or because execution became safer?
Or because replay identified errors better?
```

The project should prefer evidence over vibes.

A strategy improvement is not mature until it can be observed, replayed, compared, and rolled back.

---

## 20. External Dependency Doctrine

External projects and services provide capabilities, but they do not define the agent core.

Every external dependency must be isolated behind an adapter.

For each external dependency, the project should know:

* what it can reliably do;
* what it cannot reliably do;
* what is unknown;
* what license or maintenance risk exists;
* how it can be replaced;
* which fallback is used when a capability is missing.

Do not assume an external project provides a capability merely because that capability would be useful.

Capabilities must be detected, documented, and tested.

---

## 21. Mod Boundary Doctrine

Some capabilities belong in a game-side mod.
Most agent intelligence does not.

A mod may provide:

* raw game state;
* action execution;
* action results;
* legal-action exposure;
* game event logs;
* human UI / action event capture;
* card instance IDs;
* target IDs;
* option IDs;
* screen identity;
* pre/post state references or hashes.

A mod should not contain:

* LLM calls;
* prompts;
* API keys;
* long-term memory;
* derived strategy knowledge;
* reward logic;
* experiment management;
* route planning;
* shop planning;
* card reward planning;
* combat planning;
* post-run review;
* vector databases;
* training-data export policy.

The mod should be the sensor and actuator.
The local agent system should be the brain and learning loop.

---

## 22. Human Data Doctrine

Human play data is valuable only when its reliability is explicit.

The ideal long-term design is:

```text
Game-side event log mod
  captures real human / game events

Local HumanPlayRecorder
  joins events with preState / postState and writes transitions
```

If event logs are unavailable, the system may use snapshot polling and state-diff inference, but the result must be marked as inferred and must not be treated as ground truth.

The project must never silently convert ambiguous human state changes into high-confidence labels.

Human data may help the LLM and scaffold learn, but it must not corrupt the boundary between observation, inference, action truth, and verified transition.

---

## 23. Engineering Doctrine

The agent is a long-lived software system and must remain maintainable.

Permanent engineering rules:

* keep responsibilities separated;
* keep external dependencies behind adapters;
* keep schemas versioned;
* keep prompts centralized and validated;
* keep data formats durable;
* keep replay and evaluation possible;
* keep bottom-layer mechanics tested;
* separate live strategy issues from program bugs;
* keep documentation aligned with behavior;
* keep patch risk, tests, and rollback explicit;
* keep the system understandable to future coding agents.

A change is not mature until it is observable.

A strategy improvement that cannot be replayed, measured, or rolled back is not trustworthy.

A clever module that makes the system harder to reason about should be treated as a liability unless its benefit is clear and measured.

---

## 24. What Must Never Be Optimized Away

Future changes must not remove or weaken these principles:

1. **LLM as core strategic player.** The scaffold exists to unlock the LLM’s potential, not to make the LLM irrelevant.
2. **Predictive cognitive scaffold.** The project’s center is the loop of first impression, memory activation, candidate futures, deliberation, execution, prediction error, and learning.
3. **Strategic Impressions.** Context compression must create strategic perception, not ordinary summaries.
4. **Salience judgment.** The system must know what deserves attention and what should enter LLM deliberation.
5. **Memory as material for future prediction.** Memory should help imagine and evaluate futures, not merely store the past.
6. **Candidate Futures.** Candidate generation should produce validated future predictions, not shallow action lists.
7. **LLM deliberation.** The LLM should make strategic judgments among candidate futures and tradeoffs, not merely press buttons.
8. **Prediction-error learning.** The system must record what was predicted, what happened, and which module should improve.
9. **Validated execution.** The LLM does not directly operate the game; all actions must be legal, executable, and grounded in current state.
10. **Fact / memory / derived knowledge separation.** Learned beliefs must not pollute the fact layer.
11. **Transition recording.** The system must move toward rich preState / decision / postState / predictionError records.
12. **Checkpoint safety.** Execution must re-read state after meaningful uncertainty.
13. **Conservative stable promotion.** Stable strategy changes require evidence, conditions, evaluation, and rollback.
14. **Experimental freedom.** Aggressive exploration may exist, but it must be isolated from stable strategy.
15. **Maintainability.** The project should become clearer as it grows, not more chaotic.

Inside these boundaries, some scaffold policies may evolve over time, but they must do so through replayable evidence rather than by silently accreting hand-written rules. Examples include:

* workspace-side reason contracts;
* candidate templates and future-completeness policies;
* compression and budget presentation policies;
* memory-activation prioritization policies.

These are legitimate learning targets for the inner scaffold. They are not allowed to bypass or rewrite the outer shell.

The outer shell must remain hard:

* legality and execution safety;
* semantic validation;
* live flags and rollout authorization;
* rollback and protected-path promotion rules;
* fact / memory / derived separation;
* stable-promotion requirements.

The LLM may help improve the inner scaffold only inside that shell.

---

## 25. What Counts as Progress

Progress is not adding more prompts.
Progress is not writing more documents.
Progress is not piling up more memory.
Progress is not adding more heuristics.
Progress is not making the LLM produce prettier reviews.

Progress means the cognitive scaffold loop becomes stronger.

Good progress includes:

* more stable canonical state;
* more accurate mechanics;
* better Strategic Impressions;
* better salience detection;
* more relevant memory activation;
* better-conditioned memory;
* better candidate futures;
* stronger candidate coverage;
* more accurate candidate prediction;
* better LLM deliberation packets;
* safer execution;
* more complete transitions;
* more useful replay;
* more accurate prediction-error attribution;
* more reliable learning updates;
* fewer repeated failures;
* clearer module boundaries;
* more tests from real failures.

Bad progress includes:

* adding strategy rules that bypass the architecture;
* letting local rules silently replace LLM strategic judgment;
* reducing context compression to ordinary summarization;
* turning memory into unconditioned experience piles;
* turning candidate generation into legal-action enumeration;
* treating LLM reflection as fact;
* dropping decisive information for the sake of short prompts;
* letting prompts become full-history dumps;
* mixing facts, memory, and derived claims;
* relying on untested external fields;
* treating ambiguous inference as labels;
* changing bottom-layer mechanics without tests;
* creating a system that sometimes wins but cannot explain, replay, or improve its decisions.

---

## 26. Conflict Resolution

When goals conflict, prefer this order:

1. **Safety and legality of real game actions.**
2. **Correctness of state and data truth.**
3. **Observability and replayability.**
4. **LLM as core strategic player.**
5. **Quality of Strategic Impressions and Candidate Futures.**
6. **Strategic play quality.**
7. **Speed and token efficiency.**
8. **Learning and adaptation.**
9. **Convenience and short-term development speed.**

A faster agent that cannot be audited is worse than a slower agent that can improve.

A clever strategy that corrupts data truth is worse than a conservative strategy that records uncertainty.

A scaffold that wins by silently replacing the LLM is not fulfilling the project’s purpose unless it is explicitly marked as a separate baseline, solver, or experimental system.

A short prompt that omits the decisive feature is worse than a longer prompt that gives the correct strategic context.

A memory that sounds smart but lacks conditions is worse than no memory.

A safe but shallow candidate set may become the ceiling of the LLM’s strategic level.

---

## 27. Permanent Instruction for Future Agents

Future coding agents must internalize this document and inspect the current project state before making structural changes.

They must not assume that implementation details from old handoff, debug, planning, or experiment documents are still current.

Every substantial change should answer:

```text
Which layer does this belong to?
Does it preserve the LLM as the core strategic player?
Does it strengthen the predictive cognitive scaffold?
Does it help the LLM see, remember, imagine, deliberate, execute, or learn better?
Does it improve Strategic Impressions?
Does it improve salience judgment?
Does it improve memory activation without creating superstition?
Does it improve Candidate Futures without bypassing validation?
Does it make prediction error easier to record and attribute?
Does it preserve fact / memory / derived knowledge separation?
Does it improve transition recording and replay?
Does it keep external dependencies behind adapters?
Does it make human-data reliability explicit?
Does it include necessary tests or fixtures?
Can it be evaluated?
Can it be rolled back?
```

If the answer is unclear, the change should be redesigned before implementation.

---

## 28. Enduring One-Sentence Summary

Build a real-game Slay the Spire 2 LLM agent where the LLM remains the core strategic player, and a predictive cognitive scaffold transforms raw state into Strategic Impressions, activates relevant memory, generates validated Candidate Futures, lets the LLM deliberate in a compact but strategically complete context, and uses safe execution, transition recording, replay evaluation, and prediction-error learning to help the LLM progressively approach the strongest strategic performance it is capable of through repeated play.
