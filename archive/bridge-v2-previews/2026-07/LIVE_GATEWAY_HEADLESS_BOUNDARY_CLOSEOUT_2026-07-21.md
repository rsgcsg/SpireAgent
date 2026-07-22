# Live Gateway And Headless Boundary Audit Closeout

Date: 2026-07-21

## Baseline And Scope

- branch: `develop`
- repository HEAD: `54b716261af47395176cb9e968b8aef45a3732db`
- remote comparison: local HEAD equaled `origin/develop` before edits
- Bridge protocol: `2.0-preview.54`
- task type: architecture and documentation only

This audit did not change code, wire schema, runtime permission, Release
artifacts, installed files, loaded identity, canary, qualification, or Organic
evidence. Runtime identities remain exactly as recorded in
[CURRENT_STATUS.md](CURRENT_STATUS.md).

## Evidence Classes

### Direct current-code verification

The audit read:

- `BridgeV2/Protocol`, `Runtime`, `Game`, and `Transport` boundaries;
- `BridgeSurfacePermission`, `ActiveSurfaceResolver`,
  `BridgeCommandLedger`, `BridgeContractManifest`, contract shadow, source
  bindings, Provider completion paths, and Bridge contract tests;
- the Python MCP v2 tools and legacy tool surface;
- Re `BridgeV2RestClient`, negotiated hybrid adapter, strict protocol schema,
  Inspection projection, normalized action import, and integration docs;
- current status, coverage, protocol, architecture evolution, ADRs, and recent
  source/runtime closeouts.

### Repository evidence, not independently repeated here

Existing STS2 decompilation records and Organic runs were used only with their
recorded game identity, Bridge SHA/MVID/runtime, and limitations. This audit did
not independently decompile either canonical game build and did not relabel any
historical run.

### External primary-source verification

- MCP's official architecture describes a client/host/server context-exchange
  protocol with negotiated tools/resources/prompts; it does not define STS2
  game legality or completion:
  <https://modelcontextprotocol.io/docs/learn/architecture>.
- Godot documents `--headless` as a runtime/display mode; it is not evidence
  that STS2 scene-owned business behavior is equivalent:
  <https://docs.godotengine.org/en/stable/tutorials/editor/command_line_tutorial.html>.
- `wuhao21/sts2-cli` was cloned and read at exact commit
  `d11aa883b582dd68bd39b331f3370746b30d447e`. It was not built or executed:
  <https://github.com/wuhao21/sts2-cli/tree/d11aa883b582dd68bd39b331f3370746b30d447e>.

The three supplied architecture documents were treated as design inputs, not
evidence authorities.

## Validation Performed

The Steam library manifest located app `2868840` under
`E:\SteamLibrary\steamapps\common\Slay the Spire 2` with manifest build ID
`24251656`. The required `sts2.dll`, `GodotSharp.dll`, and `0Harmony.dll`
inputs were present there. This locates build dependencies; it does not prove
runtime loading, semantic equivalence, canary, or qualification.

- `dotnet test STS2_MCP.sln -c Release --no-restore
  -p:STS2GameDir="E:\SteamLibrary\steamapps\common\Slay the Spire 2"`:
  passed, 98/98 tests.
- `npm run check` in `Re-SpireAgent`: typecheck, 149/149 tests, and production
  build passed.
- root `npm run typecheck`: passed.
- `python -m py_compile mcp\server.py`: passed.
- repository-relative Markdown link check over changed documents: 132 links
  checked, zero broken.
- `git diff --check`: passed; Git reported only line-ending conversion
  warnings.

No game process was launched. No live endpoint, installed/loaded DLL identity,
Organic journey, canary, or qualification was exercised by this audit.

## Independent Verdict

The long-term live connection should be described as a protocol-neutral Live
Semantic Gateway in the game-side integration layer. REST is Re-SpireAgent's
current primary transport. MCP is an optional thin adapter. Neither transport
nor Re should own STS2 legality, runtime permission, state/action binding,
native Commit, transaction completion, Witnesses, or exact environment
evidence.

