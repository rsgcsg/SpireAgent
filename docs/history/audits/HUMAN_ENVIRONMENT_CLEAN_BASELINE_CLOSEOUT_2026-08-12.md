# Human Environment Clean-Baseline Closeout

Date: 2026-08-12

Branch: `human_equivalent_connector`

Starting HEAD: `854ac9c541d9a3d43d4dab5365c7d427a7a4bfcb`

Working-tree state: breaking, uncommitted source migration. The HEAD identifies
the starting Git commit, not the resulting source bytes.

## Verdict

The current source is a **clean-baseline candidate**. It is not frozen and is
not Live-qualified. Automated verification, Release build and safe install pass;
cold-load identity and new-artifact `he_pure` evidence are tracked separately.

## Root Cause Of Newcomer Confusion

Current code and documentation still used Preview, V2, V3, Bridge, Provider and
Human-Equivalent names for unrelated responsibilities. Observation readers
could appear to own actions; generic authority lived under Bridge directories;
Re's production build emitted retired protocol clients; current docs treated an
old temporary freeze and one machine's artifact as present truth.

## Source Convergence

- renamed the public/current concept to Human Environment;
- split game-side ownership into `LiveHost`, `NativeUi`, `Authority`,
  `HumanEnvironment` and `Transport`;
- removed Provider action publication and retired V2/V3 runtime/HTTP authority;
- made retired HTTP routes explicit `410`, with no fallback;
- isolated Observe, Read, Interact and consumer projection runtimes;
- added machine-readable HE contract and boundary checks;
- made Re production composition directly use the HE adapter, normalizer and
  bound-action importer;
- fixed `connector-canary`, CLI permission-policy lookup and protocol detection
  to use current ownership, and removed V2 migration readiness fields from the
  current operator status;
- excluded historical V2/V3 fixture decoders from the Re production build;
- reduced Re's production executable action type to the single opaque HE
  action and moved historical index/V2/V3 action unions behind an excluded
  fixture module;
- made shared action-selection, recording and settlement utilities generic so
  historical fixtures no longer define the current action contract;
- corrected semantic cycle hashing so HE `expectedSnapshotId` is treated as a
  transport binding and cannot hide a repeated open/return loop;
- implemented the default-off, non-authorizing `native_pages.v1` evidence
  profile with open/read/return/recovery contracts.

Historical test decoders remain source-test inputs for regression fixtures, but
they are not exported, selected by runtimeFactory or emitted to `dist`. Their
test counts must not be presented as current HE coverage.

## C-Core Boundary

```text
LiveHost observation
-> NativeUi exact binding and native delivery
-> Authority environment/controller/request admission
-> HumanEnvironment canonical Observe / Read / Interact
-> REST or optional MCP transport
-> consumer-owned projection
```

STS2 owns rules, RNG, effects and Commit. C owns the fair-player world, reads,
one execution authority, stale/idempotency enforcement and attributed delivery
receipts. Consumers may format or aggregate C truth but cannot create legality.

## Human Information Closure

Implemented: persistent summary, tagged interaction content, visible referents,
complete bound actions, `run_deck`, `combat_piles`, `shop_catalog`,
`surface_card`, and five fixed native-page evidence kinds.

Partial/unsupported: active hover traversal, arbitrary scrolling, exhaustive
tooltip subtype closure and native pages outside the fixed profile. Hidden RNG,
draw order and future content remain excluded.

## Automated Evidence

- Gateway tests: `285/285` passed.
- Re typecheck: passed.
- Re tests: `299/299` passed, including `15` direct HE contract/adapter tests;
  retired fixture suites are historical regression support.
- Re production build: passed and emits no BridgeV2/ConnectorV3/hybrid modules.
- Gateway Release build: passed with zero warnings/errors.
- CLI and run-identity tests: passed.
- Python MCP syntax: passed.
- HE current-truth, contract and boundary checks: passed.
- Compatibility (`6` fixtures), permission (`4` fixtures), qualification,
  environment-profile and migration checks: passed without authority effect.

Final built and installed artifact:

```text
protocol  1.0-preview.6
SHA-256   89c61f77434f74031a5a410c8d0566875ada96894ac1db41d7ca25869c6c1931
MVID      ceb680b0-b23c-4bb5-9e95-c37c67c2bc95
```

Built and installed bytes match. Deployment recorded source digest
`4778b40a951dfb62015eccad0df526afe9b6a5a893e906a1b1149b49806a0211`.
The artifact remains unloaded until a new game process proves it.

Rollback backup:

```text
STS2MCP/.local/deployments/2026-08-11T15-35-52-312Z
SHA-256  4895b2050ec924ae99f44dbbd886e4c834668be97494c5cebfaca26a58dd01bf
MVID     7ed996e3-e713-480d-87b9-7316c8368dea
```

The backup is locally parseable. Restoring it still requires a clean game
shutdown and would restore the whole old artifact, not mix authorities.

## Preserved Hard Shell

One input owner, exact snapshot/interaction/entity/control binding, Host-local
operands, execute-time revalidation, game-owned Commit, one controller,
idempotency, unknown-no-retry, read isolation, hidden-information policy,
receipt attribution and successor evidence remain intact.

## Not Proven

- loaded SHA/MVID/protocol/game/Modset/runtime for the new DLL;
- new-artifact Live Observe/Read/Interact behavior;
- native-page open/read/return/recovery in Live STS2;
- a same-artifact ordinary `he_pure` journey;
- arbitrary game-version or Mod compatibility;
- full Human Information Closure for hover/scroll/tooltips.

Preview.5 evidence remains valid only for its recorded old SHA/MVID/runtime and
does not support any of these claims.

## Next Exact-Runtime Gate

Cold-load the final installed DLL, verify exact identity, then exercise current
and stale actions/reads, unsupported/settling states, all five native-page kinds
including recovery, and one ordinary `he_pure` journey. Stop on unknown delivery
without retry.
