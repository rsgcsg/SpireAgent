# SpireAgent 可见性与观察架构审计

日期：2026-07-22  
审计基线：`develop@f4f8eb38bc48e3c2fbc5685672c3ec55e0512482`  
性质：当前代码与证据审计，不是协议变更、架构批准或运行资格声明

## 1. 结论先行

当前架构的安全边界比信息投影边界成熟。

应保留的核心分层是：

```text
shared_state + semantic context + one active surface + typed inspection
                         |
                         +-> independently gated action authority
```

它已经较好地回答：当前是什么游戏语义、哪个 UI 合同拥有输入、哪些
动作由 Gateway 发布、怎样进行 state-bound revalidation、怎样避免
Inspection 获得动作权。没有证据支持推翻 `Context + one Active Surface`
或改成万能 UI tree / universal fact IR。

当前最重要的缺陷位于 Re 消费边界：

1. `NormalizedCurrentState` 同时承担完整证据、严格解码结果、回放状态和
   DeepSeek 策略输入；缺少独立且可审计的 `StrategyPromptProjection`。
2. Re 会读取当前 catalog 广告的所有 Inspection，而不是按策略需要选择；
   `estimatedCost` 和 `recommendedFor` 目前只记录、不参与消费决策。
3. `run_deck` / combat piles 同时进入 `player` 和
   `bridgeInspectionFacts`，Surface 内的 `legalActions` 又与 Prompt 顶层
   `allowedActions` 重复。完整证据没有错，但当前 Prompt 投影有实际重复。
4. 可见性合同能表达总体 partial、catalog、hidden policy 和 read
   evidence，却不能在事实组附近统一区分 empty、not applicable、not
   observed、available but not requested、unavailable、read failed 和 stale。
5. linked hover / preview / keyword closure 仍未实现为完整 catalog；玩家可见
   信息目标尚未闭合。

这不是当前动作权限漏洞。模型可见信息和动作授权在结构上仍分离：模型只能
选择 Gateway 广告的 opaque action，Inspection、描述文本和 diagnostics 都
不创建权限。本轮不应以“优化 Prompt”为理由触碰该安全壳。

暂定方向是：保留 Gateway wire 分层，在 Re 内先以 shadow-only、版本化、
可回放的策略投影做小实验；只在实验证明需要后，增加少量事实组级
availability 元数据。不要立即引入全局 `Observation<Fact>` 框架，也不要立即
开放模型多轮任意查询。

## 2. 证据等级与边界

本文使用以下等级。等级说明证据类型，不表示自动获得 Qualification：

| 等级 | 含义 |
|---|---|
| `E4` | 当前 checkout 的精确代码链、已安装程序集或可追溯的当前源码/UI 调用链 |
| `E3` | 当前代码、类型、fixture/test 或机械统计；不能单独证明 live 行为 |
| `E2` | 本机 ignored runtime artifact、历史/Canary 记录或 canonical 文档中的有界证据 |
| `E1` | 外部公开仓库、论文或协议文档；只能提供比较和假设 |
| `I` | 工程推断，必须用后续实验证伪 |

本轮没有启动游戏、没有执行 action、没有新增 Organic Evidence，也没有改变
当前 SHA/MVID 的权限或资格状态。本机临时审计目录中存在 v0.109 反编译
源码，当前安装的 `sts2.dll` SHA-256 为
`06c78d946ca70658e85abb28f6dc2ee0a023a4467faf0708ff542180fe5f4c82`。
本轮没有重新反编译，因此反编译目录与该精确 SHA 的归属仍是 provenance
限制；这里只把相关代码当源码/UI 语义审计，不把它当当前 loaded-runtime
资格证据。

## 3. 当前真实数据流

