# ADR-0004: Environment-Scoped Evidence And Knowledge

## Status

Accepted

## Context

Slay the Spire 2 is currently an Early Access game. Official updates continue to change content, balance, game behavior, serialization, and mod compatibility. A transition that was valid under one build, beta branch, content manifest, or mod set may not support a policy under another.

The environment is the strongest source of external outcome evidence, but an observed outcome is not precise causal truth. A win does not prove every decision was correct, and a death does not prove the final action caused the loss.

Without explicit environment scope, P9 stable learning could promote stale or incompatible knowledge and then repeatedly reinforce it.

## Decision

All promotion-grade evidence and stable learned objects must be scoped to an explicit `EnvironmentFingerprint`.

The minimum fingerprint should be able to represent:

- game build/version and release channel;
- content or model manifest identity when available;
- enabled mod identities, versions, and gameplay-affecting status;
- adapter identity, version, and capability snapshot;
- fact-dataset/schema version;
- agent schema/revision relevant to interpretation;
- console/debug/fixture provenance;
- multiplayer or other mode identity when relevant.

The system must distinguish:

- `compatible`
- `degraded`
- `quarantined`
- `unsupported`

Old evidence remains readable. It does not silently become promotion-eligible in a new environment.

## Environment Truth Rule

The durable learning sequence is:

```text
pre-state + prediction
  -> authorized action
  -> observed post-state
  -> short- and long-horizon outcomes
  -> weak prediction-error attribution
  -> alternative hypotheses and counterexamples
  -> scoped proposal
  -> shadow/replay/fresh validation
  -> guarded promotion
  -> rollback or revalidation when the environment changes
```

An outcome may correct facts, context, memory, candidate predictions, skills, provider trust, routing, or evaluation assumptions. It must not be converted directly into stable causal knowledge.

## Knowledge Scope

Stable memory, derived knowledge, candidate templates, skills, classification policies, scaffold policies, and budget policies must declare one of:

- build-exact scope;
- compatible-version range;
- content-hash scope;
- environment-independent mechanical invariant, supported by explicit proof or conformance tests.

Unknown scope defaults to quarantine for promotion and delegated-skill use.

## Phase Consequences

- P9-G2/P9.5E must add a minimal read-only environment identity and evidence-scope foundation before G3 promotion design.
- P9-G3/P9.6 promotion records must include environment scope and invalidation rules.
- P9-G3/P9.7 retrieval must record why a learned object is considered compatible.
- P12 owns the full compatibility, invalidation, revalidation, and canary system.
- Product packaging must expose compatibility state rather than silently attempting unsafe operation.

## Official Environment Evidence

The current policy is grounded in official project facts:

- Slay the Spire 2 launched in Early Access on March 5, 2026, and the developers expect continuing content, balance, bug-fix, and compatibility changes: <https://store.steampowered.com/app/2868840/Slay_the_Spire_2/>.
- The July 2, 2026 beta patch changed game content and mod/serialization behavior: <https://steamcommunity.com/app/2868840/allnews/>.
- Official Steam Workshop support arrived in Major Update 2 after the integrated mod loader had already evolved: <https://steamcommunity.com/app/2868840/allnews/>.

These links establish the need for version-aware engineering. They do not define SpireAgent architecture.

## Consequences

- Historical runs are preserved but may be excluded from current promotion slices.
- Console-assisted evidence remains useful for debugging but is never organic promotion proof by itself.
- A game update can invalidate skills and policy evidence without deleting them.
- Revalidation is a first-class operation, not an informal note.
- Stable learning remains disabled until the minimal fingerprint and scope rules are implemented.
