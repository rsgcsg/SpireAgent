# Real Productization Architecture Audit And Roadmap

Status: canonical productization audit and conditional roadmap, 2026-07-22.

This document audits the long-term player product, distribution, security, and
developer-platform shape of SpireAgent. It does not claim that the product,
Companion, secure connector, Workshop package, BYOK UI, plugin runtime, or
Headless host already exists.

The connector-specific architecture audit remains authoritative for the live
game binding and migration details:
[Real STS2 Connector Architecture Audit And Migration Plan](../../../STS2MCP/docs/bridge-v2/REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md).
This report revises and extends that audit where product distribution, local
security, player recovery, secrets, and third-party Agent execution change the
engineering order.

> Consolidation update: this audit's original repository observations remain
> dated evidence. The former root P9--P15 program has since been retired to
> `archive/original-spireagent/`; its phase dependencies are not current
> authority. Use `../STATUS.md`, `../ROADMAP.md`, and the connector current
> status for current checkout facts and next work.

## Executive Verdict

The preferred long-term product boundary is:

```text
real STS2 process
  + minimal trusted Semantic Gateway Mod
        |
        | authenticated, versioned, local Connector Contract
        v
trusted external Companion Core
  + controller/session broker
  + official Re-SpireAgent runtime
  + model broker and BYOK secret storage
  + records, diagnostics, recovery, and player UI
        |
        +-- optional MCP adapter
        +-- explicitly trusted external Agent process
        +-- future sandboxed Agent package, only after a real sandbox exists
```

This boundary is recommended, but the current repository is not that product.
Today it has an in-game REST Gateway, an optional Python MCP wrapper, and a Re
runtime that connects directly to the Gateway and reads its own provider key.
There is no Companion, authenticated Gateway session, Gateway-enforced
controller lease, consumer key store, installer, signed updater, support
bundle, Agent SDK, plugin sandbox, Workshop workspace, or Headless host.

The most important conclusions are:

1. **Source Truth Repair remains first.** C# Bridge `2.0-preview.54` and Re
   `2.0-preview.56` are still incompatible in the clean checkout. A platform
   cannot be built on a contract that its two first-party implementations do
   not share.
2. **Product threat repair moves forward.** The current unauthenticated
   loopback server allows any same-user local process to call both v1 and v2
   mutation routes. Origin filtering mitigates browser-origin abuse, but it is
   not client authentication or controller ownership.
3. **The v2 safety kernel is worth retaining.** State-bound opaque actions,
   exact operands, execute-time validation, one active input owner, semantic
   completion, unknown-no-retry, and exact-environment permission address real
   failures. Productization must not weaken them.
4. **Companion is the right product boundary, not yet an implementation
   authorization for a platform.** First build a small trusted supervisor for
   discovery, control, secrets, diagnostics, and the official Agent. Do not
   pre-build a marketplace or generic plugin framework.
5. **MCP is optional ecosystem glue.** It should eventually sit outside the
   game process and behind Companion policy. It is not the core Connector
   Contract and should not be required for the default player path.
6. **Agent SDK can begin as contracts and fixtures after connector alpha.**
   Arbitrary third-party code execution must wait. A signed assembly or
   `.NET AssemblyLoadContext` is not a sandbox.
7. **Workshop should distribute only the Gateway Mod.** It cannot be assumed
   to install, start, update, or roll back the external Companion, and it must
   never carry provider keys.
8. **Headless remains a separate host experiment.** It may share a
   host-neutral Connector Contract and Agent Runtime Contract later, but it
   cannot inherit live permission or evidence.

## 1. Evidence Boundary

### 1.1 Repository and local environment baseline

The audit was performed after fetching `origin/develop`.

| Fact | Audited value | Evidence class |
|---|---|---|
| Branch | `develop` | Git |
| `HEAD`, `origin/develop`, `FETCH_HEAD` | `79bb9d01e11ae7ad5b614cf42eb05e377143a83d` | Git |
| Worktree at audit start | clean | Git |
| Local STS2 release | `v0.109.0`, commit `c12f634d`, branch `v0.109.0` | installed `release_info.json` |
| Local STS2 `main_assembly_hash` | `-840572606` | installed `release_info.json` |
| Local arm64 `sts2.dll` SHA-256 | `06c78d946ca70658e85abb28f6dc2ee0a023a4467faf0708ff542180fe5f4c82` | installed file |
| C# Bridge protocol | `2.0-preview.54` | source |
| Re protocol | `2.0-preview.56` | source |
| Existing Release/installed Gateway DLL SHA-256 | `7bf3abca5f20594077b31f8e400ef0b27643353846256cb59cb633418a59a8b3` | local files |
| Current game process | not running during this audit | process observation |
| Current loaded Gateway/Modset identity | not established | missing runtime evidence |

Matching files on disk do not prove that a process loaded them. This audit
therefore makes no new loaded, canary, or Organic Qualification claim.

### 1.2 Evidence vocabulary

This report distinguishes:

- **source fact**: behavior directly visible in the current repository;
- **exact game-source fact**: behavior decompiled from the installed exact
  `sts2.dll`;
- **test evidence**: a fixture or automated check, not a loaded-game claim;
- **build/install evidence**: an artifact exists or matches a hash, not proof
  that it was loaded or exercised;
- **Organic runtime evidence**: a bounded real-game lifecycle on an exact
  loaded identity;
- **external project evidence**: another project demonstrates feasibility or
  simplicity, not compatibility with SpireAgent;
- **engineering inference**: a proposed decision that still needs a test.

### 1.3 Exact-source findings relevant to productization