This conclusion is not merely preferred terminology. It matches current code:
Bridge runtime and Providers own game objects, main-thread execution,
permission gates, opaque actions, revalidation, Command settlement, and
semantic completion; Re directly calls REST and imports advertised actions;
the Python MCP server forwards a bounded v2 subset while retaining many legacy
v1 tools.

Permission has one nuance: governance may author explicit permission records,
but the game-side gateway must enforce them against the current environment.
REST, MCP, and Re may reject or narrow; they may never broaden.

## Decisions On The Reference Proposals

### Accepted

- Separate domain gateway from REST and MCP transports.
- Keep Re focused on connector negotiation, strict structural consumption,
  advertised-action selection, and settlement.
- Treat Headless as a separate future runtime with separate identity,
  permission, evidence, qualification, and rollback.
- Reuse real native Tasks and Commit paths where a future host can preserve
  them.
- Keep admin/test mutation outside the agent action plane.

### Accepted With Qualification

- A shared Gateway contract/kernel is a valid target, but no current package
  boundary has been proven pure enough to extract. First obtain live
  transaction and validation shadow evidence.
- Both official offscreen and synthetic real-DLL hosts are plausible research
  options, but building both initially is unjustified. A future feasibility
  phase must select one.
- `sts2-cli` proves a useful engineering direction, not semantic equivalence or
  SpireAgent authority. Its patches, stubs, ordered decision detection, index
  actions, and mixed admin router require a separate host identity and stricter
  gateway shell.

### Rejected Or Deferred

- Starting a Headless code skeleton before the live admission gate.
- Copying `RunSimulator` into the current Bridge.
- Treating Godot `--headless`, use of real `sts2.dll`, or a completed run as
  equivalence evidence.
- Making Python MCP the domain core or adding one tool per content item.
- Adding live/headless semantic branches to Re strategy code.
- Sharing live qualification, evidence, or permission with a Headless host.
- Executable Effect DSLs, arbitrary reflection/method/script gateways, raw UI
  trees, durable index actions, or self-authorizing Mod contracts.

## Current Gaps Preserved Honestly

- `deck_enchant_selection` still has a Self-Help-Book source claim in manifest
  evidence without matching runtime source/task binding.
- Current Provider completion is purpose-specific but cross-decision native
  transaction obligations are not yet first-class.
- Shared publication/execution validators and typed Witness plans remain
  partial/proposed.
- C#/TypeScript/MCP structural catalogs can drift; the current Python MCP
  adapter still omits `shop_catalog`.
- Exact-build authority remains safe but expensive to requalify.
- No SpireAgent Headless host or live-vs-Headless equivalence evidence exists.

## Documentation Closeout

Canonical active documents now use these names:

- Live Semantic Gateway: protocol-neutral game-side domain and enforcement;
- REST adapter: Re's current primary connection;
- MCP adapter: optional thin tool adapter;
- Re game connector: strict transport/protocol/structural consumer;
- Headless host: deferred separate future subproject.

The durable boundary is in
[LIVE_GAME_CONNECTION_BOUNDARY.md](LIVE_GAME_CONNECTION_BOUNDARY.md). The
future Headless plan is isolated under [docs/headless](../../../docs/headless/README.md).
Historical closeouts were not rewritten.

## Next Smallest Live Task

Add a non-authorizing runtime source/task correlation shadow for the exact
`deck_enchant_selection` path, with ambiguity, stale source, cleanup, and
source-Task completion tests. It must publish no new action and change no
permission. If the exact Self-Help-Book binding cannot be proved, narrow the
existing canary in a separate reviewed change before further Surface expansion.

After that, apply the same minimal transaction record to one already
source-tracked generated-card or combat-pile family and compare old/new
publication, revalidation, and Witness outcomes. Headless remains blocked.
