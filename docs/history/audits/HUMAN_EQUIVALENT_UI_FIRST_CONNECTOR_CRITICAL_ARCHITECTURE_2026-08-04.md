# SpireAgent Human-Equivalent UI-First Connector

## 以人类可达界面为默认权威的架构批判、替代方案与冻结建议

**日期：2026-08-04**  
**目标分支：`human_euivalent_connector`**  
**分支起点：`connectorV3@5e57e47028b780619a9cd37b0cd13aeaebddaa2a`**  
**继承协议：`3.0-preview.12`**  
**文档性质：本分支的架构审计、目标合同与迁移依据。除非另有精确证据，文中目标均不是当前实现、Live、qualification 或迁移完成声明。**

---

## 0. 执行摘要

Connector V3 的默认路径是：

```text
玩家可见状态
-> exact source / owner
-> operation contract
-> authority
-> execute-time native revalidation
-> native Commit
-> action-local business Outcome
-> receipt / successor
```

它修复了 V1 的真实问题：旧索引落到新页面、弱实体身份、读取路径意外触发操作、重复 mutation、多写者、请求返回被误当成事务完成，以及客户端自行重建 legality。

但 V3 进一步把一个并非必然的产品假设固定进连接器：

> Agent 只有在 Connector 理解当前控件背后的精确 source、事务、Commit 和 Outcome 后，才能执行这个人类已经可以执行的 UI 操作。

对“一个 Agent 使用的真实游戏连接器”，这个假设过重。

本报告提出：

> Connector 默认提供 Human-Equivalent UI Authority：Agent 可以看见人类当前能够获得的界面信息，并执行人类当前能够通过真实游戏 UI 执行的操作。

局内不实施“保护这一局”的策略性安全。Agent 可以做错误选择、浪费金币、删除好牌、跳过奖励、选择高风险事件、输掉或主动放弃本局。它们是游戏行为，不是 Connector 安全事故。

Connector 只保护输入和管理边界：

```text
请求是否仍指向当前页面上的那个控件
输入是否只送达一次
页面是否已经变化
信息是否真的是人类可达的
多个控制者是否同时输入
主菜单中的持久管理行为是否符合政策
应用进程是否会被退出
```

建议长期架构：

```text
Human-Reachable Observation
+ Current UI Affordances
+ State/Frame-Bound Input
+ Delivery Ledger
+ Successor Observation Stream
+ Main-Menu Governance
```

exact business source、source-specific authority、native effect taxonomy、business completion 和 per-source Outcome witness 降为可选诊断、评估或加速信息。

---

## 1. 产品目标

当前 V3 更接近“解释、授权、执行并证明游戏内部业务事务的语义网关”。它要求理解 source、participant、native Task、Commit、child/parent transaction 和完整 Outcome。

Human-Equivalent 目标更直接：

> 让 Agent 像拥有完整结构化视觉、鼠标、键盘和持续观察能力的人类玩家一样操作真实 STS2。

人类不需要知道 `LuminousChoir.ReachIntoTheFlesh`、`CardSelectCmd.FromDeckForRemoval` 或完整 Outcome topology，仍然可以完成事件选项、选择器、preview、confirm 和后续观察。

因此本分支采用：

```text
Human-Equivalent UI is the default authority boundary.
```

- 游戏 UI 是行为权威；
- 人类可获得的信息是信息边界；
- 当前真实可执行的 UI affordance 是动作边界；
- Agent 负责局内策略和业务结果理解；
- Connector 不负责保护本局质量；
- 主菜单和持久状态管理使用独立政策。

---

## 2. Human-Equivalent 的精确定义

### 2.1 Human-Reachable Information

HRI 是正常玩家从当前游戏状态出发，通过普通 UI 行为能够获得的信息。

包括：

- 当前直接可见文本、卡牌、遗物、药水、敌人、资源、选择状态和 enabled/disabled；
- hover、focus、tooltip、scroll、展开、折叠、tab、翻页和详情能够揭示的信息；
- 打开牌组、弃牌堆、消耗堆、地图、商店和原生详情页面能够获得的信息；
- 点击、选择、preview、cancel、confirm、abandon 后出现的 successor UI。

关键结论：

> 观察不是一张静态快照，而是 Agent 与 UI 交互后形成的连续可达状态。

### 2.2 Human-Equivalent Action

当前人类玩家能够通过真实 UI 执行的动作，例如：

```text
hover
focus
scroll
open
close
expand
collapse
select
deselect
drag
drop
activate
confirm
cancel
play
use
end turn
skip
abandon run
return to menu
```

Connector 不需要先理解完整业务结果才允许它们。

### 2.3 等价不等于物理复刻

如果直接读取 `tooltip_text` 与玩家 hover 所见一致，可以返回 `provenance=hover_equivalent`，不必真的等待鼠标停留。

如果直接结构化读取牌组与真实打开牌组得到的信息完全一致，可以作为 human-equivalent read；若等价性不确定，则真实打开页面并发布 successor。

允许语义捷径的条件是：结果不得超出人类可达信息边界，且必须记录 provenance。