```text
STS2 visible models / UI controls
  -> Bridge shared_state + context + one surface + legal_actions
  -> visibility + inspection_catalog + diagnostics
  -> coherent observation bundle with every advertised Inspection
  -> strict Re decoder
  -> NormalizedCurrentState
       + player facts populated from Inspection
       + bridgeInspectionFacts carrying the same Inspection facts
       + governance/evidence metadata
  -> buildDecisionPrompt(currentState, allowedActions)
  -> JSON.stringify(full payload)
  -> DeepSeek
```

证据：

- `BridgeV2Runtime.Observe()` 将 shared state、Context、Surface、visibility、
  catalog 和 action authority 纳入 state contract（`E4`）。
- `HybridSts2McpAdapter.readObservationBundle()` 对
  `state.inspection_catalog.map(entry => entry.kind)` 全量请求（`E4`）。
- `normalizeBridgeV2CurrentState()` 把同一 deck/piles 写入 `player` 和
  `bridgeInspectionFacts`（`E4`）。
- `buildDecisionPrompt()` 把完整 `NormalizedCurrentState` 放进 payload，随后
  `JSON.stringify`（`E4`）。

## 4. 概念审计

### 4.1 `shared_state`

**判断：保留。** 它是活跃单人 run 中跨 Surface 持续有效的玩家 HUD/run
事实，不创建动作权。把 HP、gold、deck、relics 等都复制进每个 Surface 会
重新制造 v1 的重复权威问题。

问题不在这个概念，而在 Re 后续又把 Inspection 结果合并进 `player`，同时
保留 Inspection sidecar，造成消费层重复（`E4`）。

### 4.2 `context`

**判断：定义清晰，不应改成 visibility 容器或任意工具。** Re 类型明确写明
Context 是“不含当前 UI 协议的稳定游戏语义”，Surface 才拥有当前交互合同。
例如 `shop`、`combat`、`reward_flow` 是背景；`shop_inventory`、
`combat_turn`、`card_reward_selection` 是当前输入协议。

Context 中可以包含只在该语义下持续有效的事实，但不能吸收：

- 当前控件合法性；
- linked hover 的延迟详情；
- evidence/permission tier；
- Prompt compression 结果。

### 4.3 `surface`

**判断：保留一个 Active Surface。** 当前 Surface 既描述玩家正在操作的 UI
合同，也承载 legal action summaries 和 completeness。它与 Context 的边界
基本健康。

消费层问题是 Surface `legalActions` 已包含 action summary、authority、
evidenceCode 和 entity bindings，Prompt 顶层又有为模型转换后的
`allowedActions`。模型需要后者进行选择，不需要完整的两份治理表示（`E4`）。
不能简单删除 Surface actions，因为完整 normalized evidence 和回放仍可需要；
应由未来策略投影选择一份，而不是改 Gateway 权威。

### 4.4 `inspection`

**判断：语义边界正确，消费策略不完整。** 当前三种 Inspection 是固定、
state-bound、read-only、non-authorizing：`run_deck`、`combat_piles`、
`shop_catalog`。这比任意 `inspect_object(id, fields)` 更安全，也更接近真实 UI。

但现在 catalog 的“可按需读取”只是协议能力。Re 实际会一次性读取所有广告
种类，因此：

- `estimatedCost` / `recommendedFor` 没有运行语义；
- `available_not_requested` 无法自然出现；
- 详情越多，每个决策的 Prompt 和 stale-sensitive observation 都越重；
- 模型主动请求详情尚未存在。

这不等于应该立刻改成 lazy Inspection。全量 coherent bundle 减少了遗漏，
而 lazy/multi-round 会增加状态漂移。必须先 shadow 测量收益。

### 4.5 `visibility`、linked details 与 diagnostics

**判断：当前是诚实的增量目录，不是完整事实状态系统。** `partial_catalog`、
`hidden_by_policy`、`missing` 和 `linked_detail_kinds` 能公开“尚未闭合”；它们
没有伪装完整。但局限是：

