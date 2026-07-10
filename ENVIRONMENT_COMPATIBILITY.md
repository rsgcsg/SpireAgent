# Environment Compatibility And Revalidation

This is the canonical subsystem direction for environment identity, evidence validity, update compatibility, and learned-policy revalidation.

It implements the durable decision in [ADR-0004](docs/decisions/ADR-0004-environment-scoped-evidence-and-knowledge.md). Current implementation status remains in [docs/04_CURRENT_STATUS.md](docs/04_CURRENT_STATUS.md).

## Why This Is Core

SpireAgent learns from a changing real game, not from a stationary benchmark. Slay the Spire 2 is in Early Access, balance and content continue to change, and the mod surface is still evolving. Environment identity is therefore part of data truth.

This subsystem is core because it protects:

- replay interpretation;
- proposal evidence;
- stable memory and derived knowledge;
- delegated skills;
- candidate templates;
- provider and adapter comparisons;
- rollback and revalidation.

It is not a game-specific strategy engine.

## Current State

The repository records run, transition, provider, revision, budget, and some provenance metadata, but it does not yet have a complete first-class `EnvironmentFingerprint` or compatibility handshake.

Therefore:

- existing historical evidence remains useful for debugging and architecture review;
- it must not be assumed compatible for stable promotion;
- P9.6 stable promotion remains blocked until the minimal P9.5E foundation exists.

## Minimum P9.5E Foundation

Add read-only identity and scope. Do not change live actions.

### `EnvironmentFingerprint`

Planned minimum fields:

```ts
interface EnvironmentFingerprint {
  schemaVersion: string;
  gameId: "slay_the_spire_2";
  gameBuild?: string;
  releaseChannel?: "main" | "beta" | "unknown";
  contentManifestHash?: string;
  mods: Array<{
    id: string;
    version?: string;
    affectsGameplay?: boolean;
    hash?: string;
  }>;
  adapter: {
    id: string;
    version?: string;
    capabilityHash?: string;
  };
  factSnapshotVersion?: string;
  agentRevision?: string;
  captureProvenance: "organic" | "console_debug" | "fixture" | "unknown";
}
```

Unknown fields must remain unknown. They must not be guessed from current behavior.

### `EvidenceEnvironmentScope`

Every future promotion slice should say:

- which fingerprints it contains;
- whether the slice is exact, compatible, mixed, or unknown;
- which evidence was excluded;
- whether a game/mod/adapter update occurred within the slice;
- why the evidence is eligible for review.

### Compatibility State

```text
compatible:
  required identity is known and the relevant policy scope matches.

degraded:
  basic operation may continue, but evidence cannot promote and selected learned
  features may be disabled.

quarantined:
  learned policy/skill is withheld pending revalidation.

unsupported:
  state/action compatibility is not sufficient for safe operation.
```

Compatibility state must not be inferred from a single successful action.

## Knowledge Invalidation

Each stable learned object must eventually record:

- environment scope;
- dependencies;
- assumptions;
- invalidation triggers;
- last validation fingerprint;
- revalidation result;
- fallback or rollback target.

Examples:

- a card-value lesson depends on card identity, rules text, cost, relevant relic interactions, and content version;
- a boss skill depends on enemy phase behavior, move set, targeting rules, adapter visibility, and version;
- a map routing policy may be more version-tolerant but still depends on node semantics and game mode.

## Revalidation Flow

```text
new or changed fingerprint
  -> dependency impact analysis
  -> quarantine affected learned objects
  -> adapter conformance and fixture checks
  -> shadow/replay validation under the new fingerprint
  -> small organic canary evidence
  -> restore compatible status or keep quarantined
```

No LLM or local policy may mark itself compatible without the gate evidence.

## Data Provenance Rules

- Organic game evidence is not automatically causal evidence.
- Console/debug/fixture evidence is visible and reproducible, but promotion-ineligible by itself.
- Modded and unmodded evidence must not be silently mixed.
- Main and beta branch evidence must not be silently mixed.
- Unknown environment evidence may seed a draft hypothesis, but cannot support stable promotion.
- Provider/model version is experiment context, not game-environment truth; both should be recorded without conflating them.

## P14 Full System

P14 expands the minimum foundation into:

- startup compatibility handshake;
- adapter and mod capability registry;
- content dependency graph;
- automatic quarantine on incompatible changes;
- revalidation queue and canary runner;
- compatibility-aware retrieval;
- user-facing degraded/unsupported status;
- migration and rollback tooling.

P14 does not permit the game adapter or mod to become the strategic brain.

## External Reality

As of July 2026, official sources describe Slay the Spire 2 as Early Access with continuing content, balance, bug-fix, and compatibility work. Recent official patches also changed mod loading and serialization behavior:

- <https://store.steampowered.com/app/2868840/Slay_the_Spire_2/>
- <https://steamcommunity.com/app/2868840/allnews/>
- <https://www.megacrit.com/news/2026-4-17-neowsletter-issue-21/>

The project should re-check official release and modding information before making compatibility assumptions. External sources are evidence about the environment, not authority over SpireAgent's architecture.
