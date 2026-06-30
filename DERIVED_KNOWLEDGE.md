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

## Prompt Use

Only a small relevant subset of derived knowledge should enter real-time prompts. Retrieval should match:

- current character
- screen
- hand cards
- reward/shop/event options
- relics
- enemy names and intents
- deck deficits
