# Connector V3 适配性修正与分层冻结判决

日期：2026-08-03  
基线：`connectorV3@64c272316af64b71e670a53bc9c2c79f0d3ee9b8`  
协议：`3.0-preview.12`  
总判决：**conditional freeze**

本文是当前 V3 适配与冻结的详细 authority。它修正而不替换
[ADR-0007](../decisions/ADR-0007-connector-v3-canonical-architecture.md)：
V3 宏观执行架构保留，适配/兼容层不得按修改前状态冻结。

## 1. 证据边界

### 1.1 当前加载事实

修改前通过 Gateway 自报身份、部署记录和 `npm run verify:loaded` 交叉确认：

```text
source HEAD       64c272316af64b71e670a53bc9c2c79f0d3ee9b8
protocol          3.0-preview.12
loaded SHA        18f07ca327bb8e6f58f227674ca82fbe7ba1a91fe41875e5dea6de406edd3eaa
loaded MVID       50309e88-c6a0-4faf-b2ae-7092f91eda7d
runtime           990ef9d80c3e46c988a184d94e05a0d3
game              v0.110.1 / db5d3552 / -205573697
Modset            exact_bridge_only / bcf7008d...e65788ffd
Patch             clean_known_owners / 7f696bad...9fab05f
permission        migration_exploration / active_session_scoped
qualification     empty
persistent grant  false
```

本轮源码和测试修改在新 artifact cold-load 前只具有 source/test/build/install
证据；不得转移上述 loaded/Live authority。

本轮最终 Release 已在游戏完全退出后构建并安装：

```text
source revision       64c272316af64b71e670a53bc9c2c79f0d3ee9b8 + documented dirty worktree
Gateway source digest 76c7304614e5a2e85f5695e0d3e8743ee71ef733b24f0e89dfd97a39073e9c11
built/installed SHA   c9f61d76a4b58487f336f73241110fd5befb304a7c5388c57454656640e72b24
built/installed MVID  2b388d99-5a1b-46a7-9626-029a679deba0
rollback              STS2MCP/.local/deployments/2026-08-03T13-53-45-968Z
loaded                non-claim
```

### 1.2 Preview.12 原始运行

当前本机保留五个相同 SHA/MVID/runtime 的 Preview.12 runs：

| Run | Decisions | 终止 | 结论 |
|---|---:|---|---|
| `run-20260803121330-z9awct` | 1 | runtime failure | Royal Stamp deck-enchant 可见，但无 source contract |
| `run-20260803121455-imwzt4` | 1 | runtime failure | 同一精确缺口的重复复现 |
| `run-20260803121625-g1pqer` | 29 | completed run boundary | bounded Journey 完成 |
| `run-20260803123610-viz9g7` | 119 | completed run boundary | bounded Journey 完成；一次 stale 安全拒绝后继续 |
| `run-20260803124642-h01b9w` | 94 | completed run boundary | bounded Journey 完成 |

三个完成 Journey 合计 242 decisions：238 `executed_and_settled`、一次
`not_executed_stale_state` 和三个正确的 completed-run boundary。它们覆盖
combat、event、map、reward、shop、rest、treasure、menu、game-over、deck
enchant、deck upgrade 和 Wood Carvings。Symbiote select/confirm、rest 和
Wood Carvings replacement 在该 artifact 上有 exact Live receipts；Quasar、
combat-hand confirm、Kifuda、当前/stale Inspection、loaded revoke/rollback
没有在这五个 runs 中自然出现。

Royal Stamp 的 raw observation 同时证明：玩家拥有精确 `ROYAL_STAMP`，当前
owner 是 `NDeckEnchantSelectScreen`，interaction 可见但无 candidates。其
permission mode 已是 `migration_exploration`。因此根因是**缺少来源合同**，
不是“实现已存在但默认灰度没打开”。

### 1.3 Preview.11 可用性限制

