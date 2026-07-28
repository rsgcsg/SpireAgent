# SpireAgent A 主线工作流与计划纠偏审计

**审计基线：** `develop@2962fa9b7ba4c9c61cb4f1c7f57bd5dcea013ebd`  
**日期：** 2026-07-28  
**性质：** 当前计划与工作流的批判性审计；不是运行权限、协议或产品能力声明。

## 1. 执行裁决

SpireAgent 的主要用户价值来自外部 Agent A：它应在真实 STS2 中持续获得
可信决策事实、选择 Gateway 发布的动作、完成一局、被独立评测，并逐步证明
能力提高。Connector C、评测 D、产品 P 和研究 X 都有独立责任，但不应与 A
争夺顶层产品目标。

当前架构不需要整体替换。继续采用 ADR-0002 的 A-first Semantic Gateway
两平面架构，并保留 STS2/Gateway 权威、opaque state-bound action、执行前
复验、native Commit、Inspection 非授权和 unknown-no-retry。真正需要重构的
是计划结构：canonical 文档虽然已经写入 A-first，实际顺序仍长期 C-first，
并把已经存在的官方 Re runtime 写成 Gate 4 的未来能力。

采用唯一的顶层里程碑：

```text
M0  Trustworthy Live Interface Baseline       已按 bounded scope 关闭
M1  Measurable External Agent Baseline        当前
M2  Demonstrated Agent Capability Improvement 下一核心阶段
M3  Player-Controlled Agent Alpha              产品化
M4  Guarded Improvement And Sustainable Beta  长期
```

`A/C/D/P/X` 改为贯穿里程碑的 readiness tracks。旧 Gate 仍可作为技术退出
清单和历史证据索引，但不再充当互相串行的顶层产品阶段。

## 2. 当前事实与证据边界

### 2.1 当前代码与文档事实

- 当前主线只有 `Re-SpireAgent/` 与 `STS2MCP/`；旧 P8--P15 已归档。
- ADR-0002 是唯一宏观目标架构；ADR-0003/0004 分别约束 native-contract
  迁移和 risk-calibrated trial/claim。
- Re 已经是实际外部 Agent runtime，不是 Gate 4 才会出现的未来组件。
- 当前 full normalized evidence 仍直接进入 Prompt；Inspection 在适用构建上
  仍是 eager consumption，没有 accepted 的通用 DecisionProjection。
- Gateway 的权限、证据、Profile 和 operation 迁移设施已经显著复杂；它们有
  调试与适配价值，但数量不能作为产品成熟度。

### 2.2 最新真人 run

`run-20260728132337-ce2195` 在精确 Preview.72 SHA/MVID/runtime 下完成了一次
main-menu-to-game-over-to-main-menu 的 bounded journey：

```text
decisions                         146
executed_and_settled              144
pre-execution stale rejection       1
run boundary                        1
unsupported / invalid                0
observation / provider failure       0
unsettled / unknown mutation         0
```

它跨越 combat、event、map、reward、rest、shop、treasure、transform、menu 与
game-over，并包含一次 shop card purchase 和一次 reward potion discard。唯一
stale 选择在执行前被拒绝，随后 fresh observation 继续。

这证明 Preview.72 的普通 bounded loop 在该精确 runtime 上可运行，也使旧文档
“Preview.72 尚无 action evidence”的表述失效。但它的 provenance 是
`unrecorded`，Inspection 对该构建仍禁用，且没有自然遇到 Hefty/actionless-
settling 修复分支。因此它不是 Organic qualification、persistent
qualification、可见信息闭合或跨环境兼容证明。

本 run 的 145 个模型 Prompt 共发送约 1.69 MB user payload，平均约 11.7 KB，
最大 23.6 KB；最大样本是 `deck_transform_selection`。这不是 Prompt 质量差的
直接证明，但足以把“完整 evidence 与策略输入分离”列为可测量的 A-facing 债务。

### 2.3 证据等级

| 等级 | 本报告中的含义 |
|---|---|
| E4 | 当前精确 runtime 的真实 mutation 与 successor evidence |
| E3 | 当前代码、测试、协议和 loaded identity |
| E2 | recorded fixture/replay/static source audit |
| E1 | canonical 或历史文档声明 |
| E0 | 附件中的候选设计或工程推断 |

里程碑完成不能由 E0/E1 单独证明。一次 E4 run 也不能外推为跨版本、跨 Mod、
战略质量或全覆盖。

## 3. 按严重程度排序的问题

### 严重：A-first 口号与 C-first 资源顺序冲突

`PROGRAM_PLAN` 曾把 C 标为 current delivery priority、D 标为 subordinate to
Connector needs、A 标为 frozen baseline，同时把 Agent improvement 排到成功
顺序末端。Connector 永远会有未知 Surface、Mod 和可见信息缺口；若以“C 完整”
作为前置，A 能力工作将永久不能开始。

