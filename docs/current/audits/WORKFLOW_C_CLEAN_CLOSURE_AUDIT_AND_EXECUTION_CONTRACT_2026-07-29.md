# 工作流 C Clean Closure 架构审计与执行合同

**审计基线：** `develop` `146618b4431042da317d34a855c7380a02d55af9`  
**状态：** execution contract accepted; Preview.75 loaded and bounded runtime exercised; Kifuda/family deletion pending
**权威决定：** [ADR-0005](../decisions/ADR-0005-workflow-c-clean-closure.md)

## 1. 执行结论

保留 ADR-0002 的 Semantic Gateway 双平面宏架构，但拒绝两种极端：

- 不能因为 Preview.73 已经多次跑完整局，就把 C 宣布为结构完成；
- 也不能先建设万能 Registry、Outcome DSL 或完整 qualification OS，再回头验证游戏。

唯一执行路线是 **support envelope 封闭 + 纵向 family strangler**。每个 family
同时完成玩家可见事实、owner、exact action、native Commit、Outcome、权限和旧路径
删除。成功和失败的实验都必须有结束状态；临时 shadow 不得进入最终 wire。

### 2026-07-29 evidence update

Preview.74 later loaded with exact SHA `42eb22b6...aaea7e`, MVID
`13d4dd05...9cf5b` and runtime `5ed719fd...`. Six audited runs confirmed that
the fixed Prompt/guide baseline can complete a 202-decision run boundary and
that four exact-action stale refusals are safe freshness guards, not Connector
failure. They also exposed a Re-only failure mode: a valid advertised action
was discarded solely because non-authoritative `reasonBrief` exceeded 240
characters. Preview.75 fixes that bounded audit-data handling and permits
read-only Inspection as a volatile canary only after exact source-resolved
session admission. Preview.75 is installed as SHA `ddce17cf...6334`, MVID
`23ac5aad...3cb4`, but has not been loaded. Ordinary relic/Kifuda evidence is
still absent, so this update does not close the first family pilot or authorize
old-path deletion. See the dedicated
[runtime/pre-Live closeout](WORKFLOW_C_PREVIEW74_RUNTIME_AND_PREVIEW75_PRELIVE_CLOSEOUT_2026-07-29.md).

### 2026-07-29 Preview.75 runtime update

Preview.75 subsequently loaded on exact SHA `ddce17cf...6334`, MVID
`23ac5aad...3cb4`, runtime `fc2ea037...`. Runs `run-...094605` and
`run-...112408` completed one-game boundaries with 429 settled mutations and
25 safe stale refusals. They exercised `run_deck`, `combat_piles` and
`shop_catalog`; the second run purchased Bronze Scales with exact gold/relic
and Courier slot-replacement evidence. Kifuda did not occur.

The stale records exposed a Re transition-supervision gap rather than a
Gateway authority defect: the first actionable successor after action-local
completion could continue changing during the model call. Re now requires a
repeatable actionable successor without changing Gateway Outcome or retrying
stale actions. See the
[Preview.75 runtime closeout](WORKFLOW_C_PREVIEW75_RUNTIME_AND_SUCCESSOR_STABILITY_CLOSEOUT_2026-07-29.md).

The final same-source Release rebuild is installed as SHA `f9819b6b...c721ee`,
MVID `34d6deb3...380410`. The game is closed, so this new whole-DLL identity
inherits no loaded evidence or session authority. Rollback is
`STS2MCP/.local/deployments/2026-07-29T12-26-37-794Z`.

## 2. 事实与证据边界

### 2.1 仓库和部署基线

开始时：

```text
branch/origin       develop == origin/develop
HEAD                146618b4431042da317d34a855c7380a02d55af9
remote default      origin/main
main...develop      1 / 23
source/loaded       Preview.73
Re schema           29
loaded SHA          f6b2d2687add4719e7d04f6b3beb8b5b386f43208d7af1cc0b12e2d89a151b18
loaded MVID         f67e272a-ca3f-4eac-8d41-6e287b144c8a
game                v0.109.1|c8c577f6|-820620422
```

Preview.74 source changes cannot inherit this loaded evidence.

### 2.2 最新 runs

`run-20260729061142-32o3xz`:

- 95 decisions, 94 `executed_and_settled`;
- `completed_run_boundary`, `completedGame=true`;
- no unsupported, invalid, stale, observation/provider failure, unsettled or
  unknown mutation;
- clean source revision recorded;
- resumed combat rather than a fresh menu start;
- provenance `unrecorded`, Inspection disabled;
- did not exercise ordinary relic/Kifuda or the required detail/Inspection
  families.