当前本地仅保留 25 个可直接读取的 Preview.11 raw runs（223 decisions）；
历史 immutable closeout 记录 44 runs / 309 decisions。缺少的 19 个 raw
目录是 `unavailable source`，本文不伪造逐 decision 复审。下列 44-run
统计引用已提交 closeout，Preview.12 五个 runs 则由当前 raw 重新核验。

## 2. 失败分类

历史 Preview.11 44-run terminal cohort：

| 分类 | Runs | 比例 | 判断 |
|---|---:|---:|---|
| settled/human stop、cycle guard、completed boundary | 22 | 50.0% | 非 Connector 缺陷 |
| 已确认缺 source contract | 2 | 4.5% | 缺少适配 |
| event/combat unknown source 与 map contradiction | 7 | 15.9% | 混合：支持缺口或正确 Fail Closed；raw 不足以继续拆分 |
| rest 已执行后 witness mismatch/quarantine | 3 | 6.8% | contract drift，不是灰度未开放 |
| controller release 生命周期 | 4 | 9.1% | Re supervision 缺陷 |
| visible-unsupported projection | 3 | 6.8% | Gateway observation/projection 缺陷 |
| Quasar duplicate consumer rule | 1 | 2.3% | Re consumer drift |
| combat-hand unknown | 1 | 2.3% | Outcome 缺陷；unknown-no-retry 正确 |
| provider fetch failure | 1 | 2.3% | 外部 provider |

当前 Preview.12 五个 terminal runs 为：两个缺 source contract（40%），三个
正确完成边界（60%）。没有一个 terminal 是“合同和 candidate 都存在，只因
默认 gray 未开放”。一次非终止 stale 是正确 Fail Closed。环境漂移为 0，
durable qualification 为 0。

这些比例只描述指定 cohort，不代表内容总体发生概率，也不能推导正式质量。

按互斥 terminal root cause 重排后，Preview.11 的可诚实下界是：确认缺适配
2/44（4.5%）、仅 authority 未开放 0/44（0%）、contract/witness drift
3/44（6.8%）、consumer drift 1/44（2.3%）、环境漂移 0/44（0%）、Re
lifecycle 4/44（9.1%）、observation/projection 3/44（6.8%）、Outcome
1/44（2.3%）、provider 1/44（2.3%）、因 raw 不全而不能继续拆分的 unknown
source/map 7/44（15.9%）、非 Connector terminal 22/44（50.0%）。不能把
7 个 ambiguous cases 乐观分配到任一较好类别。

Preview.12 五个 retained terminals 的互斥 root cause 是：确认缺适配 2/5
（40%）、仅 authority 未开放/contract drift/consumer drift/环境漂移均为
0/5，正确 completed boundary 3/5（60%）。Fail Closed 是响应属性而不是另一
个互斥根因：两个 Royal Stamp terminal 均在 Commit 前安全拒绝；另有一次
stale command 在完成 Journey 内安全拒绝后继续。因此“安全拒绝正确”不等于
“内容适配完整”。

## 3. 架构反证

### 3.1 Royal Stamp：已知机械的新 source

精确 `v0.110.1` assembly 反编译显示：

```text
RoyalStamp.AfterObtained
-> RoyallyApproved
-> CardSelectCmd.FromDeckForEnchantment(... amount 1, min=max 1)
-> CardCmd.Enchant<RoyallyApproved>(exact card, 1)
```

这与现有 deck-enchant owner、card binding、preview controls、native parent
Commit 和 exact-card postcondition 相同；变化仅是 relic source、enchantment
和 bounds。修改前 `DeckEnchantSurfaceProvider` 手写 Self-Help Book、Symbiote
与 Kifuda 分支，所以新增来源必须编辑 Provider。这是局部适配层债务，不是
V3 wire 或执行硬壳缺陷。

本轮将四个来源移入嵌入式 `deck_enchant_source_contracts_v1`。Royal Stamp
因此只需要 reviewed SourceContract；wire、Re、candidate command、Commit
adapter 和 Outcome 均不变化。未知来源仍无 candidate。

### 3.2 已适配但没有 authority

