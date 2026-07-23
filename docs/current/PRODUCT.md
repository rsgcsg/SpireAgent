# Product Direction

The preferred long-term product shape is a small trusted Gateway Mod in the
game and an external Companion runtime for player control, provider keys,
records, diagnostics, and the official Agent. The Companion is a target
boundary, not current functionality.

```text
STS2 + Workshop Gateway Mod
  -> authenticated local Connector Contract
  -> Companion Core
       -> official Re-SpireAgent
       -> BYOK model broker
       -> optional MCP adapter
       -> later, explicitly isolated external Agents
```

The Workshop package should not contain API keys, an LLM, or arbitrary Agent
code. The Gateway must remain the sole authority for game observation,
advertised actions, validation, and completion. MCP is optional ecosystem glue,
not the core connector.

Gate 0 source truth is repaired. Consumer rollout remains blocked by active
Gate 1 coverage/reliability work plus missing Gateway authentication,
controller lease, restart epoch, and recovery evidence. Do not represent the
direct local REST path as a consumer-safe installation.

For the full evidence boundary, alternatives considered, security analysis,
and conditional product gates, read the
[2026-07-22 productization audit](audits/REAL_PRODUCTIZATION_ARCHITECTURE_AUDIT_AND_ROADMAP_2026-07-22.md).
Cross-component sequencing is owned by the
[program plan](PROGRAM_PLAN.md).
