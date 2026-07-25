# Combat Plan And Checkpoint

Combat should move from one-card ticks toward segmented plans with checkpoints.

## Current State

Current code:

- Generates individual playable card candidates.
- Scores damage, block, lethal, status, draw, energy, and risk.
- Executes one action per tick.
- Re-reads state after execution.
- Classifies checkpoint as `none`, `soft`, `hard`, or `unknown`.

This is safe but can be slow and may over-route ordinary combat through repeated ticks.

## Target Plan Shape

```ts
interface CombatPlan {
  planId: string;
  label: string;
  initialActions: unknown[];
  estimatedDamage: number;
  estimatedBlock: number;
  estimatedHpLoss: number;
  likelyLethal: boolean;
  usesPotion: boolean;
  risk: string[];
  localScore: number;
  checkpointExpected: boolean;
  continuePolicy: string;
  llmDispute: string[];
}
```

Plan examples:

- find lethal
- safe defense
- maximum output
- debuff then reassess
- draw/energy setup then reassess
- potion for tempo
- conserve resources

## Checkpoint Rules

Soft changes:

- normal damage
- normal block
- expected energy decrease
- expected card removed from hand
- discard pile count changed as expected

Hard changes:

- screen changed
- turn changed
- draw or generated card
- discover/card-select opened
- enemy died
- target set changed
- energy increased unexpectedly
- hand changed beyond expected removal
- potion state changed
- action result differs from prediction
- MCP error or no settlement

After hard checkpoint:

- Re-read full state.
- Regenerate candidates/plans.
- Ask LLM only if strategic uncertainty remains.

## Index Safety

Cards are hand-indexed. Playing a card shifts later indices. Therefore:

- Prefer one action per state read for now.
- For future multi-action plans, execute from right to left when safe.
- Re-check state after any draw, generation, enemy death, or unexpected hand change.