Preview.11 rest 是反例：native Commit 已发生，但 witness label 与 catalog
漂移，Gateway 随即 quarantine。它证明灰度链真实工作，也证明 authority
缺失可能是**失败后的正确撤权**，不能一律解释成默认策略过严。

修改前另有更隐蔽的问题：session grant 只绑定 `surface + operation`；
`SourceEvidence` 只进入 evidence list。于是同一 runtime 中已晋级的
Symbiote `confirm_selection` 理论上可供 Royal Stamp 同 operation 复用。
execute-time source/owner/card revalidation 仍会保护 mutation，但不满足新
来源独立 canary 的适配合同。

本轮的 volatile authority fingerprint 改为：

```text
explicit operation contract digest
+ exact current source-evidence digest
```

同 operation 切换 source 会 supersede 旧 current grant，新 source 从
`session_canary` 开始。失败只 block 该 source partition。没有新增 wire
字段，也没有产生 durable claim。

### 3.3 相同 UI、不同 participant

`Tutor` 是 multiplayer-only，选择目标玩家的 draw pile；当前普通单人 pile
contract 绑定 local source-card owner。二者虽然使用相似 grid，participant
和 owner 不同。`Tutor` 必须保持 `code_required_new_owner_binding`，不能由
UI 相似性、registry 条目或一次 fixture 自动授权。

### 3.4 已知原语的新封闭组合

Wood Carvings replacement 是正例：选择 mechanics 可复用，但 source、原卡、
替代卡、Commit 和 deterministic replacement witness 保持独立。本轮接受
“高度自动分类和生成 proposal”，拒绝无来源的 UI 自动授权，也拒绝跨 family
万能 Transaction DSL。

一个封闭组合只有同时满足以下条件才可进入 reviewed trial：

1. parent task/source 和唯一 owner 可精确绑定；
2. 每个 child mechanic 已有明确边界；
3. participant、operand 和顺序无歧义；
4. native Commit 与 action-local Outcome 已知；
5. unknown/timeout 不触发重放；
6. proposal、fixture、静态相似本身不授权。

## 4. 适配分级

| 变化 | 期望改动 | authority |
|---|---|---|
| 新普通卡/数值/文本，沿用现有 owner/target/Commit | 零 wire、零 Re、零 Gateway core、零逐卡合同 | 沿现有精确 operation；不逐卡 canary |
| 已知 mechanic 的新 source | 零 wire、零 Re、零 core；新增 reviewed SourceContract 与生成测试 | source-partitioned session canary |
| 已知 primitives 的新封闭组合 | 非授权 impact/proposal + bounded source composition contract | 组合 source canary；不由工具直接授权 |
| 新 owner/participant/hidden-info boundary | Native Binding/code required | 无合同则 unsupported |
| 新 Commit 或 Outcome | Adapter/Outcome code required | 无新证据不得继承 |
| game/Patch/Modset 改变但依赖未变 | impact analyzer 定向重验 | 新环境不继承旧 grant |
| Patch 命中 owner/Commit/Outcome 或未知 Mod source | affected contract re-audit/code required | 最小 scope quarantine |

这不是“任意新 Mod 零代码”。当前 only exact bridge Modset 获得 mutation
eligibility；bounded Mod requalification 仍缺 Live 闭环。

## 5. 正交性与职责判决

保留：

```text
Observation -> exact source semantics -> candidate
-> one authority resolver -> execute-time revalidation
-> STS2 native Commit -> action-local Outcome/receipt
-> Re successor supervision
```

- Observation 只描述正常玩家可见事实和当前 owner；
- SourceContract 描述 source/participant/mechanic/Commit/Outcome 依赖，不执行；
- Candidate 只绑定当前 state/interaction/entity/control；
- Permission Manager 是唯一 runtime authority resolver；
- Provider/Adapter 只做 STS2-local discovery、validation、Commit、Outcome；
- Re 不维护 source whitelist，不重建 legality/completion；
- REST/MCP 仅传输；
- D/holdout/impact analysis 永不直接授权。

