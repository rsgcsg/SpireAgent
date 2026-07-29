# Workflow C Preview.74 Runtime And Preview.75 Pre-Live Closeout

**审计日期：** 2026-07-29  
**代码基线：** `develop@1300b4873ac8c3198894da337ed09ca6108b2e18`，审计开始时 clean  
**证据等级：** 本地 immutable run records + exact loaded identity；均为 `unrecorded` coverage evidence，不是 Organic qualification

## 1. Exact Runtime Boundary

六个最新 run 都使用同一个 loaded Gateway：

```text
protocol  2.0-preview.74
SHA       42eb22b6cc0ee95679d4347bba2f319c1d02b06ae8bbfdebc9c48c6c85aaea7e
MVID      13d4dd05-61c3-470c-ba03-5af14dd9cf5b
runtime   5ed719fd1c6c43b0bff62866c96f4142
game      v0.109.1|c8c577f6|-820620422
modset    exact_bridge_only
Patch     clean_known_owners
```

Prompt v2 runs use clean Re revision `aa6ffd9`; Prompt v4 was exercised first
from a dirty `aa6ffd9` worktree and then clean revision `a5faf3e`. HEAD
`1300b48` only synchronizes reviewed prompt tests and was not the source
revision of these runs.

## 2. Run Attribution

| Run | Prompt | Decisions | Terminal/result | Attribution |
|---|---:|---:|---|---|
| `run-20260729073432-wb2get` | v2 | 55 | 54 settled; overlong `reasonBrief` | A/provider output contract |
| `run-20260729073806-9nxbrt` | v2 | 50 | 49 settled; overlong `reasonBrief` | A/provider output contract |
| `run-20260729074114-toin5t` | v2 | 4 | 3 settled; completed run boundary | expected bounded stop |
| `run-20260729075934-us7u02` | v4 | 158 | 152 settled, 4 stale, 1 checkpoint, overlong `reasonBrief` | safe stale + A/provider |
| `run-20260729080901-d8t0pi` | v4 | 3 | 2 settled; overlong `reasonBrief` | A/provider output contract |
| `run-20260729081310-529z79` | v4 | 202 | 197 settled, 4 stale; completed run boundary | successful coverage journey |

There was no latest-run `unsupported`, observation failure, unknown mutation,
unsettled mutation, Gateway rejection, or environment mismatch. Four stale
refusals in each long run changed formal semantic or semantic+authority
identity; the same exact bound action remained published in the successor.
They were correctly refused and the run continued from fresh observation.

The repeated `reasonBrief > 240` stop is not a Gateway problem. Raw provider
responses contained valid JSON and an advertised action ID; only the
non-authoritative explanation exceeded its bound. Preview.75 therefore keeps
the fixed Prompt/guide baseline unchanged and auditably truncates only this
field while retaining the raw response.

## 3. Pilot And Inspection Verdict

- `run-...075934` exercised Self-Help Book `SELF_HELP_BOOK` enchantment and
  proved `selected_card_membership_changed` followed by
  `enchantment_screen_closed_and_exact_cards_enchanted`.
- It did **not** exercise Kifuda. Its shop actions purchased two cards, opened
  card removal and closed inventory; no relic purchase occurred.
- No latest run carried an Inspection because Preview.74 exposed
  `inspection_disabled` in this unreviewed exact environment.
- Therefore ordinary relic/Kifuda closeout, Kifuda source negative evidence,
  and current-build Inspection evidence remain pending. No old family path is
  deleted on the basis of these runs.

## 4. Preview.75 Pre-Live Changes

Preview.75 makes two bounded reliability changes:

1. Re records `reason_brief_truncated_to_contract_limit` and preserves the
   valid advertised action when only `reasonBrief` exceeds 240 characters.
   Unknown IDs, invalid JSON, extra fields and invalid confidence still fail.
2. In `migration_exploration`, a diagnostic exact environment receives
   state-bound read-only Inspection canaries only after the Gateway has already
   admitted at least one source-resolved action scope for the same runtime and
   clean Patch/Modset. Inspection remains outside the command ledger, creates
   no mutation authority, is not persisted, and disappears when scopes,
   identity, Patch ownership or mode fail.

```text
source/built/installed protocol  2.0-preview.75
source/built/installed SHA       ddce17cf4121bf009a371cbfd102b1174732eafc1cf7fafd8e226f3ec12f6334
source/built/installed MVID      23ac5aad-443b-47aa-9cb0-a55197d83cb4
rollback                         STS2MCP/.local/deployments/2026-07-29T09-13-35-338Z
loaded                           none; game closed after installation
```

## 5. Non-Claims And Next Evidence

Preview.75 has source, fixture, test, Release build and installed-artifact
evidence only. It has no loaded identity, Inspection canary, mutation canary,
ordinary relic/Kifuda journey, Organic journey, durable claim or persistent
qualification. The next exact run must first prove loaded SHA/MVID, then record
an Inspection-enabled ordinary journey. The relic/Kifuda pilot remains a
separate natural-evidence requirement and must not be manufactured.