---

## 3. 观察与操作不应被错误地二分

旧式模型常把观察定义成“绝对无副作用的读取”，把打开页面、hover、scroll 或推进一步都算 mutation。

对 UI Agent，这个划分不自然。

人类获取信息本来就会：

- 移动鼠标；
- 打开牌组；
- 切换 tab；
- 展开详情；
- 进入 preview；
- 返回上一页。

这些动作可能改变 UI owner 或页面，但并不等于绕过 UI 修改游戏规则。

更合理的区分是：

```text
Human-equivalent UI transition
vs
non-UI engine mutation
```

前者属于正常感知与交互，后者才需要特殊审查。

---

## 4. 局内策略不属于 Connector 安全

在一局中，以下行为全部允许：

- 删除关键牌；
- 买错物品；
- 错过奖励；
- 选择危险事件；
- 浪费资源；
- 做不可逆选择；
- 失败；
- 主动放弃本局；
- 返回主菜单。

Connector 不应把“可能对本局不利”误判成安全风险。

真正必须保护的是：

- stale request；
- duplicate delivery；
- wrong current control；
- multiple writers；
- unbound pointer；
- hidden information leakage；
- destructive persistent management；
- application exit。

这叫 run-local non-paternalism：局内不替 Agent 做策略监护。

---

## 5. 主菜单治理边界

主菜单不是完全禁止区，但需要明确分类。

普通游戏生命周期默认允许：

- 开始游戏；
- 继续游戏；
- 放弃当前 run；
- 返回菜单；
- 角色和普通模式选择。

持久管理需要政策：

- profile 创建、切换和删除；
- save-slot、云存档和重置；
- Mod 启用、禁用和 load order；
- 影响未来会话的全局设置；
- 文件导入导出；
- quit application、process termination。

建议：退出应用和破坏性 profile/save 操作默认拒绝或需要显式 operator grant。返回主菜单不是退出应用。

---

## 6. UI-first 的最小安全内核

### 6.1 完整 UI Observation

应同时提供：

- rendered frame；
- structured UI tree；
- 当前 modal/UI owner；
- controls/entities 的 role、label、bounds、selection、enabled、actions；
- hover/focus/scroll/page reveal opportunities；
- completeness 和 hidden-by-policy。

### 6.2 State/Frame-Bound Identity

每个动作必须绑定：

```text
request_id
expected_state_token
expected_frame_id
expected_owner_id
exact control/entity/target id
controller generation
```

旧请求不能在页面切换后重新找到一个同名控件并执行。

### 6.3 Execute-Time Actionability

执行前重新验证：

```text
current
visible
enabled
stable
receives input
belongs to current owner
still advertises requested action
```

### 6.4 Delivery Ledger

回执描述输入投递，而不是完整业务事务：

```text
not_applied
applied
pending_delivery
unknown_delivery
```

`unknown_delivery` 不盲目重试。Agent 通过 successor observation 判断发生了什么。

### 6.5 Structured First, Visual Fallback

优先结构化控件。对 Mod 自绘 UI，如果没有结构化 control，可提供 frame-bound pointer fallback，但必须：

- 目标来自当前 frame；
- 有明确 bounds/region；
- frame 变化立即 stale；
- 不接受长期坐标；
- 不允许任意 node path、method 或 reflection mutation。

---

## 7. 当前 V3 的批判性复盘

### 7.1 V1 证明什么

V1 证明 index mutation、弱实体身份、读写混合、无 ledger 和 submission-as-success 不安全。

它没有证明：每个人类可点击控件都必须先拥有完整 business source/Commit/Outcome 合同。

### 7.2 Luminous Choir

V3 通过 source-specific contract 精确证明两张牌删除、Spore Mind 增加和事件完成。这对自动事务证明有价值。

但从 Human-Equivalent 角度，Agent 可能只需要操作当前两张牌选择器、preview 和 confirm，然后观察 successor。完整事务合同不是执行当前真实 UI 的必要前提。

### 7.3 Royal Stamp

Royal Stamp 在 UI 上真实可见且可操作，却因缺 source contract 没有 candidate。后续新增 registry 修复了该 source，但也证明 source-contract 模式会把每个新来源变成 Gateway 适配工作。

Human-Equivalent 默认应允许当前真实控件，不因 source registry 缺项阻塞。

### 7.4 Rest Smith 与 combat-hand

Rest Smith 的 native 动作已发生，却因 witness label drift 被 quarantine；combat-hand confirm 已被消费，却因后继进入 game-over 而被旧 witness 记为 unknown。

它们说明 Connector 试图证明完整业务 Outcome 时，也会误伤已经成功的真实 UI 输入。

### 7.5 Quasar

Quasar 曾被 Re 的第二份 source mechanics 拒绝。它说明语义越分散到 Gateway、catalog、permission 和 consumer，越容易形成重复规则和漂移。

---

## 8. 目标架构

### Layer A: Rendered And Structured Observation

发布 rendered frame、UI tree、当前 controls/entities、provenance 和 completeness。

### Layer B: Human-Reachable Reveal And Navigation

