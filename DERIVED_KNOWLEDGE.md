# Derived Knowledge

Derived knowledge is the strategy layer above raw facts and below run memory. It says when a fact matters.

## Current Directory

```text
derived/card-tags.json
derived/relic-tags.json
derived/synergy-rules.json
derived/draft-rules.md
```

## Boundaries

Raw facts:

- card names
- costs
- rarity
- descriptions
- relic effects
- character data
- keyword text

Derived knowledge:

- card tags
- relic tags
- synergies
- anti-synergies
- pick conditions
- avoid conditions
- enemy/boss risk notes
- route/shop/event strategic preferences

Memory:

- single-run observations
- decision logs
- post-run lessons
- confidence updates

Single-run observations must not directly overwrite derived knowledge. They should become proposals or low-confidence memories first.

Derived knowledge informs deliberation; it does not own strategic authority. A high-confidence rule cannot directly authorize an action, expand live scope, alter validation, or grant a local skill Level 3 strategic authority.

## Required Update Shape

Future derived updates should include:

- `id`
- `targetType`
- `targetId`
- `claim`
- `conditions`
- `evidence`
- `confidence`
- `source`
- `createdAt`
- `updatedAt`
- `rollback`
- `environmentScope`
- `dependencies`
- `invalidationTriggers`
- `lastValidatedEnvironment`
- `promotionLedgerId`

## Prompt Use

Only a small relevant subset of derived knowledge should enter real-time prompts. Retrieval should match:

- current character
- screen
- hand cards
- reward/shop/event options
- relics
- enemy names and intents
- deck deficits
- current environment compatibility

Unknown, stale, or quarantined derived knowledge must remain visible for review but must not be activated as stable guidance. See `ENVIRONMENT_COMPATIBILITY.md`.

## Current Shadow Retrieval

`src/agent/derivedKnowledge.ts` now builds a read-only `derivedSnapshot` for new agent transitions. It matches local card tags, relic tags, character synergy rules, and draft policy bullets against the current canonical state and generated candidates.

This is shadow-only: the snapshot is recorded into transitions and summarized inside `DeliberationPacket.derivedKnowledgeSummary`, but it does not replace or modify the live prompt, candidate scoring, fallback selection, validation, or execution.
