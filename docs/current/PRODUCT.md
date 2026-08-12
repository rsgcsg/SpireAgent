# Product Direction

The current product is a small trusted in-game Player Environment Host plus an
external Agent runtime:

```text
STS2 + Player Environment Host
  -> localhost Player Environment contract
  -> Re-SpireAgent or another reviewed consumer
```

The in-game Mod contains no provider key, LLM, strategy or arbitrary mutation
surface. It owns fair-player extraction, exact private native binding, one
controller, input delivery and delivery receipts. Re owns model access,
strategy, progress interpretation and local records. MCP is optional transport,
not the connector architecture.

C1 is a source freeze candidate, not a public binary compatibility claim. A
reviewed distribution still requires reproducible packaging, support policy and
same-artifact runtime evidence. Headless, Training, Search, Companion UX and a
public Agent SDK remain separate product decisions after C1.

Current sequencing is owned by the [program plan](PROGRAM_PLAN.md); historical
product alternatives remain in dated audits.