支持 hover、focus、tooltip、scroll、tab、details、native page open/read/return 和 recovery。

### Layer C: Current Affordance Executor

支持 current advertised target 上的 activate/select/deselect/confirm/cancel/drag/drop 等有限动作。

### Layer D: Delivery Ledger

确保输入只投递一次，明确 not-applied/applied/pending/unknown。

### Layer E: Successor Supervisor

持续发布新 state/frame/owner 和 diff，不替 Agent断言完整业务完成。

### Layer F: Main-Menu Governance

管理 profile/save/Mod/global settings/quit application；不干预正常局内战略。

### Optional: Semantic Overlay

可提供 source_hint、purpose_hint、expected transition、business evaluation 等，但它们默认不授权，也不阻塞当前 UI affordance。

---

## 9. 与当前 Connector V3 的关系

直接复用：

- state token 和 stable identity；
- one-controller lease；
- request ledger；
- stale refusal；
- exact runtime provenance；
- strict Re decode；
- REST/MCP transport-only；
- evidence recording。

需要降级：

- exact source 作为所有操作的 authority 前提；
- per-source operation contract；
- business Outcome 作为默认 completed 标准；
- unknown source 自动无动作；
- native pages 仅作为 operator evidence。

保留 source-aware 路径的场景：

- 不经过真实 UI 的深层 native API；
- UI 无法表达输入参数；
- 需要正式 business assurance 或 evaluation；
- 非人类可见或多人 participant 特殊路径。

---

## 10. Agent 与 Re 的责任

Re 的循环应是：

```text
observe complete current UI
-> reveal/navigate for missing information
-> choose current affordance
-> submit once
-> inspect delivery receipt
-> observe successor
-> update strategy
```

Re 负责：

- 理解当前在事务哪一步；
- 判断后继状态意味着什么；
- 处理 settling、preview、child page；
- 避免在 unknown delivery 下重复动作；
- 必要时 cancel、返回或 abandon run；
- 记录策略失败，但不把它们冒充 Connector failure。

---

## 11. 版本与 Mod 适配

Human-Equivalent 的目标是接近“人还能玩，Agent 就仍有机会玩”的兼容边界。

- 数据型新内容通常零 core 改动；
- 同 UI 机械的新 source 不要求 registry；
- 新自定义控件需要 accessibility adapter 或 frame fallback；
- 游戏版本只要 human-visible UI contract 可用，不应因内部 method digest 改变而自动全局失效；
- Mod 改变控件背后的游戏规则时，Agent通过 successor 理解结果。

但这仍需要证据，不能自动宣称 arbitrary Mod compatibility。

---

## 12. 迁移与证伪

### HE-1 Shadow Observation

不改变现有 V3 authority，新增 rendered frame、structured UI tree、reveal opportunities 和 current affordance proposal。

### HE-2 Reveal/Navigation

将 hover、tooltip、scroll、native pages 和 reversible UI transitions 放入正常 Agent flow。

### HE-3 Generic Affordance Canary

选择 Royal Stamp 或另一个 source-unresolved 但 UI 明确的 selector，使用 state/frame-bound generic UI actions 完成，保留 stale、duplicate 和 unknown-delivery 保护。

### HE-4 A/B

比较 source-contract V3 与 Human-Equivalent：

- 新内容代码量；
- Gateway/Re 分支数；
- 完成率；
- stale/duplicate；
- false quarantine；
- Agent token 成本；
- 状态误判；
- 跨版本和 Mod 适配。

### HE-5 Main-Menu Governance

证明 abandon-run/return-menu 可用，同时 profile/save destruction 和 quit application 被阻止或显式授权。

---

## 13. 冻结判断

### Inherited Input Integrity

可复用并优先保留：state/frame binding、one controller、ledger、execute-time actionability 和 unknown-delivery no-retry。

### Universal Business Semantic Contract

不应作为本分支长期默认架构冻结。它有 assurance 价值，但不是每个真实 UI 输入的必要条件。

### Human-Equivalent UI-First

当前为 accepted architecture target，尚未实现、构建、加载或 Live。必须通过 exact-runtime holdout 才能冻结。

---

## 14. 最终结论

Human-Equivalent UI-first 的核心目标是：

> 忠实地暴露人类当前能看见、能揭示、能导航和能操作的真实 UI，让 Agent 自己通过连续状态理解游戏，而不是要求 Connector 预先理解所有业务事务。

Connector 真正不能外包的是：

```text
旧请求不能落到新 UI
输入不能重复送达
当前目标必须真实可操作
多个控制者不能同时写
信息不能超出人类可达边界
主菜单持久管理必须受政策约束
应用不能被意外退出
```

局内选择好坏、是否失败、是否放弃，不属于 Connector 安全。

目标架构是：

```text
Rendered + Structured Human-Reachable Observation
+ Reveal/Navigation
+ Current Affordance Execution
+ State/Frame Binding
+ Delivery Ledger
+ Successor Stream
+ Main-Menu Governance
```

这比 V1 严格得多，也比全 source-contract 模式更符合 Agent 的闭环本质。