**修正：** 当前是 M1，A 负责冻结可测 baseline；C 只关闭阻塞该 baseline 或
已批准 A 实验的真实缺口；D 同时独立验证 C correctness 与 A capability。

### 严重：Gate 同时承担产品路线、技术 readiness 与历史证据

Gate 2 的可见信息闭合本质上是持续 track，不存在抽象意义上的一次性“全游戏
完成”。Gate 3 的最小单写者协调已经实现，而 Gate 4 仍写成 Companion And
Official Agent，误导读者以为当前没有官方 Agent。

**修正：** 顶层采用 M0--M4。Gate 0/1 映射到 M0；Gate 2 成为 M1-C track；
Gate 3 成为 M1 的 C/P coordination checklist；原 Gate 4 改为 M3
Player-Controlled Agent Alpha。

### 高：完整 evidence、治理数据与模型输入仍耦合

保留完整 evidence 是正确的，但每次决策把完整 normalized state、重复 action、
permission/compatibility diagnostics 和 Inspection 数据送给模型，不等于“完整
暴露玩家信息”。它可能同时产生治理噪声和策略信息缺失。

**修正：** EvidenceRecord 永久完整；DecisionProjection 只作为 Re-owned、
scope-specific、paired-evaluated candidate。首个 generic projection 已失败，
不得复活为默认方案，也不得提前冻结成 SDK。

### 高：D 被过度绑定 Connector，尚不能独立证明 A 提高

现有 D 工具有 valuable fixtures、replay-printing、permission evidence 与 grader
pilot，但还没有 representative/held-out baseline、统一报告或 capability grader。
因此“完成更多 run”仍难以回答模型是否更会玩。

**修正：** D 的当前首要交付是 M1 baseline contract：版本化场景、代表/held-out
划分、provider/config identity、成本/延迟/validity/run 指标和反例。D 不授予
Gateway 权限，也不接受 A 的自我评分。

### 中：Outcome 分层方向正确，但不应先做通用 Receipt 重构

Silver Crucible 空宝箱证明 Projection 与 CompletionProbe 曾对同一生命周期使用
不同事实；Kifuda、treasure、navigation、purchase 也证明 family 的最低确认边界
不同。附件建议的 admission/commit/successor/effect/continuation 分层有诊断价值。

但当前 run 已经证明普通 loop 可闭合。立即改写所有 Receipt/Oracle 会扩大回归面，
并可能创造另一个万能 transaction model。

**修正：** 先对代表 family 做 non-authorizing outcome shadow 与
Projection/Oracle parity；只有真实 stop policy 或诊断收益被证明后才改 wire。

### 中：Context/Surface/Binding 仍需要更精确的目标 taxonomy

附件正确反驳了“相同 UI 就共享业务语义/权限”。推荐长期区分：

```text
World/Run Context       当前世界与 run 背景
Decision Purpose        当前为什么需要决策
Interaction Surface     玩家现在如何交互
Native Binding          owner/source/participant/commit 的内部精确绑定
Outcome                 当前动作已确认到哪一层
Inspection              玩家正常可查的只读资源
Agent Memory            A/D 管理的历史与外部知识
```

当前 wire 尚未完整实现这套分层，因此它是 migration target，不是当前协议事实。
共享 interaction 只能复用机械与 A-facing schema，不能自动共享权限、Commit 或
Witness。

## 4. 对六份附件的裁决

### 接受

- A 是主要价值流；C 是独立事实/动作权威，而不是最终产品。
- Current Decision Truth、Inspectable Context、Execution Integrity、Outcome
  Reconciliation、Compatibility/Evidence 的优先顺序基本正确。
- complete evidence 与 model view 必须分开。
- operation/contract/qualification 数量不能作为顶层成功指标。
- D 应成为正式独立评测工作流，不能只是 Connector 的零散脚本。
- 相同 interaction 可以共享机械，但 purpose、binding、result 仍需正交表达。

### 修正

- 不是“Bridge v2 已经偏离 A”，而是 accepted architecture 已 A-first、当前计划
  与实现优先级尚未兑现。
- “完整玩家可见信息”不是 raw UI dump；必须区分当前观察、可查未请求、隐藏、
  不适用、不可用、失败和 stale。
- “游戏风险不高”不允许 unknown mutation 重试；风险校准只能改变需要确认到
  哪一层，不能消除执行事实不确定性。
- `DecisionProjection`、bounded inspect-before-act、layered Outcome 都是候选，
  不是仅凭文档就接受的 runtime architecture。

### 拒绝或后置