- `availability=qualified|canary` 表示证据/权限 tier，不表示事实已经读取；
- `missing` 多为整体说明，不能可靠定位每个字段为什么缺；
- `linked_detail_kinds` 当前为空，hover/preview closure 仍是缺口；
- diagnostics 对审计有价值，但不必全部进入策略模型。

建议未来把 `availability` 的文档名称明确为 authority/evidence tier；若引入
事实可用状态，使用不同名字，例如 `observationStatus`，不要复用该字段。

## 5. 八种事实状态能否区分

| 事实状态 | 当前能否表达 | 当前真实边界 |
|---|---|---|
| truly empty | 部分 | coherent Inspection 中的空 collection 可证明“已观察为空”，但状态标签不与 collection 就近出现 |
| not applicable | 部分 | discriminated Context/Surface 常可推断；普通 optional 字段未统一表达原因 |
| not observed | 不充分 | optional absence 可能是未读、不适用、不可用或 decoder 没产出 |
| available but not requested | wire 可表达、当前 Re 基本不产生 | catalog 可广告，但 Re 全量请求所有广告 Inspection |
| unavailable | 分散表达 | catalog 缺席、visibility missing 或 diagnostic 可能表达，缺少事实组级单一状态 |
| hidden by policy | 可以但较粗 | global/catalog `hiddenByPolicy` 存在；没有每个实体字段的 envelope |
| read/decode failed | 主要在失败路径 | bundle/decoder 会 fail closed；通常不会产生一个可供模型继续使用的部分 normalized state |
| stale/expired | 安全上可以 | stale bundle/action 被拒绝；不是一个可继续决策的模型事实状态 |

附件把空 pile 描述成完全无法区分所有状态，结论过强。strict-v2 concrete
observation 里，Inspection evidence 和 observation kinds 可以证明空 pile 是
读取结果；问题是这些证据与数组分散，且 Prompt 没有策略友好的局部解释。

最小候选不是给每个字段套 envelope，而是在少数事实组上试验：

```ts
type FactGroupStatus =
  | "observed"
  | "available_not_requested"
  | "not_applicable"
  | "unavailable"
  | "read_failed";
```

`hidden` 应继续由 Gateway policy 单独表达；`stale` 应终止当前 observation，
不应被包装成可继续决策的数据值。

## 6. 五个权威维度是否分离

| 维度 | 当前所有者 | 审计结论 |
|---|---|---|
| 玩家正常可见/可检查 | Gateway visibility/source policy | 基本独立，但 closure 不完整 |
| 本次已观察 | state + coherent Inspection bundle | 有 evidence，但缺少统一的事实组状态 |
| 当前可请求查看 | state-bound Inspection catalog | 独立存在；Re 当前没有按需利用 |
| 模型实际收到 | Re prompt builder | 直接等于 full normalized state，边界过宽 |
| 动作已授权 | Gateway capabilities + legal actions + Re exact validation | 与信息可见性保持分离，未发现越权 |

因此本轮最需要新增的不是 Gateway 动作机制，而是明确：

```text
FullEvidenceState != ModelStrategyInput != ActionAuthority
```

## 7. 实体模型审计

当前 `CardSnapshot` 同时携带 definition identity、runtime entity identity、
instance state、动态/静态文本、keywords、selection state 和 `canPlay`；
`RelicSnapshot` 同时携带 identity、counter、description、keywords 和 linked
card previews。

这在 wire/DTO 层不一定错误，拆成大量对象会增加协议膨胀。但它隐藏了不同
生命周期和权威来源：

```text
Entity identity
Instance state
Visible presentation (localized and dynamic)
Linked details / previews
Interaction affordance
Executable authority (separate legal action only)
```

后续应先在 builder/source audit 和策略投影中保持这些概念分离，不要立即拆
wire schema。特别是：

- `canPlay` 是 visible/derived affordance，不是授权；只有 advertised action 可执行。
- Power 的真实 hover 文本不能只读静态 Description。v0.109 源码显示
  `PowerModel.HoverTips` 会注入 amount、owner、applier、target、DynamicVars 和
  extra tips，`NPower` 实际显示该集合（`E4`）。