机器检查仍证明 94 explicit operation contracts、0 fallback authority、0
Provider action publication、0 active Re V2 sidecar。历史命名 `BridgeV2`/
`Provider` 是模块债，不是第二生产 authority；冻结前不为改名做高风险重写。

仍未完全正交的反例：

1. combat-pile 与 deck-enchant 已 registry 化，其他 source-rich family 仍以
   有界 C# binding 为主；
2. durable qualification identity 仍是 operation contract 粒度，尚未证明
   source-partitioned package 生命周期；本轮保持空仓库；
3. Patch/Mod impact analyzer 能审计固定集合，但不能自动证明 arbitrary Mod；
4. Human native-page evidence 与 distribution rollback 均缺 loaded lifecycle。

## 6. 安全边界校准

必须保留：one owner/controller、state/interaction/entity binding、publication/
execution parity、execute-time native legality、native Commit、idempotency、
`completed/not_executed/pending/unknown`、unknown-no-retry、hidden-information
boundary、action-local Outcome 和 exact runtime attribution。

可收缩但不能删除：

- 不需要每张数据型新卡逐卡 canary；
- 无关 Patch/Mod 变化应由依赖影响分析局部隔离，而不是永久全局失明；
- source canary 应是一次 volatile 分区试跑，不应演变成长期人工白名单；
- Human native page 和 loaded rollback 是 Distribution/Human freeze 条件，
  不是 Core Execution 正确性的前置条件；
- durable qualification 是发布能力，不应阻止 migration-exploration 在 exact
  owner/source/Commit/Outcome 下进行 session trial。

## 7. Freeze 状态

| Layer | Verdict | 未关闭条件 |
|---|---|---|
| Core Execution | `freeze`（架构）/ 新 artifact Live pending | cold-load 后验证 source-partition trial、idempotency 和 no-retry 未回归 |
| Vanilla Capability | `conditional freeze` | Royal Stamp、Kifuda、Quasar、combat-hand、rare potion/selector 最终 artifact 证据不全 |
| Adaptation/Compatibility | `not frozen` | Royal Stamp Live、跨版本定向重验、bounded Mod、source-aware durable package 未证明 |
| Distribution/Operations | `conditional freeze` | loaded revoke/rollback、fresh-machine workflow 和本地入口一致性仍需证据 |
| Human Evidence | `not frozen`，独立可选 lane | native page open/read/return/recovery 未 Live |

总判决是 **conditional freeze**。拒绝“当前所有 V3 已冻结”，也拒绝推翻
V3 或另起 V4。

## 8. 本轮实现和可证伪实验

实现：

- reviewed embedded deck-enchant SourceContract registry；
- Royal Stamp 精确 source contract；
- Provider 三处 source 特判删除；
- source-evidence-partitioned volatile trial、supersede 和 quarantine；
- 七类 non-authorizing adaptation holdouts；
- registry、owner、bounds、source rotation 和 negative tests。

下一次 exact-runtime 实验必须可证伪：

1. cold-load 新 SHA/MVID；
2. Royal Stamp 显示精确 candidates，而未知相同 UI source 仍 unsupported；
3. Royal Stamp 首个 operation scope 为 `session_canary`，不能继承此前 Symbiote
   的 `session_trial_confirmed`；
4. select/preview/confirm 产生 native receipt，exact card 获得
   `ROYALLY_APPROVED:1`；
5. witness mismatch/unknown 只 quarantine 精确 source partition；
6. Kifuda 未自然出现则保持 `not exercised`；
7. 不从本轮结果创建 durable qualification。

## 9. Non-claims

- 新 artifact 尚未 loaded 或 Live；
- Royal Stamp 修复尚无 exact-runtime mutation evidence；
- Kifuda、Quasar、combat-hand changed path 未在 Preview.12 五个 runs 中出现；
- arbitrary Mod、自动跨版本 qualification、source-aware durable claim 未证明；
- optional Human native page 与 loaded revoke/rollback 未证明；
- 三个完整 Journey 只证明到达的序列，不证明每个 vanilla source。