- 为了计划整齐而一次性重写所有 Surface、Receipt 或 permission identity。
- universal selector、Effect DSL、transaction/workflow engine 或 raw SceneTree。
- 在没有第二真实 consumer 前冻结公共 Agent SDK。
- 在 M1 baseline 之前启动 stable memory、learning、Headless 或 post-training。
- 用一局胜利、operation 数、Prompt 长度或一次 canary 证明项目完成。

## 5. 唯一顶层计划

### M0：Trustworthy Live Interface Baseline

**状态：** bounded closed。包括 Gate 0 source truth、Gate 1 v2-only ordinary
journey、opaque action、execute-time revalidation、one-game boundary 与 v1
retirement。非声明包括完整游戏/Mod/visible-info/persistent qualification。

### M1：Measurable External Agent Baseline

**状态：** current。

按依赖顺序：

1. 冻结 A baseline identity：Re version、Prompt/config/provider、Connector
   protocol/schema 与环境 provenance。
2. D 建立最小 representative/held-out scenario split 和统一 baseline report。
3. 记录 run completion、stop reason、invalid/stale/unknown、provider、cost、
   latency、Prompt bytes 与 action-family coverage。
4. C 只修复 baseline 与真实候选实验暴露的 decision truth、Inspection、owner、
   settling、visible fact 和 action-local outcome 缺口。
5. P 保持最小 controller lease、启动诊断、恢复与 rollback，不扩展成账户安全。
6. 选择一个低风险 A candidate 做 offline/replay -> paired -> counterexample ->
   held-out -> shadow；不改变 live baseline。

**退出：** baseline 可重现；代表与 held-out 分离；一份报告能联结 exact game/
Gateway/Re/provider/Prompt/outcome；至少一个 A candidate 被诚实接受或拒绝；C
阻塞可归因且 unsupported 清晰；没有 stable learning。

### M2：Demonstrated Agent Capability Improvement

在 M1 后比较 scope-specific projection、inspection policy、planning、read-only
retrieval、provider/budget policy。只有 held-out 战略结果、风险校准、成本和回滚
共同改善，才叫能力提高。先 shadow，再 bounded live admission。

### M3：Player-Controlled Agent Alpha

Companion、BYOK secret brokerage、pause/takeover/recovery、安装升级回滚和私有
分发。它交付已经验证的 A，不负责创造 Agent capability，也不接管 Gateway
动作权威。

### M4：Guarded Improvement And Sustainable Beta

在 proposal、独立评测、activation、rollback 和 provenance 完整后，才允许
persistent memory/learning。Workshop、第三方 SDK、插件与生态需独立安全和
第二 consumer 证据。

## 6. Readiness Tracks

| Track | 当前职责 | 当前优先级 |
|---|---|---|
| A | baseline、Prompt/view、provider、监督、未来能力候选 | M1 primary value |
| C | 玩家可见事实、动作、native commit/outcome、适配 | 修真实 A/D 阻塞 |
| D | 独立 scenario、replay、grader、held-out、报告 | M1 必需 |
| P | 启动、单写者、诊断、恢复、产品生命周期 | 最小基础；M3 扩展 |
| X | Headless/post-training/研究加速器 | admission-gated |

价值优先级不改变权威：A 不能定义 game truth，D 不能授予动作，P 不能绕过
Gateway，X 不继承 Live permission。

## 7. 可证伪的近期实验

1. **Baseline repeatability：** 同一 frozen config 在 representative cases 上能否
   重现报告；失败则 M1 contract 不成立。
2. **Prompt duplication：** 对相同 evidence 比较 full 与 scope-specific view 的
   semantic retention、action validity、provider failure、token/latency；若无净收益，
   拒绝 projection。
3. **Inspection policy：** 比较 eager、family-required、bounded-requested；若请求
   模式增加 stale/coherence 或无策略收益，维持 eager。
4. **Outcome shadow：** 在 treasure/navigation/end-turn/purchase/selector 上检查
   layered shadow 是否比现有 outcome 更能解释停止且不掩盖 unknown；否则不改 wire。
5. **Context taxonomy：** 对同 interaction 不同 purpose/source 的 paired fixtures
   验证模型信息与 Gateway binding 是否可分别表达；失败则不共享 wire schema。

## 8. Non-Claims 与下一步

本审计不改变代码、协议、动作权限、loaded artifact 或 live behavior。它不接受
任何新 DecisionProjection、Inspection policy、Outcome wire、memory、learning、
Companion 或 SDK。

当前下一工程顺序是：

```text
冻结 M1 A baseline identity
-> 建最小 representative/held-out D contract
-> 生成第一份统一 baseline report
-> 选择一个 scope-specific A candidate
-> 只修实验暴露的 C 阻塞
```

继续长跑仍有价值，但应按代表范围和停止条件采集；不再把增加 transition 数量
本身当作项目进度。