- `NDeckViewScreen` 允许玩家查看完整 deck、排序并打开 card detail；
  `NCardPileScreen` 专用于 combat draw/discard/exhaust，且 draw viewer 会重新
  排序。因此公开 multiset、隐藏真实 draw order 是正确边界（`E4`）。
- relic 的当前 UI effect/hover 可属于 current observation；“这个 relic 的
  使用范例”属于外部知识或 memory，不能伪装成 Gateway 当前事实。

## 8. Prompt 信息审计

本轮只读统计了本机 ignored `Re-SpireAgent/data/runs` 中按名称最新的 5 个 run
目录，共 813 个 Prompt artifact。它们用于诊断当前 Prompt 结构，不是当前
SHA/MVID 的 Organic Qualification，也不进入 Git。

| 指标 | bytes |
|---|---:|
| user Prompt min | 17,264 |
| median | 37,274 |
| p95 | 47,860 |
| max | 54,432 |

最大 Prompt 的 `currentState` 为 47,429 bytes，`allowedActions` 为 6,479
bytes。`currentState` 主要分布为：

| 字段 | bytes |
|---|---:|
| `player` | 20,154 |
| `bridgeInspectionFacts` | 11,763 |
| `surface` | 8,601 |
| `context` | 1,180 |
| `bridgeInspections` | 1,080 |
| contract/diagnostics/catalog/visibility/policy 等治理字段合计 | 约 3,900 |

结论不是“治理字段是唯一 token 问题”。最大占比是实体详情和重复的
Inspection facts；治理字段较小但仍不应默认成为策略输入。Prompt 大小本身
也不证明决策质量下降，必须通过 paired shadow comparison 验证。

## 9. 按严重程度排序的问题

### P0 - Full evidence 与 strategy input 没有边界（`E4`）

影响：未来任何新增 visibility、diagnostics、evidence 或 Inspection 都会自动
进入模型；Prompt 压缩、memory 注入和外部 Agent 消费都没有稳定组合点。

最小故障例：新增一个高体积 read-only catalog 后，即使模型不需要，它仍会
进入每个 Prompt，并可能扩大延迟和 stale window。

### P0 - eager-all Inspection 与双重投影（`E4`）

影响：按需 catalog 名义与消费行为不一致；事实重复；详情覆盖增长会线性
放大 Prompt。它不应在没有 paired evidence 时直接改成 lazy。

### P1 - 事实缺失原因不能局部、统一表达（`E4`）

影响：人、模型和未来 compressor 都可能把 absent/default 当成 empty；
当前 fail-closed 解码能保护动作，但不能保证策略理解。

### P1 - action menu 在模型输入中重复（`E4`）

影响：模型同时看到治理版 Surface legalActions 和策略版 allowedActions；
可能增加噪声，且给未来 projection 带来双权威错觉。执行权本身没有重复。

### P1 - linked detail closure 未实现（`E3/E2`）

影响：relic/card/power/keyword/preview 的玩家可检查语义仍可能缺失。现有
`partial_catalog` 诚实暴露该债务，不能把当前 coverage 说成完整。

### P1 - UI 动态文本源仍需系统化 parity 审计（`E4/E2`）

影响：静态 description 可能漏动态变量。最新 power 修复证明这是现实故障，
不是理论问题；但不能因此建立通用反射 dump。

### P2 - entity DTO 聚合多个概念（`E4/I`）

影响：未来 projection 和 linked detail 生命周期不清。当前立即拆 wire 的成本
大于收益，应先通过 source/projection 分层验证。

### 非问题 - Context/Surface 分离（`E4`）

当前定义没有把 context 当 visibility 容器，亦没有让 suspended Surface 泄漏
动作。缺少证据支持重写。

## 10. 三种候选方向

### A. 保留现有结构，只修字段缺失

