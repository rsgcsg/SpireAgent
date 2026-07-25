# Connector Gate 0 Closeout

Date: 2026-07-22

> Historical boundary: this report records Gate 0 at its original artifact.
> The later Gate 1 closeout fully retired the Gateway `/api/v1` namespace and
> archived its implementation. Any v1 compatibility statements below are not
> current runtime instructions.

## Verdict

Gate 0 is closed for the exact local environment recorded below. This proves a
bounded current-build connector lifecycle, not complete-game coverage, broad
qualification, or consumer-product security.

```text
Re observation
-> Bridge-advertised opaque action
-> state-bound submit
-> command completed
-> coherent Re successor state
```

## Exact Loaded Identity

| Field | Value |
|---|---|
| protocol | `2.0-preview.55` |
| game | `v0.109.0` |
| game commit | `c12f634d` |
| main assembly hash | `-840572606` |
| Gateway SHA-256 | `89f94eb99996c2ff4636c1e2ab1119d3dd6eb20a64e59c0270821e2eb2f0e079` |
| Gateway MVID | `3fd03b69-264a-4a41-9da7-1e9b50c7bc50` |
| runtime instance | `53c101f4f82c496994bba085bfb43de4` |
| Modset | exact Bridge-only, fingerprint `f36fd123b9f272ac61e15a880b6f661489d15873177ec5b423c96fed71cebde2` |

## Runtime Evidence

Two command lifecycles were executed through Re's explicit connector canary,
which uses the same observation, normalizer, advertised-action import,
pre-execution stale check, Bridge submit/poll, and settlement implementation as
the model-driven tick:

1. `main_menu -> open_singleplayer -> singleplayer_menu`: command completed;
   successor settled after one poll in 201 ms.
2. `singleplayer_menu -> back_from_singleplayer_menu -> main_menu`: command
   completed; successor settled after one poll in 200 ms.

Both used `bridge_advertised` authority and the exact identity above. No model
provider was involved, so this evidence isolates Connector correctness from
the independently observed DeepSeek network failure.

## v1 Retirement And Safety Changes

- Re-SpireAgent is now v2-only. Its v1 HTTP mutation adapter and index-action
  serializer were removed; `auto` and `v1` runtime modes are rejected.
- Historical v1 raw-state normalization remains readable for fixtures and old
  records, but it has no production Connector mutation path.
- Gateway v1 reads remain available for explicit compatibility diagnostics.
- Gateway `/api/v1/*` POST is denied by default. A local operator must set
  `enable_legacy_v1_mutations=true` in `STS2_MCP.conf` to restore legacy
  mutation compatibility.
- The loaded process returned HTTP 403 for a v1 single-player POST and HTTP 200
  for the corresponding v1 GET; the v2 lifecycle remained clean afterward.

## Verification

- Re typecheck, 150 tests, and production build: passed.
- Gateway tests: 108 passed.
- Gateway Release build: passed with zero warnings/errors.
- Python MCP syntax compile: passed.
- Release and installed DLL SHA-256: matched.
- Steam cold start and loaded SHA/MVID/runtime identity: verified.

## Remaining Boundaries

Gate 0 does not qualify all canary operations, retire Gateway v1 reads or every
legacy tool, add authentication/controller leases, or prove provider-driven
long-run stability. Gate 1 must proceed per operation and coherent journey,
with unsupported states continuing to fail closed.