## Post-amendment authority regression and repair

Runs `run-20260803143253-wnuxbv`, `run-20260803143304-8mi9zg`,
`run-20260803143312-6r936n`, `run-20260803143321-y1skm9`,
`run-20260803143329-w1gj7x` and `run-20260803143347-9lo5z4` used Re source
`5e57e47028b780619a9cd37b0cd13aeaebddaa2a`, but their Gateway reported the
previous artifact SHA `c9f61d76...e72b24` and MVID
`2b388d99-5a1b-46a7-9626-029a679deba0`. The actionable runs therefore
provided a real prior-artifact regression plus a deployment identity mismatch,
not evidence about the corrected binary. Their first actionable commands were
rejected before native Commit with `permission_or_contract_changed`; two runs
stopped correctly as visible unsupported while the Gateway was non-actionable.

The prior-artifact regression was confirmed in code: `AdmitEncounter` created
an exact source grant, then policy re-application could replace it with the
base operation fingerprint, while execute-time `FindActionScope` did not have
the source evidence needed to find an encounter scope. The repair now projects
an active same-environment/source grant unchanged across `Apply`, and relies
on the single `PermissionManager.AuthorizeExecution` resolver for the final
exact grant and contract check. The redundant source-blind lookup was removed;
the V2 observe path now passes raw evidence when it needs the helper.

Repair verification:

```text
source revision       5e57e47028b780619a9cd37b0cd13aeaebddaa2a
Gateway source digest fbbaf79a8b217c9a77c68726a252123a2e68952ab72d1c3c362b38d0af554205
built/installed SHA   1c0e2d82108a44105c45d63caee79a4000c271525b6cff481de748b6d0c20c97
built/installed MVID  fd3177e5-bc0c-4acd-8097-ea237957a152
rollback              STS2MCP/.local/deployments/2026-08-03T14-39-21-413Z
loaded                non-claim
```

The source-partition re-application regression test and all 287 Gateway tests
pass. At the time this repair verification entry was first written, the
corrected artifact had not yet been cold-loaded, so no mutation receipt could
be claimed. The exact-runtime addendum below supersedes that temporal state.

## Exact-runtime Repair Verification

The corrected artifact was subsequently cold-loaded and verified with
`npm run verify:loaded`:

```text
run                   run-20260803144301-4vnzxu
source revision       5e57e47028b780619a9cd37b0cd13aeaebddaa2a
protocol              3.0-preview.12
built/installed/loaded SHA  1c0e2d82108a44105c45d63caee79a4000c271525b6cff481de748b6d0c20c97
built/installed/loaded MVID fd3177e5-bc0c-4acd-8097-ea237957a152
runtime               867402a815084c54b6d9eb0d9973aa80
game                  v0.110.1 / db5d3552 / -205573697
Modset                exact_bridge_only
decisions             106
settled commands      103
terminal              completed_run_boundary
qualification         empty; persistent authority disabled
```

All 103 attempted commands were direct V3 commands. Each returned a
completed receipt with an available successor and `retry.allowed=false`.
The run covered combat, event, map, reward, rest and deck-upgrade selection,
and reached game-over before stopping at the top-level menu. The two event
settling observations were safely non-actionable; the final non-actionable
menu is the intentional bounded-run stop. No stale, unknown, unsupported or
provider/parse failure occurred.

The game log recorded one `Invalid Task ID` from Godot's worker-thread task
wait during asset loading, but no corresponding Gateway error, command
failure, unknown outcome or incomplete receipt exists in the run. It is
therefore recorded as a non-blocking game/runtime log observation, not a
Connector regression.

This closes the mixed-deployment blocker for the repaired authority path, not
the entire V3 freeze. Royal Stamp, Kifuda, Quasar, changed combat-hand
confirmation, Human pages, loaded rollback/revoke and durable qualification
remain unclaimed until their own exact evidence exists.