优点：最小风险；不产生第二套表示。  
缺点：每个新增详情永久进入 Prompt；重复和缺失原因继续积累。  
失败条件：Prompt/延迟/stale 或策略误解随 coverage 增长而恶化。  
当前判断：可作为短期默认，但不能作为长期方案。

### B. 少量正交元数据 + 独立策略投影

做法：保留完整 normalized evidence，新增 deterministic、versioned、recorded
的 `StrategyPromptProjection`；只为经验证的事实组增加 status，不全局包裹字段。

优点：不动 Gateway safety；可 shadow 比较；memory/knowledge 可在 Re 组合层
保持 provenance；支持未来 full/debug view 与 compact strategy view 并存。  
缺点：两套表示可能漂移；compressor 可能漏事实；必须记录版本、hash 和来源。

当前判断：最值得先证伪的方向，不是已批准架构。

### C. 统一 Observation/Fact 模型

做法：每个事实都携带 visibility、availability、source、freshness、cost、
provenance 等通用 envelope。

优点：理论一致，外部 tool/retrieval agent 容易查询。  
缺点：协议巨大、DTO/decoder/test 复制、语义状态组合爆炸；容易把游戏事实、
治理、memory 和授权混成万能 IR。

当前判断：拒绝当前实施。只有多个事实族重复证明 B 无法表达时才重新评估。

## 11. 未来消费方式压力测试

### 11.1 压缩 Prompt 但保留完整状态

Gateway/Normalized full evidence 必须继续可记录、回放和调试。模型只收版本化
projection，并记录 projection hash、输入 state ID 和被省略事实组。任何关键
组 `unknown/read_failed` 时 projection 必须 fail closed 或回退 full，不得猜测。

### 11.2 结构化 memory 与当前状态合并

Current observation、run history、stable game knowledge、model memory 必须是
不同 provenance 分区。Gateway 不承载 memory；memory 不能创建 action，也
不能覆盖 current fact。Prompt assembly 可以组合，但记录必须能解释来源。

### 11.3 模型主动请求遗物详情

可行的未来边界是：模型从 bounded state-bound catalog 请求“当前已可见 relic
的 UI details”，Gateway 返回 read-only coherent evidence。不能请求任意 C#
对象或内部字段。“使用范例”应来自知识库/memory，不来自 visibility API。

### 11.4 外部 tool-using Agent

外部 Agent 可以读取 compact projection、full evidence 或固定 Inspection，
但只能提交 opaque advertised action。信息工具不应和 mutation tools 混用同一
授权语义。MCP 官方也把 model-controlled Tools 与 application-provided
read-only Resources 分开；这只是设计参照，不替代本项目 state-bound 规则
（`E1`）。

### 11.5 多模型或 planner/executor

不同消费者可以有不同 projection，但必须共享同一 full observation/state ID。
Planner 的建议不是 action authority；executor 仍只能从当前 allowed actions
选择，并通过 Gateway execute-time validation。

## 12. 可证伪的小实验

### V-1 Prompt composition baseline

从不同 Surface 的 ignored run records 只读统计：事实、entity text、Inspection、
重复、governance、action menu。按 Surface 报告分布。若重复和治理占比很低且
与 latency/stale 无关系，投影优先级应下降。

### V-2 Full vs compact paired shadow

同一 recorded observation 生成 full 和 deterministic compact Prompt；两者都
不执行。比较 bytes/tokens、latency、JSON validity、action agreement、理由中
遗漏的关键事实和人类语义评审。若 compact 经常漏关键事实，拒绝或缩小投影。

### V-3 Fact-group status

只在 `run_deck`、`combat_piles`、`shop_catalog` 的 shadow projection 上增加
事实组状态。设计包含真空、不适用、catalog 可用未请求、读取失败 fixture。
若模型理解无改善，拒绝扩大 metadata。

### V-4 Inspection policy

