# STS2 Draft Rules

This directory is the local strategic layer above raw Spire Codex data.

- Spire Codex answers: what is this card, relic, keyword, potion, or character?
- Derived rules answer: when is it strong, what does it combine with, and should the agent pick it now?
- Keep rules short enough for retrieval. Do not paste the entire raw database into prompts.

## Minimal Agent Policy

- First search local JSON for the current character, current deck cards, candidate cards, and known relics.
- Put only the top 5 to 20 relevant records into the LLM prompt.
- Use raw card/relic text for facts and derived rules for recommendations.
- Prefer adding tags here over hard-coding strategy inside prompts.
