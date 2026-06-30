# Agent Loop

The agent loop should stay LLM-first while using local scaffold for speed and reliability.

## Target Flow

```text
1. Read raw state through GameIO.
2. Normalize raw state into canonical state.
3. Update run memory.
4. Retrieve facts, derived knowledge, and relevant long-term memory.
5. Generate legal candidates or candidate plans.
6. Score candidates and estimate risks.
7. Route the decision.
8. If low-dispute, choose locally.
9. If strategic or uncertain, ask LLM with compact context.
10. Validate LLM JSON and candidate id.
11. Execute through GameIO.
12. Read post-state and classify checkpoint.
13. Record transition and decision audit.
14. At run end, review, reward, and update memory conservatively.
```

## Decision Routes

Current routes:

- `no_op_or_poll`
- `forced_local`
- `obvious_local`
- `local_fast_combat`
- `local_confident`
- `local_recommended_llm_arbitrate`
- `llm_required`

LLM-required examples:

- card rewards with meaningful choices
- shops with competing purchases
- events with long-term cost
- life-or-death turns
- complex combo potential
- route decisions with elite/boss risk

Local examples:

- only legal action
- forced proceed
- no energy and no useful potion
- obvious lethal
- impossible purchases filtered out

## LLM Prompt Rule

The prompt should include:

- current screen and compact state
- hp, floor, gold, energy
- enemy intent/risk if combat
- current options or hand
- run memory summary
- relevant long-term memories
- relevant derived knowledge
- top candidates and local scores
- strict output schema

The prompt must not include:

- full raw state dump
- full card/relic database
- all memory
- all history
- unbounded natural-language reflection