选择一个低漂移 deck decision，比较 eager-all 和 deterministic required-only
bundle；不执行后者选择。测请求数量、bundle stale、Prompt 体积和决策变化。
在 combat 前不得推广。

### V-5 UI text parity

对 Card、Relic、Potion、Power 各选静态、动态、linked-preview 样本，逐层对比
真实 UI hover、Gateway、Re normalized、Prompt。任何未知 hover 类型都保持
Fail Closed，不以静态 description 代替。

### V-6 单次只读 detail request

只有 V-2/V-3 通过后，shadow 测试一次、一个 catalog kind、同一 state coherent
bundle 的 request。记录请求率、改变选择率、额外延迟和 drift；不接 action
loop，不自动重试 stale。

## 13. 仍需源码或运行时验证

1. 当前 exact loaded artifact 下，HUD relic/potion/power 的完整 hover source
   与本地化变量是否逐类一致。
2. controller、mouse、touch、accessibility 模式是否改变正常可检查信息。
3. 打开 deck/pile/shop Inspection 是否实际影响 input owner、动画或 state ID；
   当前直接读 model 与真实 UI 行为的等价范围需逐类证明。
4. 哪些 card/relic/power linked previews 是当前 UI 真正可访问，而非仅 model
   内部存在。
5. Mod 覆写 description、hover tips、UI 或 legality 时是否能在现有 exact
   Modset/source binding 下可靠降级。
6. `shop_catalog` closed-but-inspectable 与真实玩家 UI 可达性是否在全部 shop
   生命周期成立。
7. `partial_catalog` 的缺失项能否转成可测量 coverage inventory，而不是固定
   文本。
8. Prompt bytes 与 provider latency、stale-state pre-dispatch refusal 是否有
   因果关系；当前只有相关性假设。

## 14. 非约束性工程方向

### V0 - 保持行为，补测量

- 建立可重复 Prompt component report；
- 明确 `FullEvidenceState != StrategyInput != ActionAuthority`；
- 为现有 empty/absent 样本做人工标注；
- 不改 wire、Inspection、live prompt 或权限。

### V1 - shadow-only strategy projection

- projection deterministic、versioned、hashed、recorded；
- 首版只去掉 governance-only fields 和 action duplication；
- 不压缩 card/relic/power 战略文本，除非消融证据支持；
- full state 仍是 replay/debug 事实；
- compact 输出永不执行。

### V2 - bounded fact-group availability

- 仅覆盖由真实歧义证明的 groups；
- status 属于 Re projection 或明确的新 wire contract，不能同时有两个权威；
- old records backward compatible；
- stale 仍终止 observation，不成为普通值。

### V3 - linked details 与 request experiment

- Gateway 只广告真实 UI 可查、exact entity-bound 的固定 detail family；
- request read-only、state-bound、non-authorizing；
- 一次一类、有限 budget、no retry after drift；
- memory/usage examples 继续在 Gateway 外。

任何阶段都不授权 action、不扩大 Surface、不把 canary 写成 qualification。

## 15. 最小下一步调查

下一项不是改 Bridge protocol，而是提交一个独立、read-only 的 Prompt
Information Audit 工具/报告切片：

1. 固定一组 ignored prompt artifacts 和 Surface 分层；
2. 输出 component bytes、重复组和 fact-group status；
3. 生成但不调用 provider 的 compact projection fixture；
4. 用已有 DeepSeek adapter 做 same-state paired shadow，结果不执行；
5. 只有数据支持时，再设计 V1 schema 和记录合同。

Gate 1 connector journey 可以继续，但 visibility 实验不得改变当前 runtime
路径或借 Gate 1 权限推进。

## 16. 采用与拒绝

### 暂时采用

- 保留 shared state / context / one active surface / fixed Inspection；
- 将完整证据和模型输入分离作为下一调查假设；
- 在事实组级别而非字段级别研究 availability；
- 将 UI hover truth、linked details 和 external knowledge 分离。

### 当前拒绝

