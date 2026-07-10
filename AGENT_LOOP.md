# Agent Loop

The agent loop should stay LLM-centered while using local scaffold for speed, reliability, strategic framing, and explicitly delegated bounded skills. The local system shapes what the LLM sees; capability does not silently make it the strategic player.

## Target Flow

```text
1. Read raw state through GameIO.
2. Normalize raw state and record environment/capability identity.
3. Build `StrategicImpression` and `SalienceSignal[]`.
4. Update run memory and retrieve facts, derived knowledge, and relevant long-term memory.
5. Record `MemoryActivation` with evidence, conditions, confidence, and omissions.
6. Generate legal candidates and wrap them as `CandidateFuture[]`.
7. Score candidates, estimate risks, and record assumptions/invalidation triggers.
8. Build a compact `DeliberationPacket`.
9. Resolve rollout and decision-authority policy independently.
10. If mechanically proven or explicitly delegated within a qualified bounded skill, choose locally with authority audit.
11. If strategic, uncertain, out of skill scope, or invalidated, ask/escalate to the LLM with the deliberation packet.
12. Validate LLM JSON and candidate id.
13. Execute through GameIO.
14. Read post-state and classify checkpoint.
15. Record transition, authority chain, environment scope, decision audit, and cognitive scaffold snapshots.
16. Use replay/eval/review to generate `PredictionErrorRecord` and conservative learning proposals.
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
- Strategic Impression / Salience
- hp, floor, gold, energy, and decisive resources
- enemy intent/risk if combat
- current options or hand when needed
- Memory Activation, not full memory
- relevant derived knowledge with evidence
- Candidate Futures with predictions, costs, risks, assumptions, and invalidation triggers
- strict output schema

The prompt must not include:

- full raw state dump
- full card/relic database
- all memory
- all history
- unbounded natural-language reflection

## Current Gap

`DeliberationPacket`, CandidateFuture, live/shadow telemetry, proposal infrastructure, and bounded P9.5 shadow comparison now exist. The current gaps before stable promotion are:

- decision authority is not yet a first-class chain beyond historical routing/`chosenBy` fields;
- evidence is not yet scoped to a complete game/mod/adapter environment fingerprint;
- P9.5 paired/counterexample evidence is incomplete;
- promotion ledger, rollback snapshot, and traced stable retrieval do not exist.

P9.5D/P9.5E must add audit-only foundations without changing the existing live loop.