`run-20260729060301-mlwq4k` recorded 143 `executed_and_settled`, three safe
stale refusals and one non-actionable checkpoint. Its terminal decision stopped
as `not_executed_llm_failure`: primary and retry responses violated the
240-character `reasonBrief` contract. This is a terminal A/provider
output-contract failure, not a Gateway unsupported/Outcome failure.

`run-20260729060132-7zsqdu` has no immutable summary and is classified only as
incomplete evidence. It is neither success nor a diagnosed Connector failure.

## 3. 对四份参考文档的裁决

保留：

- C 需要一个明确的相对完成点；
- semantic identity 与 current authority identity 必须拆分；
- operation 不能是最终 compatibility/authority identity；
- Inspection、linked detail、版本恢复和 typed unsupported 属于完成合同；
- Kifuda 证明 Commit、child handoff 和 transaction settlement 不能混为一谈；
- 最终 active code 不能保留永久 shadow、fallback authority 和双 authority。

修正：

- “所有 migration 都先 dual-read”过度保守。身份 shadow 已经污染 wire 和 Prompt，
  且测试可直接证明切分，所以本轮直接切换并删除旧 DTO；
- “Kifuda parent 未 settled”不能推导出 PendingObligation。购买 mutation 已经可由
  gold/relic/native task/child owner 证明；附魔由 fresh observation 继续；
- “fallback=0”只适用于 supported authoritative envelope。未知项应保持
  `unsupported/code_required`，不能为了指标伪造 explicit contract；
- Re 的 command polling、settling 和 successor observation 不是 native completion
  reconstruction，不应删除；
- 先造完整 contract schema 再迁移全部 Provider 会复刻当前 80 个 manifest fallback
  的问题：结构齐全但语义未被证明。

废弃：

- C-R1 可以完成而 operation authority/identity shadow 永久留存；
- control-plane 历史属于当前 semantic state；
- operation/package 数量等于架构完成度；
- 一次成功、静态相似或 catalog 行可以直接成为 durable claim。

## 4. 唯一目标架构

```text
Observation plane
  Shared visible run facts
  Context / Decision Purpose
  one Active Surface + Stage
  read-only state-bound Inspection/detail

Mutation plane inside Gateway
  exact native source/owner
  exact BoundAction(contract + source evidence + operands + state)
  execute-time revalidation
  native Commit
  action-local Outcome/receipt

Control plane
  exact environment/Patch/Modset
  session trial
  quarantine
  persistent claim lifecycle

Re
  strict decode -> consumer projection -> advertised action_id
  command polling -> successor observation -> run supervision
```

这不是万能 Surface 树、Effect DSL 或第二游戏引擎。Native STS2 继续拥有规则、
RNG、Tasks、Commands 和副作用。

## 5. Support Envelope

Clean Closure 的产品范围是 ordinary vanilla single-player：standard run 的 menu、
run start/resume、map、combat、event、reward、shop、rest、treasure、已注册 generated
choice、purpose-specific selectors、game-over 和回到 menu。

必须 typed fail closed 或明确 out-of-scope：Crystal Sphere、standalone manual potion
discard、Tutor 未审计 owner、非标准 profile/menu、multiplayer、未知 generated source、
新 native topology、unknown Patch/source/owner/Outcome。

完整 compendium、外部攻略、图片、Headless、Companion、公共 SDK、learning 和 strategy
改进不属于 C Clean Closure。

## 6. 本轮迁移结果

### 6.1 Identity/wire cutover

- 新增正式 `semantic_state_id` 与 `authority_projection_id`；
- `state_id` 绑定两者，继续保护 stale action；
- semantic identity 直接覆盖实际 Context、Surface、completeness、visibility；
- authority identity 直接覆盖 exact environment、当前 scope 与 BoundAction
  source/operand digest，不再只信任 Provider 自报 signature；
- 删除 `identity_shadow`、`contract_instance_shadow`；
- 从 state envelope 删除完整 permission/qualification history；
- control state 仍在 capabilities/operator responses；
- Re schema 30 严格解码新合同，Prompt 不再接收这些治理历史。

### 6.2 BoundAction 与首个 pilot

- 每个发布 action 绑定 catalog contract、source evidence、exact operand 和 state；
- explicit contract 的发布/执行准入按 contract digest，而不是 operation label；
- fallback family 暂时保留旧 operation gate，清楚计入删除债；
- 新增 explicit `shop_inventory/purchase_shop_relic` contract；
- ordinary relic 与 Kifuda 共用 native purchase Commit，但 Kifuda child source 被纳入
  后续 enchant action binding；
- purchase receipt 在 native Commit 完成，child 由 fresh observation 接管；
- persistent fallback witness matcher 与 session matcher 对齐，修复成功 command 被
  占位符误 quarantine 的缺陷。

### 6.3 Build/install closure