The exact `ModManifest` defaults `affects_gameplay` to `true` and
`ModManager.GetGameplayRelevantModNameList()` uses that flag when identifying
gameplay-relevant loaded Mods. The current SpireAgent manifest sets it to
`false`. This audit does not silently flip the value: whether an external
controller must be gameplay-relevant in every single-player and co-op product
mode is a release-policy question that needs a current UI/multiplayer test.
The current value is a **release blocker requiring an explicit decision**, not
proof of safe product metadata.

The exact Mod manager loads both local and Steam Workshop directories and
resolves duplicate IDs using source and version. A Companion must therefore
verify the Gateway identity actually reported by the loaded process; finding a
file in either directory is insufficient.

Godot's official guidance says the active scene tree is not thread-safe. The
current main-thread queue is therefore a required host adapter property, not
unnecessary ceremony.

### 1.4 Repository evidence reviewed

The implementation audit used these primary repository entrypoints rather than
inferring behavior from status prose alone:

- Gateway listener and v1 routes: `STS2MCP/McpMod.cs` and
  `STS2MCP/McpMod.Actions.cs`;
- v2 transport, Origin defense, protocol, and in-memory command state:
  `STS2MCP/BridgeV2/Transport/McpMod.BridgeV2.cs`,
  `STS2MCP/BridgeV2/Transport/LoopbackOriginPolicy.cs`,
  `STS2MCP/BridgeV2/Protocol/BridgeContracts.cs`, and
  `STS2MCP/BridgeV2/Runtime/BridgeCommandLedger.cs`;
- Gateway packaging and MCP edge: `STS2MCP/mod_manifest.json`,
  `STS2MCP/README.md`, and `STS2MCP/mcp/server.py`;
- Re connector/session/config path:
  `Re-SpireAgent/src/integrations/sts2mcp/restAdapter.ts`,
  `Re-SpireAgent/src/integrations/sts2mcp/bridgeV2Client.ts`,
  `Re-SpireAgent/src/integrations/sts2mcp/bridgeV2Protocol.ts`,
  `Re-SpireAgent/src/runtime/runtimeLock.ts`, and
  `Re-SpireAgent/src/config/env.ts`;
- connector, visibility, migration, and host boundaries:
  `STS2MCP/docs/bridge-v2/CURRENT_STATUS.md`, `PROTOCOL.md`,
  `PLAYER_VISIBLE_COVERAGE.md`, `LIVE_GAME_CONNECTION_BOUNDARY.md`,
  `ARCHITECTURE_EVOLUTION_PLAN.md`, the connector audit, and
  `docs/current/headless/TARGET_ARCHITECTURE.md`;
- current repository/product authority: `docs/current/STATUS.md`,
  `docs/current/ARCHITECTURE.md`, `docs/current/PRODUCT.md`, and
  `Re-SpireAgent/README.md`.

The installed exact-build review separately examined the current release
descriptor, `sts2.dll` identity, and decompiled `ModManifest`/`ModManager`
behavior. Those local proprietary files are evidence inputs only and are not
copied into this repository.

## 2. Product Requirements And Users

### 2.1 Product thesis

SpireAgent should let a normal player install a trusted game Gateway and an
external Companion, select an Agent/model, understand who controls the game,
pause or take over, and recover from incompatibility without editing files or
running shell commands.

The strategic North Star remains unchanged: the LLM is the principal strategic
player inside a hard execution and evidence shell. Product packaging must not
move model logic, prompts, memory, or learning into the Mod.

### 2.2 Supported user groups

| User | Required product path | Explicit non-goal |
|---|---|---|
| Normal player | Workshop Gateway + installed Companion + guided provider setup | terminal, raw MCP configuration, direct REST |
| Advanced player | authority modes, diagnostics, model/provider tuning, data export | direct native object access |
| MCP user | generated stdio MCP configuration through Companion | MCP as the only official Agent architecture |
| Agent developer | versioned SDK, fixtures, replay, external process protocol | Gateway credential or arbitrary native commands |
| Connector maintainer | exact-source audit, contract conformance, canary and qualification tooling | using product permissions as development shortcuts |
| Future plugin author | capability-scoped package after an isolation model is proven | implicit trust from a signature or package listing |

### 2.3 Product non-goals

- The Workshop Mod is not a complete Agent runtime.
- The Companion is not a second STS2 rules engine.
- Re, MCP, and third-party Agents do not reconstruct legal actions or semantic
  completion.
- A successful model response is not execution authority.
- A signed package is not a sandbox.
- A local port is not automatically trusted.
- Headless is not a substitute for live-host evidence.
- Early product versions do not need an Agent marketplace.

## 3. Current Productization Blockers

### 3.1 Critical blockers

| Blocker | Current evidence | Minimum reproducible failure | Required disposition |
|---|---|---|---|
| C#/Re protocol drift | preview.54 versus preview.56 | current Gateway response fails strict Re decode | complete connector Stage 0 and add cross-language fixtures |
| No Gateway authentication | plain loopback REST client/server; no authorization header | another local process submits a v1 or v2 mutation | ephemeral authenticated session, release-default deny |
| No Gateway controller lease | only Re data-dir lock exists | two clients read the same state and race mutations | Gateway-enforced one-controller lease plus read-only observers |
| Restart ambiguity | command ledger is process-memory only | game restarts after commit and poll returns no record | runtime epoch and explicit `unknown_after_restart`; no replay |
| v1 mutation bypass | v1 and v2 routes share the same listener | client bypasses v2 state/action/completion contract | release-default disable or separately authorize v1 mutations |
| No consumer secret boundary | Re reads API key directly from environment | plugin/Agent process inherits or reads provider credentials | Companion-owned OS-backed key store and model broker |
| No installed/loaded product handshake | files and local hashes only | Companion sees stale or duplicate Gateway package | loaded identity and compatibility negotiation before control |
| No recovery UX | no Companion state machine/support bundle | timeout or incompatibility looks like a hung Agent | typed health states, pause, takeover, support bundle, recovery |

