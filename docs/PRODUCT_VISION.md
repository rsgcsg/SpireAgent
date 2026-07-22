# Player Product Vision

This document describes the intended player-facing product. It is a direction, not a claim that the current repository already ships this product.

The conditional engineering gates and rejected alternatives are maintained in
the [Real Productization Architecture Audit And Roadmap](product/REAL_PRODUCTIZATION_ARCHITECTURE_AUDIT_AND_ROADMAP_2026-07-22.md).

The current implementation is a local TypeScript agent connected to an external game adapter. Current commands and limitations remain in [README.md](../README.md), [PORTABLE_USAGE.md](../PORTABLE_USAGE.md), and [LLM_RUN_MODES.md](runbooks/LLM_RUN_MODES.md).

## Product Thesis

SpireAgent should become an installable, inspectable game companion in which a player can choose an LLM provider and choose how much authority to delegate.

The default product identity is:

```text
LLM-centered strategic player
  + learnable external experience shell
  + deterministic safety and execution shell
  + player-visible authority and rollback controls
```

## Player Modes

These are product modes, not provider names:

- **Observe:** record and explain without taking actions.
- **Copilot:** recommend a plan; the player authorizes execution.
- **LLM primary:** the LLM owns strategic deliberation and the agent executes validated choices.
- **Delegated play:** the LLM may delegate qualified bounded skills while retaining strategic ownership.
- **Explanation/review:** inspect evidence, authority chain, predictions, outcomes, proposals, and rollbacks.
- **Local autonomy experimental:** isolated research mode, never silently selected as the default product.

## Product Boundary

The game-side Gateway Mod should remain small, but it is not a dumb transport.
It owns the native game truth that an external process must not reconstruct:

- player-visible semantic projection and loaded-environment identity;
- exactly one active input owner and a Gateway-enforced controller lease;
- legal opaque actions, stable exact operands, and state binding;
- shared publication/execution legality plus execute-time revalidation;
- native Commit, Command lifecycle, semantic completion, and unknown outcome;
- exact-environment action/Inspection permission.

The trusted external Companion owns product operations:

- Gateway discovery, authentication, compatibility negotiation, and lease use;
- provider adapters, OS-backed BYOK secrets, and the model broker;
- official Agent supervision, pause/takeover, diagnostics, recovery, and update
  UX;
- redacted records, replay/eval services, and optional ecosystem adapters such
  as MCP.

The Re/Agent layer owns strategic state and deliberation:

- normalized strategic projection, memory, and experience shell;
- context compilation, candidate futures, and provider-independent selection;
- transition/replay/eval and proposal-driven learning under protected paths.

Companion, Re, MCP, and third-party Agents may narrow or reject Gateway actions.
They must not synthesize new game actions, reconstruct native legality or
completion, receive direct game-object access, or broaden exact-environment
permission. The Mod must not contain provider secrets, prompts, stable memory,
derived strategy, proposal promotion, or autonomous learning logic.

This split is the target product architecture. The current repository still
uses a direct Re-to-Gateway developer path and does not implement the packaged
Companion or consumer secret store.

Official Steam Workshop support and the integrated mod loader make a player-installable mod surface plausible, but recent official patches also show continuing mod/serialization compatibility work. Product packaging must therefore build on the environment handshake and revalidation system rather than assuming a permanently stable API: <https://steamcommunity.com/app/2868840/allnews/>.

## Provider Neutrality

The product should support replaceable providers through one validated decision contract:

- OpenAI-compatible endpoints;
- DeepSeek;
- Anthropic;
- Google;
- local models;
- future providers through adapters.

Provider identity must not define strategic authority. A provider is a deliberation implementation, not the owner of validation, execution, promotion, or rollback.

## Secret And Privacy Boundary

- API keys remain local-only.
- Keys must use environment variables initially and OS keychain/encrypted storage in the product.
- Secrets must never enter prompts, logs, telemetry, replay artifacts, reports, Git, or mod files.
- Players must be able to inspect and delete local memory, evidence, and learned policies.

## Player Trust Requirements

The player must be able to see:

- who deliberated, selected, authorized, and executed an action;
- which memory, skill, and policy versions were used;
- what was predicted and what actually happened;
- whether the environment is compatible, degraded, quarantined, or unsupported;
- whether a proposal is draft, shadow-tested, promoted, or rolled back;
- how to pause, take over, disable learning, and revert policy changes.

Natural-language explanations are audit summaries, not hidden-chain-of-thought claims.

## Product Success Criteria

Success is not only win rate. It also requires:

- reliable installation and upgrade;
- provider choice without architecture forks;
- visible authority mode;
- safe pause and takeover;
- legal, matched execution;
- useful explanations and replay;
- controllable memory and learning;
- resilience to game/mod updates;
- clear degraded behavior when compatibility is uncertain.

## Not Yet Implemented

The current repository does not yet provide:

- a complete installable Steam Workshop player product;
- built-in provider configuration UI;
- OS keychain integration;
- complete authority-mode UI;
- full compatibility handshake;
- automatic guarded learning;
- unrestricted all-screen or wildcard autonomy.

These gaps are split across P13 Player Runtime Beta, P14 optional qualified delegation, and P15 Product Release and Operations. Optional local-autonomy research remains R1. They must not be hidden by calling the current local runner a finished player product.
