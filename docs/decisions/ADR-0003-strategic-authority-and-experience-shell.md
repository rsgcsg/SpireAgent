# ADR-0003: Strategic Authority And The Learnable Experience Shell

## Status

Accepted

## Context

SpireAgent is intended to help an LLM learn to play Slay the Spire 2 through real experience. The project also contains increasingly capable local machinery: mechanics, candidate generation, memory, skills, routing, validation, execution, replay, and policy proposals.

That creates a durable design question:

```text
When the surrounding system becomes capable of making a decision,
does that capability automatically give it strategic authority?
```

The answer for the main product is no. Capability, confidence, execution permission, and strategic authority are different concepts. If they are collapsed, the project can silently become a local rules or policy bot with an LLM attached to it.

## Decision

SpireAgent is **LLM-centered, not LLM-exclusive**.

In the main product mode, the LLM remains the primary strategic deliberator. The surrounding experience shell may observe, remember, predict, compile context, propose candidates, execute validated actions, learn bounded skills, and recommend delegation. It may not silently acquire unrestricted strategic authority merely because it has become competent.

The architecture must distinguish four independent dimensions:

1. **Provider mode**: which LLM or local component produced an answer.
2. **Rollout mode**: shadow, explicit-whitelist live, or another authorized experiment.
3. **Learning mode**: read-only, proposal-only, shadow overlay, or guarded stable policy.
4. **Decision authority mode**: who owns deliberation, selection, authorization, and execution.

The durable decision-authority modes are:

- `llm_primary`: default product identity. The LLM owns strategic deliberation; qualified local skills may handle bounded execution or explicitly delegated subproblems.
- `llm_full_control`: research/baseline mode where the LLM receives the broadest safe strategic workspace and local strategic shortcuts are minimized.
- `local_shadow`: local policies recommend or simulate but do not own the live strategic decision.
- `local_autonomy_experimental`: isolated research mode for local policy/world/value-model authority. It is not the default product and cannot be promoted into it without a new ADR and North Star review.

Authority levels are also distinct:

- **Level 0: mechanical execution.** No strategic choice, such as submitting an already selected legal action.
- **Level 1: deterministic bounded skill.** Mechanically provable behavior with narrow scope and explicit termination.
- **Level 2: qualified delegated skill.** Evidence-backed, versioned, monitored, rollback-capable behavior with uncertainty escalation.
- **Level 3: long-horizon or irreversible strategy.** Deck direction, route commitment, resource policy, difficult combat planning, and similar choices remain LLM-owned in `llm_primary`.

The long-term goal that the soft shell should "almost disappear" means that permanently hand-authored soft policy should disappear. It does **not** mean removing the external memory/skill/context system, and it does not mean weakening the hard safety shell. The experience shell should become increasingly learned, versioned, reviewable, and replaceable.

## Delegation Contract

A delegated skill must define:

- scope and authority level;
- evidence and qualification version;
- entry conditions;
- legal action surface;
- termination conditions;
- invalidation and out-of-distribution conditions;
- escalation path back to the LLM;
- telemetry and replay identity;
- rollback path.

No confidence score alone may grant authority. Model confidence, empirical competence, and mechanical proof must remain separate.

## Proposal Impact Classes

Every future learning proposal must declare its behavior impact:

- `presentation_only`
- `deliberation_shaping`
- `candidate_shaping`
- `authority_shaping`
- `action_shaping`
- `hard_shell`

P9's first stable promotion may target only low-risk `presentation_only` policy and, after stronger evidence, narrowly bounded `deliberation_shaping` policy. `authority_shaping`, `action_shaping`, and `hard_shell` proposals remain non-executable until later phase-specific governance exists.

## Explanation Boundary

An action explanation is an audit record of the selected plan, evidence, tradeoff, uncertainty, and authority chain. It is not a claim to expose private chain-of-thought or to prove that a natural-language reason caused the decision.

## Consequences

- Existing decision-class whitelists remain rollout and audit scaffolding, not the permanent ontology of thought.
- P9 must add authority records before stable policy promotion.
- P10 repeatable experience learning does not automatically transfer authority.
- P11 context/compute learning cannot silently alter decision authority.
- P14 owns skill qualification and delegation governance.
- Broad local autonomy is retained only as an isolated future research track.
- The mod remains a sensor/actuator and never becomes the strategic brain.

## Rejected Alternatives

### Authority follows capability automatically

Rejected for the main product. Empirical capability should inform delegation review, but automatic transfer would erase the project's LLM-centered identity and make regressions difficult to attribute.

### The LLM must perform every mechanical action

Rejected. LLM-centered does not mean LLM-exclusive. Safe mechanical execution and qualified bounded skills reduce noise and let the LLM focus on strategy.

### Permanent per-screen hand-written strategy shells

Rejected as the long-term architecture. They are acceptable bootstrap scaffolding, but should become proposal-driven policies, learned skills, or audit labels rather than an ever-growing prompt pile.