- universal Visibility Framework；
- 任意对象/字段 Inspection；
- universal executable Surface stack；
- 把 memory、攻略范例或 static catalog 写进 current game state；
- 因 tool calling strict JSON 就弱化本地 action validation；
- 直接 live 切 compact Prompt；
- 因 bundle stale 增加而弱化 state-bound validation。

## 17. 检查过但本轮不修改的关键文件

- `STS2MCP/docs/bridge-v2/PROTOCOL.md`：wire 行为未改变，现有安全边界仍正确。
- `STS2MCP/docs/bridge-v2/PLAYER_VISIBLE_COVERAGE.md`：coverage/permission 状态
  未改变；不把架构建议复制进资格矩阵。
- `STS2MCP/docs/bridge-v2/CURRENT_STATUS.md`：Gateway gate 与 loaded evidence
  未改变。
- `Re-SpireAgent/AGENT.md`：工程边界无变化。
- `Re-SpireAgent/agent_handoff.md`：历史、非 canonical；不应用它承载新结论。
- `Re-SpireAgent/src/**`、`STS2MCP/**/*.cs`：本轮是审计，不实现候选框架。

## 18. 外部与游戏资料

### 当前仓库/游戏

- `Re-SpireAgent/src/prompting/promptBuilder.ts`
- `Re-SpireAgent/src/integrations/sts2mcp/hybridAdapter.ts`
- `Re-SpireAgent/src/normalization/normalizeBridgeV2CurrentState.ts`
- `Re-SpireAgent/src/domain/state/common.ts`
- `Re-SpireAgent/src/domain/state/entities.ts`
- `Re-SpireAgent/src/domain/state/surfaces.ts`
- `STS2MCP/BridgeV2/Game/BridgeVisibilityCatalog.cs`
- `STS2MCP/BridgeV2/Game/BridgeInspectionBuilder.cs`
- `STS2MCP/BridgeV2/Protocol/BridgeContracts.cs`
- v0.109 decompile：`PowerModel.HoverTips`、`NPower`、`NDeckViewScreen`、
  `NCardPileScreen`

### 公开资料

- [MCP server concepts](https://modelcontextprotocol.io/docs/learn/server-concepts)：
  Tools 与 read-only Resources 的控制边界参考。
- [DeepSeek Tool Calls](https://api-docs.deepseek.com/guides/tool_calls/)：strict
  JSON schema 只保证格式，不替代本地语义授权。
- [ReAct](https://arxiv.org/abs/2210.03629)：reasoning/action/observation 交替的
  研究背景，不证明本项目应采用多轮工具循环。
- [Gennadiyev/STS2MCP](https://github.com/Gennadiyev/STS2MCP)：公开的本地 REST
  加可选 MCP 方案，证明较薄 transport 可工作，但没有证明其 visibility
  completeness 或本项目安全合同可以删除。
- [CharTyr/STS2-Agent](https://github.com/CharTyr/STS2-Agent)：公开 HTTP/MCP、
  live metadata 与 SSE 方案，提供 compact/streaming 消费比较，不作为本项目
  权限证据。
- [wuhao21/sts2-cli](https://github.com/wuhao21/sts2-cli)：真实引擎 headless
  decision-point JSON 参考；host 与 live UI visibility 不同。
- [ptrlrd/spire-codex](https://github.com/ptrlrd/spire-codex)：反编译/static data
  参考；static knowledge 不能冒充当前 UI observation。

## 19. 最终判断

当前架构无需“大可见性框架重构”。Gateway 已有正确的语义分层和硬权限
边界，但玩家可见 closure 仍不完整；Re 则把完整证据过早等同于策略 Prompt。
最高价值改进是先证明一个更小、可版本化、可回放、shadow-only 的策略投影
是否能减少重复和治理噪声而不损失决策事实。实验失败就保留 full Prompt；
实验成功后也只能逐步迁移，不能反向削弱完整证据、Inspection coherence 或
action authority。