- C#、Re、CLI 与文档检查通过后构建 Release；
- built/installed SHA 均为
  `42eb22b6cc0ee95679d4347bba2f319c1d02b06ae8bbfdebc9c48c6c85aaea7e`；
- built/installed MVID 均为 `13d4dd05-61c3-470c-ba03-5af14dd9cf5b`；
- rollback 为 `STS2MCP/.local/deployments/2026-07-29T07-08-28-094Z`；
- 游戏关闭，故 Preview.74 loaded identity 与任何 Live evidence 均未声称。

## 7. 当前删除清单

```text
connector identity/contract shadow          0
permanent dual-read in new identity path    0
production action publication path          1
explicit native contracts                    7
manifest fallback contracts                 80
explicit contract-digest admission           7
fallback operation-gated families           80
Re native-completion reconstruction           0
control history in semantic identity          0
```

因此 Preview.74 不是 Clean Closure complete。80 个 fallback 是待 family 审计的上限，
不是 80 个都必须支持；每项最终必须变成 explicit supported、typed unsupported、
`code_required` 或 out-of-scope。

## 8. 执行顺序与验收

### C0 Canonical freeze

完成：ADR、状态、路线、删除清单、禁止新增永久 shadow/fallback/authority path。

### C1 Support/Inspection closure

补齐 current decision 所需的高价值 detail 与 typed availability；Inspection 始终只读、
state-bound、non-authorizing。不得以 raw object dump 替代语义合同。

### C2 Pilot Live closure

需要 ordinary relic 和 Kifuda 的 exact-runtime 正例，以及 wrong source、stale offer、
child owner mismatch、witness mismatch 的负例。未取得前 pilot 只能是 implemented/tested。

### C3 Family waves

按 menu/navigation、combat、reward/shop/treasure、generated choices、selectors/rest
迁移。每波完成 explicit contract、BoundAction、negative fixture、Live evidence、旧路径
删除和 machine inventory 更新。

### C4 Environment/claim acceptance

执行 wrong environment/Patch/Modset、expiry/corruption、revoke/supersede/rollback、
restart reload 和 update simulation。新环境只可获得 exact runtime session trial；不能
继承 persistent authority。

### C5 Final journeys

fresh 与 resumed provenance、Inspection-enabled、至少多条 ordinary complete journey，
并报告 typed stop rate、unknown/stale/provider failures 和 family coverage。战略胜率不是
C 的验收。

### C6 Freeze

所有 supported family 只有一条生产 contract/Provider/Outcome path；指标达标；协议、
runbook、rollback 和 non-claims 冻结。之后 C 转为更新/真实 blocker 驱动维护。

## 9. 实验合同

任何 differential instrumentation 必须写明 hypothesis、pass/fail、deadline 和删除条件。
fixture 证明代码行为；loaded identity 证明产物；canary 证明一个 mutation；Organic/
recorded journey 才证明对应运行范围。不同等级不得互相冒充。

## 10. 当前 non-claims

- Preview.75 已 cold-load，并有两条 exact-runtime completed boundaries；
- ordinary relic 正例已取得，但 Kifuda child/negative evidence 仍缺；
- Inspection 已有当前 runtime coverage，但未 Organic/persistent qualification；
- 80 个 fallback 尚未完成 family disposition；
- 没有 complete-game、cross-Mod、cross-version 或 persistent qualification 声明；
- 最新完整 runs 是 Preview.75 且 provenance `unrecorded`。

## 11. 验证与部署结果

实际通过：

- Gateway C# tests: 194/194；
- Re typecheck、210/210 tests、production build；
- Python MCP `py_compile`；
- Connector CLI、formal/historical identity audit、active Markdown links；
- operation inventory、adaptation、compatibility/permission fixtures；
- qualification ledger、environment profiles、migration orchestrator；
- Release build: 0 warning / 0 error；
- `git diff --check`。

精确 v0.109.1 静态 binding audit 对 reviewed bindings 通过，但仍返回
`review_required_unregistered_callers`：`Tutor` 是
`code_required_new_owner_binding`，无授权或资格副作用。

最终 built/installed SHA 和 MVID 分别为：

```text
SHA   42eb22b6cc0ee95679d4347bba2f319c1d02b06ae8bbfdebc9c48c6c85aaea7e
MVID  13d4dd05-61c3-470c-ba03-5af14dd9cf5b
```

游戏关闭，Gateway 不可达，因此 loaded identity 为空是预期事实。Preview.73
whole-artifact rollback 保留在
`STS2MCP/.local/deployments/2026-07-29T07-08-28-094Z`；中间 Preview.74 产物
备份在 `STS2MCP/.local/deployments/2026-07-29T07-20-46-255Z`。