### 3.2 High product debt

- A fixed port can collide; the product lacks a user-private runtime descriptor
  carrying the actual port and runtime epoch.
- Current `LoopbackOriginPolicy` accepts requests without `Origin`, which is
  necessary for native clients but means Origin cannot authenticate them.
- Current CORS allows loopback browser origins. Authentication remains required
  even if Origin validation is retained.
- Request IDs are bounded and idempotent only inside one Gateway runtime.
- Companion installation, signing, upgrade, rollback, uninstall, and crash
  recovery are unimplemented.
- There is no compatibility-range policy between Gateway, Connector Contract,
  Companion, Re, and Agent Runtime Protocol.
- There is no player-facing distinction among game missing, Mod absent, Mod
  disabled, incompatible identity, controller occupied, provider unavailable,
  Agent crashed, and command outcome unknown.
- There is no privacy inventory or redacted support-bundle contract.
- There is no public-release decision for `affects_gameplay`, co-op support, or
  local/Workshop duplicate installs.

### 3.3 What v2 has measurably improved

The previous connector audit recorded four historical strict-v2 runs with 211
settled decisions, three stale-state refusals, and two non-actionable-state
refusals. That evidence supports the value of state-bound actions and
Fail-Closed refusal. It does not establish:

- complete-run success;
- current-checkout compatibility;
- authenticated single-controller product operation;
- player-visible information completeness;
- current-build Workshop compatibility;
- recovery after game or Companion restart.

The correct product conclusion is not that v2 is over-engineered or complete.
Its mutation safety kernel is justified, while its handwritten coverage and
missing product boundary both need repair.

## 4. Reassessment Of The Previous Connector Audit

| Prior decision | Productization verdict | Revision |
|---|---|---|
| Source Truth Repair is first | retain | add security/release checks before public control |
| one active owner and state-bound actions | retain | enforce controller ownership at Gateway session level too |
| Gateway Mod + external Companion | retain conditionally | Companion begins small; no generic platform first |
| REST is current primary transport | retain for first alpha | authenticate it; evaluate IPC only with measured benefit |
| MCP is optional | strengthen | move product MCP behind Companion; do not expose Gateway credential |
| exact-environment permission | retain | separate read degradation from mutation denial; never auto-promote |
| typed operation/transaction abstractions | defer broad forms | product auth, epoch, conformance, and recovery are higher priority |
| Headless after a specific provider/transaction pilot | revise | gate on host-neutral contract and live reliability, not one Surface name |
| v1 retirement per operation/journey | retain | public release also disables unmediated v1 mutation by default |
| Agent platform later | split | schema/fixtures can start after connector alpha; code marketplace remains late |

### 4.1 What the previous audit omitted

The connector audit did not fully cover:

- local API authentication and controller credential ownership;
- the difference between browser Origin defense and native-client auth;
- consumer BYOK storage and provider-log redaction;
- Workshop-versus-Companion split installation;
- signed Companion distribution and realistic rollback limits;
- untrusted Agent/plugin isolation;
- data privacy, support bundles, consent, and telemetry;
- release metadata and upstream/proprietary licensing review;
- player onboarding and failure recovery;
- supply-chain and update-channel governance.

These omissions do not invalidate the connector audit. They change the order of
work required before public distribution.

### 4.2 Public project comparison and simpler alternatives

The reviewed public projects are useful counterweights to local complexity,
but their README claims are external project evidence, not an independent
qualification of their safety or compatibility.

| Project | Demonstrated simpler approach | What SpireAgent should adopt | What it does not prove for SpireAgent |
|---|---|---|---|
| [Gennadiyev/STS2MCP](https://github.com/Gennadiyev/STS2MCP) | one in-game localhost REST API plus an optional stdio MCP wrapper, broad menu/single-player/multiplayer coverage, direct release artifacts | keep MCP optional; retain simple health/install diagnostics; avoid requiring Companion for developer-only observation | its README warns that external programs can control the game and reports testing against an older game build; broad coverage does not prove authenticated control, state-bound exact operands, restart semantics, or current SpireAgent compatibility |
| [CharTyr/STS2-Agent](https://github.com/CharTyr/STS2-Agent) | local HTTP Mod, stdio-first MCP scripts, SSE to reduce polling, broad legal-action surfaces, and a bounded reward-resolution helper | use stdio as the default MCP product adapter; measure whether event delivery reduces polling; provide cross-platform launch scripts and explicit health checks | an event stream or atomic convenience action is not proof of semantic completion, exact-environment permission, one-controller enforcement, or non-duplication after an unknown outcome |
| [wuhao21/sts2-cli](https://github.com/wuhao21/sts2-cli) | a patched real-assembly Headless host with Godot stubs, a compact stdin/stdout JSON protocol, JSONL logs, and broad terminal play | treat a separate Headless host and a compact Agent protocol as feasible; reuse fixture/logging ideas after the live contract stabilizes | a synthetic patched host has distinct bindings, lifecycle, identity, visibility, and permission evidence; index-shaped commands and self-reported engine equivalence cannot import live qualification |

The product should deliberately copy the low-ceremony parts that survive its
threat model: one health path, generated launch/configuration, stdio adapters,
compact framed decisions, JSONL evidence, and event delivery only where metrics
justify it. It should not copy direct unauthenticated mutation into the consumer
path or collapse native legality/completion into an external convenience API.

This comparison also rejects a false choice. SpireAgent does not need either a
large universal semantic framework or an index-only REST bot. The justified
middle is a small native safety kernel with generated contracts, plus simple
external product tooling. Every mechanism beyond that must show a measured
failure reduction, migration benefit, or player-experience gain.

## 5. Selected Long-Term Architecture

### 5.1 Four trust domains

#### Domain A: STS2 and Semantic Gateway Mod

Trusted with game observation and mutation. Owns:

- exact loaded game/Mod/Gateway identity;
- player-visible projection and hidden-information exclusion;
- exactly one active game input owner;
- legal action publication, exact operands, and state binding;
- execute-time revalidation and native Commit;
- command lifecycle, semantic completion, and unknown outcome;
- mutation permission and controller lease enforcement.

It must not own prompts, provider SDKs, API keys, long-term Agent memory,
learning, arbitrary plugin execution, or remote networking.

#### Domain B: Companion Core

Trusted local supervisor. Owns:

- Gateway discovery, authentication, session and lease lifecycle;
- protocol negotiation and strict decoding;
- official Re runtime supervision;
- model broker, BYOK secret handles, cost and timeout policy;
- authority-mode UI, pause/takeover, diagnostics, records, and recovery;
- optional MCP and Agent Runtime adapters;
- update compatibility and redacted support bundles.

It may narrow or reject a Gateway action. It cannot create an action, rebuild
game legality, or declare completion.

#### Domain C: Agent and model execution

The first-party Re Agent may initially run as trusted Companion code or as a
supervised first-party process. Third-party Agents should run out of process.
They receive only a bounded Agent Runtime Contract and return a selected
advertised action ID plus bounded explanation metadata.

An Agent does not receive:

- the Gateway authentication secret;
- a controller lease token;
- native STS2 objects or reflection access;
- another provider's API key;
- arbitrary Companion filesystem access by contract.

#### Domain D: ecosystem adapters

MCP, CLI, UI automation, replay viewers, and future SDK tooling are adapters to
Companion policy. They do not become independent game authorities.

### 5.2 Why this is preferable to the alternatives

- Putting the full Agent in the Mod couples provider dependencies and secrets
  to the game process and expands crash/update risk.
- Letting every Agent connect directly to the Gateway duplicates auth,
  retries, records, and recovery and exposes the controller credential.
- Loading arbitrary Agent assemblies in Companion gives them all Companion
  process permissions. Microsoft explicitly states that
  `AssemblyLoadContext` provides no security features.
- Replacing REST with cross-platform IPC before measuring REST failure adds
  deployment work without fixing semantic correctness. Authenticated loopback
  REST is the lower-risk first product step.
- Treating MCP as the internal protocol couples product architecture to one
  ecosystem transport. The Connector and Agent Runtime contracts should be
  transport-neutral.

## 6. Contract Boundaries

### 6.1 Connector Contract: Gateway to Companion

The stable, host-facing contract should contain:

- `gateway_runtime_epoch` and monotonic observation sequence;
- exact game, branch, assembly, Gateway, Modset, and host identity;
- capability and compatibility ranges;
- player-visible state with explicit completeness/omission metadata;
- advertised opaque actions bound to one exact state and epoch;
- read-only Inspection catalog and coherent observation bundles;
- authenticated session identity and role;
- controller lease identity, expiry, and revocation state;
- command request identity and terminal outcome;
- typed stale, denied, incompatible, unknown, and restart errors.

It must not contain provider, prompt, memory, or learning concepts.

### 6.2 Agent Runtime Contract: Companion to Agent

This is a separate contract:

```text
initialize(agent identity and declared capabilities)
  -> decision request(observation, advertised actions, authority mode, budget)
  -> decision(selected action_id, reason summary, optional diagnostics)
  -> validation result
  -> execution outcome or rejection
```

The Companion checks that the selection belongs to the exact decision request,
then submits through its lease. The Gateway still performs authoritative
revalidation. This double check is defense in depth, not duplicated game
legality.

### 6.3 REST, IPC, and event delivery

Initial product decision:

- keep loopback REST for Gateway-to-Companion alpha;
- bind only locally and require a rotating high-entropy runtime credential;
- place port, epoch, protocol, PID, and credential reference in a user-private
  runtime descriptor with OS-appropriate permissions;
- separate authenticated read-only observer sessions from one mutation lease;
- retain Origin validation for browser defense;
- do not expose the Gateway credential to MCP or Agent processes;
- consider SSE/long polling only after settlement/polling metrics show value;
- evaluate Unix domain sockets/named pipes as a later transport experiment,
  not an architectural prerequisite.

A same-user malware process may still read user-owned resources. The product
threat model can prevent accidental clients, browsers, and untrusted child
processes from receiving credentials; it cannot claim protection after the OS
account itself is compromised.

## 7. Control, Restart, And Unknown Outcome

Authentication and action authority are distinct:

- an authenticated observer may read but never submit;
- only one authenticated controller lease may mutate;
- the Gateway, not Companion convention, enforces the lease;
- human takeover revokes or pauses the lease and is visible to Companion;
- every action remains state-bound even while a lease is valid;
- lease loss cannot turn a pending unknown command into a retry.

The runtime epoch changes whenever the Gateway process restarts. If a command
was submitted under an old epoch and its terminal event was not observed, the
Companion records `unknown_after_gateway_restart`, stops autonomous execution,
and asks the player to inspect/recover. A new process must never accept a replay
of the old command as if request-id idempotency were durable.

Crash recovery states should be explicit:

| Failure | Product state | Safe response |
|---|---|---|
| game not running | disconnected | offer launch instructions; no retry loop |
| Gateway absent/disabled | gateway unavailable | show Mod setup; no Agent start |
| protocol incompatible | update required | read-only diagnostics if safe; no mutation |
| controller occupied | observer/blocked | identify holder when safe; request takeover |
| Companion restart, no pending command | reconnect | acquire new session/lease after fresh state |
| Companion restart, old pending command | outcome unknown | do not resubmit; require resolution |
| Agent crash | Agent stopped | revoke/pause control; preserve Gateway state |
| provider timeout | decision failed | no game action; retry decision only against fresh state and policy |
| command timeout after start | outcome unknown | no automatic retry |

## 8. Workshop And Companion Distribution

### 8.1 Workshop package

The Workshop item should contain only reviewed game-side content:

- Gateway DLL;
- optional PCK only if player UI/assets require it;
- STS2 manifest and dependency declarations;
- player-visible version/compatibility metadata;
- license and required third-party notices;
- no API key, prompt, model SDK, mutable evidence, save, or Agent package.

Mega Crit states that STS2 has an integrated Mod loader and that Steam Workshop
is now the official browse/install path. The official uploader places the
workspace `content` directory in the Workshop item. Neither source establishes
that a Workshop Mod can install or start an arbitrary external Companion.

Workshop subscription is not loaded identity. Steam documentation also notes
that newly subscribed items may finish installing after the game starts. The
Companion must wait for the Gateway's loaded handshake, not infer readiness
from subscription or disk presence.

### 8.2 Companion distribution

The Companion should be a separate, signed, per-user desktop package for each
supported OS. Initial product versions should prefer explicit signed releases
and a visible update action over a self-updater. A self-updater is a separate
supply-chain feature requiring signature verification, rollback testing, and a
revocation plan.

The Companion must support:

- install and uninstall without modifying the game binary;
- game and Gateway discovery;
- no-admin operation where the OS permits;
- version compatibility negotiation;
- last-known-good Companion rollback;
- user data export/delete;
- redacted diagnostic bundle;
- clear separation of stable, beta, and developer channels.

### 8.3 Rollback realism

Do not promise one-click rollback of an arbitrary Steam Workshop item version
until a real supported mechanism is proven. Reviewed Steamworks documentation
describes install/update state and callbacks, not a product-controlled arbitrary
per-item version pin. Safe initial recovery is:

1. Gateway detects incompatibility and disables mutation;
2. Companion can roll itself back to a compatible signed build;
3. maintainers may use separate stable/beta Workshop items or a documented
   local developer package if policy and UX permit;
4. no automatic downgrade may bypass Steam or overwrite a loaded Mod.

### 8.4 Release metadata decision

Before private Workshop packaging, explicitly decide and test:

- `affects_gameplay` behavior in single-player and co-op;
- Mod ID and product naming;
- dependency policy such as BaseLib;
- duplicate local/Workshop source UX;
- minimum game version versus exact mutation permission;
- upstream MIT notices and proprietary game-file exclusions;
- whether multiplayer is supported, observation-only, or excluded.

## 9. BYOK, Privacy, And Model Broker

Development `.env.local` remains acceptable for a local developer workflow. It
is not the consumer secret design.

The product Model Broker should:

- store keys using OS-backed secret storage where available;
- expose opaque provider-profile handles to the official Agent;
- never include keys in prompts, replay, logs, crash reports, telemetry, Mod
  files, command lines, or child-process environments;
- redact authorization headers and known provider-key formats;
- support delete, rotate, test, and disable;
- show provider endpoint, model, request cost/usage, timeout, and data-sharing
  implications;
- apply endpoint allowlists or explicit user approval for custom endpoints.

Windows Credential Locker and macOS Keychain are suitable native secret stores.
Linux/SteamOS requires a documented Secret Service/keyring strategy and a
Fail-Closed fallback; plaintext configuration is not an acceptable silent
fallback.

Privacy work must inventory:

- gameplay observations and prompts sent to providers;
- local paths, Steam/profile identifiers, Mod lists, and crash metadata;
- run records, memory, learned policies, and model responses;
- opt-in telemetry and support-bundle content;
- retention, export, and deletion behavior.

## 10. Third-Party Agent SDK And Plugin Security

### 10.1 Recommended first developer model

The first public SDK should be process-based and explicitly trusted by the
user. It provides:

- generated contract types;
- stdio-framed Agent Runtime Protocol;
- deterministic fixtures and negative compatibility cases;
- replay-only test harness;
- sample Agent with no Gateway credential;
- capability declaration and version negotiation;
- time, output, and cancellation limits;
- structured logs and outcome notifications.

This is a **developer integration**, not a sandbox. The UI must state that a
manually launched third-party process has the user's normal OS permissions.

### 10.2 Why an in-process plugin marketplace is rejected

Microsoft documents that `AssemblyLoadContext` provides loading isolation but
no security features; all loaded code has full process permissions. Therefore:

- do not load untrusted Agent DLLs into Companion;
- do not rely on signatures to restrict behavior;
- do not let a plugin read Model Broker secrets;
- do not claim `worker_threads`, Python virtual environments, or dependency
  isolation are security sandboxes.

A later untrusted plugin platform requires a separate decision after a
time-boxed isolation experiment. Candidates include a capability-oriented WASI
runtime or OS sandbox/container profiles. The experiment must prove filesystem,
network, process, secret, and Gateway isolation on every supported OS. If that
cannot be provided, keep the platform explicitly full-trust and user-launched.

### 10.3 Signing and registry

Package signing provides integrity and publisher provenance. It does not make
code safe. A public registry additionally requires:

- package schema and reproducible metadata;
- signature and publisher identity policy;
- security review and permission disclosure;
- malware response, revocation, and takedown;
- compatibility ranges and update policy;
- privacy and license declarations;
- sandbox or explicit full-trust warnings.

Do not build the registry before SDK usage proves demand and the execution
trust model is settled.

## 11. MCP Product Role

MCP remains useful for advanced users and ecosystem integration, but the
product path should be:

```text
MCP client -> Companion-hosted MCP adapter -> Companion policy -> Gateway
```

Preferred local mode is stdio, where the client launches the adapter. The MCP
specification recommends stdio where possible and requires Origin validation,
localhost binding, and proper authentication for Streamable HTTP. A network
MCP mode therefore needs its own authorization; it must not reuse or reveal the
Gateway controller token.

MCP tools should expose bounded observation, advertised-action selection,
command outcome, pause, and diagnostics. They must not expose raw reflection,
arbitrary native methods, arbitrary files, hidden RNG, or a bypass around
Companion authority modes.

## 12. Live And Headless Relationship

Live and future Headless hosts may share:

- wire-neutral observation/action/command schemas;
- runtime epoch and command outcome semantics;
- hidden-information policy vocabulary;
- conformance fixtures;
- Agent Runtime Contract and Companion APIs.

They must not share by assumption:

- scene or object bindings;
- Commit adapters;
- lifecycle pumping;
- permission profiles;
- loaded identity;
- Organic Qualification evidence.

Headless feasibility should begin only after the live Connector Contract has a
single source of truth, authenticated session semantics, restart behavior,
cross-language conformance, and a measured live reliability baseline. It
should not be blocked on one named Surface such as `deck_enchant_selection`,
nor allowed merely because a protocol is transport-neutral.

## 13. Re-SpireAgent Migration

Re currently owns both strategic runtime and direct Gateway connector logic.
The lowest-risk migration is staged:

1. Repair current C#/Re protocol truth without adding Companion behavior.
2. Extract or generate a host-neutral Connector client and conformance fixtures
   used by Re and the future Companion.
3. Introduce Companion Core as the sole product holder of Gateway credentials
   and controller lease.
4. Run the first-party Re Agent behind an internal Agent Runtime Contract.
5. Keep direct Re-to-Gateway mode only as an explicit developer mode, disabled
   in consumer builds.
6. Move optional MCP exposure to Companion after the product control path is
   stable.

Do not rewrite Re strategy merely to create a Companion. The migration should
move transport/control/secrets outward while preserving normalized strategic
inputs and the North Star.

## 14. Player Journeys

### 14.1 First install

1. Player subscribes to the Gateway Mod in Workshop.
2. Player installs signed Companion separately.
3. Companion finds STS2 and explains if the Workshop item is still downloading,
   disabled, duplicated, incompatible, or not loaded.
4. Game displays the Gateway and its control state.
5. Companion authenticates and obtains an observer session.
6. Player configures a model through OS-backed storage or chooses a local
   provider.
7. Connection test reads identity and a safe observation; it does not mutate.
8. Player explicitly selects Observe, Copilot, or LLM-primary control.
9. Companion requests the mutation lease only for an action-capable mode.

### 14.2 Normal operation

The player always sees:

- game/Gateway compatibility;
- Agent and provider identity;
- current authority mode and lease holder;
- last action and outcome;
- pending/unknown state;
- cost/usage summary;
- pause and take-over controls.

### 14.3 Recovery

Recovery must not be a generic `connection failed` dialog. It should identify
the exact failure class, retain the last safe record, revoke control where
needed, avoid duplicate actions, and offer only safe next steps.

## 15. Rejected Or Deferred Alternatives

| Alternative | Decision | Reason |
|---|---|---|
| full Agent and keys inside Mod | reject | game-process dependency, secret, crash, and update risk |
| every Agent talks directly to Gateway | reject for consumer mode | credential and controller conflict; duplicated recovery |
| MCP as internal core protocol | reject | ecosystem transport should not own game semantics |
| immediate named-pipe/UDS rewrite | defer | authenticated REST fixes current trust gap with less cross-platform risk |
| in-process third-party DLL plugins | reject as sandbox | full Companion process permissions |
| public Agent registry now | defer | no sandbox, revocation, privacy, or compatibility operation |
| universal game Effect DSL | reject | becomes a second game engine and execution surface |
| Headless as current product connector | defer | separate host identity and live-equivalence risk |
| one-click Workshop Gateway rollback promise | reject until proven | current reviewed platform docs do not provide that contract |
| generic Companion platform before official path | reject | builds abstractions before one player journey works |

## 16. Conditional Product Roadmap

The stages are gated by engineering results, not dates. `PROD-*` is a
cross-cutting product workstream aligned with the functional gates in
[`../ROADMAP.md`](../ROADMAP.md). The former root P9--P15 phase book is
historical and is not a dependency or authority for this roadmap. Product work
completed early is prerequisite evidence, not an implementation or release
claim.

### PROD-0: Product Truth And Threat Repair

Entry: current clean `develop` state.

Work:

- complete connector Source Truth Repair and cross-language fixtures;
- write the local threat model and authenticated-session contract;
- decide v1 release-default policy;
- define runtime epoch and restart semantics;
- decide `affects_gameplay`, co-op scope, licenses, and proprietary-file rules;
- obtain one current loaded read-only handshake and low-risk action canary.

Exit:

- C#, Re, fixtures, docs, installed and loaded identity agree;
- no unauthenticated mutation path is accepted in the target release profile;
- unresolved old-epoch commands cannot be resubmitted automatically;
- release metadata and support scope have explicit decisions.

Dependencies: none. This is the immediate stage.

### PROD-1: Secure Connector Alpha

Entry: PROD-0 passes.

Work:

- implement ephemeral Gateway authentication and private runtime descriptor;
- implement read-only sessions and one Gateway-enforced controller lease;
- include runtime epoch in state/action/command identity;
- add lease conflict, restart, stale, and duplicate fault tests;
- establish per-operation settlement/unknown/latency metrics.

Exit:

- unauthorized, expired, wrong-role, wrong-epoch, and dual-controller mutations
  fail closed;
- fault injection proves no duplicate execution after timeout/restart;
- one exact live journey is reproducible through the secured contract.

### PROD-2: Companion Foundation

Entry: PROD-1 contract is stable enough for one supported compatibility range.

Work:

- implement a minimal Companion Core, not a plugin platform;
- discover game/runtime descriptor and negotiate compatibility;
- own observer/controller sessions, pause, takeover, and lifecycle state;
- supervise the first-party Re Agent;
- record redacted connector and Agent evidence;
- expose typed health and recovery states.

Exit:

- the default player control path no longer gives Re the Gateway credential;
- game, Gateway, Companion, Agent, and provider failures are distinguishable;
- Companion restart and Agent crash exercises preserve unknown-no-retry.

### PROD-3: Private Packaging And Recovery

Entry: PROD-2 works on developer machines without manual protocol repair.

Work:

- create an official Workshop workspace for a private/unlisted Gateway item;
- create signed Companion packages for each actually supported OS;
- implement install detection, compatibility UI, uninstall, update, and
  last-known-good Companion rollback;
- define support bundle, data export/delete, privacy notice, and telemetry
  consent;
- run clean-machine install and update drills.

Exit:

- a fresh user account can install, connect, diagnose, update, and recover
  without a shell;
- loaded Gateway identity, not disk presence, gates control;
- no secret or mutable run artifact enters Workshop or release packages.

### PROD-4: Official Agent And BYOK Alpha

Entry: PROD-3 packaging/recovery is usable and PROD-2 control remains clean.

Work:

- integrate OS-backed secrets and Model Broker;
- run Re through the Agent Runtime Contract;
- expose Observe, Copilot, and LLM-primary modes;
- implement cost, privacy, pause, and takeover UX;
- retain dev-only environment configuration outside consumer mode.

Exit:

- no Agent process receives raw API keys or Gateway credentials;
- model/provider failures cannot create game actions;
- bounded organic runs record complete authority and outcome chains;
- player usability review confirms failure states are actionable.

### PROD-5: Player Beta

Entry: PROD-4 satisfies private security and recovery review.

Work:

- small opt-in player cohort;
- stable/beta channel policy;
- compatibility response for game and Mod updates;
- support operations and release checklist;
- measure installation, run reliability, unknown outcomes, recovery, and cost.

Exit:

- defined cohort success gates are met across supported OS/builds;
- no unclassified unauthorized or duplicate mutation exists;
- update/rollback/support procedures have been exercised, not merely written.

### PROD-6: External Agent Protocol And Optional MCP

Entry: Connector and Agent Runtime contracts have survived PROD-5 without
breaking churn.

Work:

- publish generated SDK types, fixtures, replay harness, and sample Agent;
- support explicitly trusted out-of-process developer Agents;
- move MCP behind Companion and default it to stdio;
- document permissions and full-trust limitations.

Exit:

- at least two independently implemented Agents pass conformance without direct
  Gateway access;
- malformed, stale, over-budget, and unauthorized decisions fail closed;
- MCP cannot bypass Companion authority or reveal its credentials.

### PROD-7: Plugin Platform Decision

Entry: external Agent demand and threat model justify more than developer mode.

Work:

- time-box OS/WASI sandbox experiments;
- test filesystem, network, process, secret, and Gateway isolation;
- decide sandboxed platform, explicit full-trust platform, or no platform;
- only then design signing, registry, review, revocation, and updates.

Exit:

- an explicit security decision is approved with platform-specific evidence;
- no marketplace is launched on the assumption that loading isolation is a
  security boundary.

### H Track: Future Headless Host

Entry: live Connector Contract, Companion, conformance, and reliability are
stable enough to identify a host-neutral boundary, and a separate feasibility
review approves one host approach.

Exit and permission remain host-scoped. Headless cannot inherit live evidence.

## 17. Recommended Small PR Sequence

1. **Contract truth fixture PR:** select one protocol revision; emit
   language-neutral golden/negative fixtures; decode with real Re code.
2. **Gateway threat-contract PR:** document and test auth roles, runtime epoch,
   lease state machine, restart and v1 release policy without broad coverage.
3. **Authenticated descriptor PR:** rotate a local credential per Gateway
   runtime, protect the descriptor, redact logs, reject unauthenticated calls.
4. **Controller lease PR:** one mutation lease, observer sessions, expiry,
   revoke/takeover, conflict diagnostics.
5. **Epoch/command PR:** bind state/actions/commands to runtime epoch and make
   restart unknown explicit.
6. **Release-profile PR:** disable unmediated v1 mutation in product profile;
   decide manifest/co-op/licensing; add package-content checks.
7. **Companion skeleton PR:** discovery, health model, strict Connector client,
   no Agent/plugin abstraction yet.
8. **Re supervision PR:** move control credential and submit/poll ownership to
   Companion while keeping Re strategy unchanged.
9. **Packaging spike PR:** private Workshop workspace plus one signed Companion
   package and clean-machine install test.
10. **Secret broker PR:** one provider through an OS-backed secret handle with
    log/support-bundle redaction tests.
11. **Agent Runtime PR:** first-party Re decision protocol and fixtures.
12. **Recovery PR:** game/Gateway/Companion/Agent/provider restart fault matrix.
13. **MCP relocation PR:** stdio adapter over Companion, no Gateway token.
14. **SDK preview PR:** generated types, fixtures, replay harness, explicit
    full-trust external process warning.

Each PR must be independently rollbackable. No PR may use an Agent package,
manifest declaration, or successful fixture to expand Gateway permission.

## 18. Measurable Success Criteria

| Measure | Safety/product gate |
|---|---|
| cross-language conformance | every accepted fixture decodes; every negative fixture fails closed |
| unauthorized mutation | zero accepted in auth/role/lease/epoch tests |
| duplicate execution | zero in timeout, disconnect, restart, and request replay tests |
| command traceability | every submit has epoch, request, state, action, lease, and terminal/unknown record |
| v2/v1/fail-closed ownership | every game step classified; no mixed journey called all-v2 |
| loaded identity | every controlled session records game/Gateway/Modset/runtime identity |
| ordinary journey completion | measured per journey, OS, exact environment, and failure class |
| unknown outcome rate | separately reported per operation; target set after honest baseline |
| settlement latency | p50/p95/max per operation and environment |
| update blast radius | count scopes disabled, re-audited, canaried, and requalified per update |
| install success | clean-machine cohort rate with categorized failure, not anecdotal success |
| recovery success | each fault drill reaches a known safe state without duplicate action |
| secret leakage | zero keys in logs, prompts outside intended provider request, artifacts, support bundles, or children |
| player control | pause/takeover visibly revokes mutation before next command |
| SDK compatibility | independent Agents pass the same conformance suite |

Operational thresholds that lack a current baseline must be calibrated from
PROD-1 and PROD-3 evidence. They must not be invented to declare readiness.

## 19. Open Questions And Required Experiments

1. Does `affects_gameplay=false` match intended co-op and save behavior for an
   external controller, or does it misrepresent the Mod? Test exact current UI
   and multiplayer behavior before private Workshop publication.
2. Can the Gateway write a cross-platform user-private runtime descriptor with
   reliable ACLs from inside STS2? Prototype Windows, macOS, Linux/SteamOS.
3. Is authenticated loopback REST operationally reliable enough, or do port
   conflicts/firewalls justify UDS/named pipes after PROD-1 metrics?
4. How should Companion discover multiple Steam libraries, beta branches, and
   duplicate local/Workshop Mod sources without guessing?
5. Which operating systems are actually supported by the game and by a
   maintainable Companion packaging toolchain?
6. Can provider keys be stored through one cross-platform abstraction without
   insecure Linux fallbacks?
7. Which game facts, prompts, model responses, paths, and identifiers may enter
   opt-in diagnostics, and for how long?
8. What is the minimum in-game Gateway UI needed for status, pairing, pause,
   takeover, and emergency disable?
9. Can a WASI Agent model support useful LLM Agents, or must third-party Agents
   remain explicitly trusted OS processes?
10. Does Steam Workshop provide an acceptable release-channel/rollback model
    for this Mod, or are separate stable/beta items and manual emergency
    packages required?
11. What licenses and notices are required for retained upstream code,
    dependencies, model SDKs, Companion UI libraries, and generated artifacts?
12. Which live contract subset is truly host-neutral enough to justify a
    future Headless feasibility experiment?

## 20. Evidence Still Missing

This audit did not obtain:

- a current running process or loaded Gateway capability response;
- a current exact Modset handshake;
- a fresh build from the current source followed by install/load proof;
- a current C#/Re end-to-end decode;
- any authenticated session or controller-lease implementation;
- clean-machine Workshop or Companion installation evidence;
- OS signing/notarization evidence;
- OS key-store integration evidence;
- third-party Agent isolation evidence;
- player usability evidence;
- Headless feasibility evidence.

These are implementation and validation tasks. The existence of this document
does not satisfy them.

## 21. External Sources Reviewed

- Mega Crit, integrated Mod loader and official Workshop launch:
  <https://www.megacrit.com/news/2026-6-19-neowsletter-issue-23/>
- Mega Crit official Mod uploader workspace:
  <https://github.com/megacrit/sts2-mod-uploader>
- Steamworks Workshop install/update behavior:
  <https://partner.steamgames.com/doc/features/workshop/implementation>
- MCP transports and local HTTP security requirements:
  <https://modelcontextprotocol.io/specification/2025-06-18/basic/transports>
- Godot active scene-tree thread-safety guidance:
  <https://docs.godotengine.org/en/latest/tutorials/performance/thread_safe_apis.html>
- Harmony patch behavior:
  <https://harmony.pardeike.net/articles/patching.html>
- Microsoft secure coding guidance for untrusted code:
  <https://learn.microsoft.com/en-us/dotnet/standard/security/secure-coding-guidelines>
- Microsoft `AssemblyLoadContext` security limitation:
  <https://learn.microsoft.com/en-us/dotnet/api/system.runtime.loader.assemblyloadcontext>
- Windows Credential Locker:
  <https://learn.microsoft.com/en-us/windows/apps/develop/security/credential-locker>
- Apple Keychain secret storage:
  <https://developer.apple.com/documentation/security/using-the-keychain-to-manage-user-secrets>
- broad low-ceremony REST/MCP reference:
  <https://github.com/Gennadiyev/STS2MCP>
- event-stream and broad action reference:
  <https://github.com/CharTyr/STS2-Agent>
- separate patched Headless host reference:
  <https://github.com/wuhao21/sts2-cli>

## Final Decision

Proceed with **PROD-0 Product Truth And Threat Repair**, beginning with the shared
contract fixture and security/session contract PRs. Do not build a generic
Companion platform, public Agent marketplace, or Headless host yet. The first
product milestone is one authenticated, exact-identity, single-controller live
journey supervised by a minimal Companion, with honest restart and unknown
outcome behavior. Everything else depends on that proof.
