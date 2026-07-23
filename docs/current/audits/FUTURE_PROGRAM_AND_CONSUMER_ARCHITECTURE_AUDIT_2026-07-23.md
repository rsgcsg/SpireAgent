# SpireAgent 未来项目与消费架构审计

> **性质：** 当前主线的跨组件架构审计，不是运行权限、实现完成或未来功能承诺。  
> **审计基线：** `develop@6182e22f8cb422c2cb468410d3956159a909aa70`，2026-07-23。  
> **输入材料：** `SPIREAGENT_VISIBILITY_FUTURE_CONSUMER_REQUIREMENTS.md` 与
> `SPIREAGENT_MASTER_PROGRAM_PLAN_2026-07-23.md`。两者只作为问题和候选方案，
> 不作为仓库权威。  
> **当前事实入口：** [`../STATUS.md`](../STATUS.md)。运行状态变化以后以该文件和
> 组件证据为准，不以本审计的时间点快照为准。

## 1. 结论先行

两份参考文档抓住了一个重要问题：当前 Connector 和 observation 设计不能只服务于
“今天把一个完整 JSON 发给 DeepSeek”，否则未来更换 Prompt 投影、记忆、评估器或
外部 Agent 时会被迫改写游戏事实合同。

但原计划仍有两处过度确定：

1. 把六个工作流和一个治理层写得接近六套即将启动的平台工程，会提前制造组织和文档
   负担。当前实际需要的是三条工程线加一个研究孵化区：
   - `C`：Connector 与 observation；
   - `R`：Re runtime 与 evaluation；
   - `P`：安全产品边界；
   - `X`：Headless 与 post-training 孵化。
2. 把 `Full Normalized Evidence` 隐含成长期消费者中立的稳定公共 API。长期稳定边界应是
   Gateway Connector Contract 及其 provenance；当前 `NormalizedCurrentState` 是 Re
   拥有、可版本化演进的完整证据表示，不应现在冻结成 SDK。

因此本审计接受以下方向：

- 完整证据与消费者投影分离；
- observation、history、memory、external knowledge 和 action authority 分离；
- 当前 Gate 1 仍是唯一交付主线；
- 产品安全设计可以有限并行；
- Headless 和 post-training 必须有独立 admission gate。

本审计拒绝以下提前承诺：

- 现在建立万能 Visibility/Fact Framework；
- 现在把 Development Platform 独立成产品；
- 现在冻结 Agent Runtime Contract 或第三方 SDK；
- 现在上线 compact Prompt、主动详情请求、持久记忆或学习；
- 把 Headless 或模型后训练写成产品必经阶段。

## 2. 证据边界

### 2.1 证据等级

| 等级 | 含义 |
|---|---|
| A | 当前提交的代码、类型、canonical 文档或机械检查 |
| B | 当前精确环境的已归属运行证据，或组件 closeout 明确记录 |
| C | 一手外部规范、官方文档或原论文，只能支持一般工程模式 |
| D | 架构推断或待证伪假设 |

### 2.2 当前仓库事实

- `Re-SpireAgent/` 与 `STS2MCP/` 是当前主线；原 root runtime 和 P8-P15 已归档。
  **证据：A。**
- Connector Contract 当前为 `2.0-preview.56`，Gate 0 已关闭，Gate 1 活跃。
  **证据：A/B，详见 current status 与组件证据。**
- Gateway 拥有玩家可见事实、动作发布、执行校验和 completion；Re 只选择广告动作。
  **证据：A。**
- Re 当前保留完整 normalized evidence，并把完整状态发送给模型；现有 generic
  projection v1 已因跨 Surface 分歧被拒绝进入 runtime。**证据：A；样本边界见可见性
  审计，不能推广为所有 projection 都失败。**
- Companion、Agent SDK、Headless、持久学习和 post-training 均未实现。**证据：A。**

本轮没有启动游戏、加载 DLL、执行 canary 或取得新的 Organic evidence。因此本文不改变
任何 capability、permission 或 qualification。

## 3. 对“未来消费能力要求”的批判

### 3.1 应保留的核心

以下分离是正确的，并且应成为后续变更的压力测试：

```text
Game Truth
  -> Player-Visible Truth
      -> Gateway Current Observation / Inspectable Detail
          -> Re Full Normalized Evidence
              -> Consumer Projection

Run History / Agent Memory / External Knowledge
  -> 只能在消费者层组合，不能冒充 Current Observation

Action Authority
  -> 始终独立，由 Gateway 发布和执行
```

这不是要求每层各建一套万能 DTO。它要求同一字段即使复用数据结构，也必须保持
provenance 和所有权可辨认。

### 3.2 必须修正的假设

#### “完整证据”不等于永久公开 schema

Re 必须能保留完整、可回放的证据，但当前 `NormalizedCurrentState` 仍包含消费者和
治理选择。将其永久冻结会让 Re 的内部重构变成协议破坏。长期公共边界应优先稳定：

- Gateway observation 与 Inspection 合同；
- entity/state identity；
- availability/provenance；
- advertised actions；
- command/outcome。

Re 可以从这些合同生成多个版本化 evidence view。

#### “主动请求详情”不是默认优于 eager Inspection

有界、只读、state-bound 的 detail request 在未来可能减少 Prompt 成本，但它也引入：

- observation 与请求之间的 stale window；
- 模型漏查关键事实；
- 更多 latency 和 budget 分支；
- tool-call 失败与重试语义；
- 记录和 replay 复杂度。

当前 eager coherent read 至少有一致性优势。只有测量到真实成本、缺失或 coherence
问题后，才应引入主动详情请求。

#### 状态值不能仅靠一个通用枚举解决

未来确实需要区分：

- 真正为空；
- 不适用；
- 未观察；
- 可检查但未请求；
- 当前不可用；
- 按玩家规则隐藏；
- 读取或解码失败；
- 已过期。

但这些状态的安全影响不同。比如 `hidden` 不应被当成错误，`read_failed` 可能使整个
动作合同 fail closed，`empty` 则是普通事实。应先在真实歧义字段上引入小型、
fact-group-specific availability，再判断是否形成共享类型；现在建立全局
`Observation<Fact>` 会放大协议和测试复杂度。

### 3.3 未来消费者压力测试矩阵

| 消费场景 | 当前基础 | 需要 Gateway 改动 | 主要归属 | 当前决定 |
|---|---|---:|---|---|
| 完整状态模型输入 | 已存在 | 否 | Re | 保留为 baseline |
| compact model view | 只有 rejected generic v1 实验 | 通常否 | Re projection | 不进入 runtime；按 scope 重新举证 |
| replay/evaluator | 已有 records/replay 原语 | 通常否 | Re/eval | 按真实缺口增强 |
| 结构化 run memory | 未实现 | 否 | Re runtime | 后置；先冻结 baseline |
| 当前遗物 UI 详情 | 取决于现有 observation/Inspection 覆盖 | 可能 | Gateway | 仅在玩家可见缺口被复现时补 |
| 遗物打法或协同知识 | 未实现 | 否 | knowledge/memory | 永不由 Gateway 冒充事实 |
| LLM 主动详情请求 | 未实现 | 可能只需复用 Inspection catalog | Re + Gateway Inspection | 等真实成本/一致性实验 |
| 第三方 Agent | 未实现 | 不应新增游戏权限 | future process contract | 等官方路径稳定和第二消费者 |
| Headless evaluator | 仅文档 | 独立 host 实现 | X incubator | 不继承 live 证据 |
| 训练数据生成 | 未实现 | 不应改变 live contract | R/T | 等 provenance/outcome/eval 成熟 |

## 4. 对“总体项目计划”的批判

### 4.1 正确判断

- Connector-first 是正确顺序。
- 产品安全不是最终包装；authentication、controller lease 与 restart epoch 的合同设计
  可以在 Gate 1 后段并行。
- 外部 Agent 应位于游戏进程外。
- Headless 只是一种 host 研究，不是 UI 关闭后的同一个游戏。
- 后训练的数据资格设计和实际权重更新必须拆开。
- “从零经验”应收窄为“零项目特定持久经验”，否则不可证伪。

### 4.2 六工作流为何过重

`D Development Platform` 和 `A External Agent Runtime` 目前没有足够边界：

- 现有唯一真实 Agent 消费者就是 Re；
- inspect、canary、replay、records 和 Prompt audit 是工程工具，不等于平台产品；
- 尚无第二 Agent 证明一个独立 Runtime Contract 能减少维护成本；
- 过早拆分会制造 schema、SDK、版本、文档和兼容性工作，却没有新增可靠性。

因此当前合并为 `R: Runtime And Evaluation`。只有满足以下至少一个条件才拆分：

1. 第二个独立 Agent 需要同一非游戏语义合同；
2. Re 与评估工具出现重复 transport/runtime orchestration；
3. Companion 需要稳定地托管多个 Agent 实现；
4. 维护数据证明合并结构正在阻塞可靠演进。

### 4.3 治理不是独立交付工作流

证据、权限、安全和版本治理是每个切片的验收约束。把它命名为 `G` 有助于说明，
但不应形成与 Connector 平行的抽象平台或无止境治理任务。

### 4.4 Headless 与 post-training 是孵化器

Godot 官方文档只说明 `--headless`/dedicated-server 的显示、音频和导出能力，不证明
STS2 UI-owned lifecycle、Mods、Task 时序和业务 semantics 等价。因此 Headless 必须
通过独立 admission 和 differential evidence。

语言反馈、episodic memory 和 skill library 在 Reflexion/Voyager 中展示过可行模式，
但这些研究不能证明 STS2 的长时因果归因、记忆写入或 promotion 安全。它们只能支持
“值得实验”，不能支持“进入主线”。

## 5. 采用的项目结构

详细依赖写入 [`../PROGRAM_PLAN.md`](../PROGRAM_PLAN.md)。这里记录决策理由。

```text
C: Connector + Observation                         [active priority]
   |
   +---- R: Re Runtime + Evaluation                 [supporting only]
   |
   +---- P: Secure Product + Distribution           [design gated]
   |
   +---- X-H: Headless research                     [admission gated]
   +---- X-T: Post-training research                [data/eval gated]
```

### C: Connector 与 observation

先关闭真实 operation-level 缺口、v1 依赖、玩家可见信息缺失和 evidence identity。每次
新增事实或动作仍必须由真实源码/UI/运行证据驱动，不因未来 memory 或 SDK 改写合同。

### R: Re runtime 与 evaluation

近期只做直接支撑 C 的：

- strict decoding/conformance；
- complete evidence 与 run records；
- replay、diagnostics 和 scenario corpus；
- 可证伪的只读 consumer projection 实验；
- 模型/provider/config provenance。

持久 memory、learning、通用 SDK 和多 Agent orchestration 均后置。

### P: 安全产品与分发

先做 threat model 和合同，再在有代表性的 Gate 1 可靠性后实现 secure local alpha。
产品可以在 Gate 2 完全结束前开始安全内核，但不能在可见信息和 operation coverage
未知时发布消费级 Agent。

### X: 研究孵化

Headless 和 post-training 都必须证明它们解决当前可测瓶颈。它们不是“迟早必须完成”
的阶段。

## 6. 具体工程顺序

### Window 0：当前主线

**进入条件：** 当前即满足。  
**工作：**

1. 延续 exact-identity Gate 1 ordinary journey；
2. 关闭第一个真实 unsupported/fail-closed operation；
3. 同步 operation inventory、visible-information gap 和 v1 retirement；
4. R 只补直接需要的 fixture、record、replay 和诊断；
5. P 只做 auth/lease/epoch 的 threat/contract 设计；
6. H/T 不写生产实现。

**退出条件：**

- 多条代表性 ordinary journey 有当前环境证据；
- v2/v1/fail-closed 按 operation 可解释；
- unknown outcome、stale action 和 restart 风险有明确合同；
- 下一批 Gate 2 可见性缺口有结构化清单。

### Window 1：Visibility 与 secure connector foundation

**进入条件：** Window 0 退出条件满足。  
**工作：**

1. Gate 2 按真实歧义补 availability/provenance；
2. 建立跨语言 golden/negative fixtures 与 scenario corpus；
3. 实现 authentication、observer/controller roles、single-controller lease、
   runtime epoch 和 typed recovery；
4. 建立 baseline/shadow 可比较的评估约束；
5. 继续 operation coverage，不因产品层扩大 Gateway 权限。

**退出条件：**

- 普通流程中主要 visible-information 缺口已知且可报告；
- secure local control 与 restart recovery 有当前证据；
- Re 可以从记录重建 exact evidence、model input 和 action/outcome linkage；
- consumer projection 实验不会污染 runtime baseline。

### Window 2：Companion 与可替换 runtime seam

**进入条件：** Window 1 退出条件满足。  
**工作：**

1. 最小 Companion discovery/control/secrets/provider/recovery；
2. 官方 Re 作为唯一 first-party Agent；
3. read-only memory/retrieval 实验使用冻结 baseline；
4. 仅在 eager evidence 的成本或 stale 问题被测量后试验 bounded detail request；
5. 第二真实消费者出现后再冻结 Agent Runtime Contract。

**退出条件：**

- 玩家可以安全安装、连接、暂停、接管、恢复和卸载；
- provider key 不进入游戏或第三方 Agent；
- runtime/memory artifact 可禁用并回到 frozen baseline；
- 没有第二套 legality/completion。

### Window 3：Guarded learning 与研究 admission

**进入条件：**

- comparable evaluation 和 held-out scenarios 已存在；
- memory/policy 变化可版本化、回放、禁用和回滚；
- outcome attribution 的不确定性被显式记录；
- 数据 provenance、许可和污染规则明确。

**工作：**

- proposal -> counterexample -> replay/shadow -> explicit canary -> promotion ->
  rollback；
- Headless 独立 feasibility；
- post-training 的 eligible dataset 研究。

**退出条件：** 由各自独立研究计划定义，不阻塞产品主线。

## 7. 可测量成功指标

### Connector

- representative journey completion rate；
- unsupported/fail-closed operation inventory 趋势；
- stale rejection、unknown outcome 与 duplicate execution 的可解释率；
- v1-owned operation 数量；
- exact identity 与 evidence attribution 完整率。

### Visibility

- 决策相关 fact group 的 `observed/empty/not-applicable/unavailable/error/stale`
  歧义数量；
- inspection advertisement 与真实可读性一致率；
- hidden-information violation 数量；
- full evidence replay 完整率。

### Runtime 与 evaluation

- strict decode/validation failure；
- prompt/evidence provenance 完整率；
- same-condition provider variance；
- projection omission regression；
- replay 与 live record 的合同一致性。

### Product

- unauthorized mutation acceptance 必须为零；
- controller conflict 与 restart recovery 测试通过率；
- secret exposure 与 support-bundle redaction failure 必须为零；
- install/update/rollback 成功率。

### 学习或 post-training

- 相对 frozen baseline 的 held-out 改善；
- rollback 后恢复基线；
- counterexample/regression rate；
- hidden-state leakage 与 legality regression 必须为零；
- 不把理由文本质量当作战略真值。

## 8. 被拒绝或后置的方案

| 方案 | 决定 | 原因 |
|---|---|---|
| 六工作流全部立即激活 | 拒绝 | 当前只有 C 有主线证据，其他会制造虚假并行 |
| 永久冻结当前 NormalizedCurrentState 为公共 SDK | 拒绝 | Re 内部 evidence schema 仍需演进 |
| 通用 Observation/Fact Framework | 后置 | 真实字段歧义样本不足，协议膨胀风险高 |
| generic compact Prompt v1 | 当前拒绝 | 已有跨 Surface 语义分歧 |
| 所有 projection/多视图 | 不拒绝 | generic v1 失败不能否定按 scope 的未来视图 |
| LLM 任意详情查询 | 拒绝 | 可见性、安全和 stale 风险不可控 |
| bounded typed detail request | 后置实验 | 需先证明 eager evidence 的真实成本或一致性问题 |
| 现在建立通用 Agent SDK | 后置 | 没有第二消费者，官方 runtime 尚未稳定 |
| Headless 作为必经阶段 | 拒绝 | host 等价未证，产品不依赖它 |
| 现在开始模型后训练 | 拒绝 | trajectory/outcome/eval 尚不具资格 |

## 9. 外部资料如何影响结论

这些资料只支持一般模式，不是本项目运行证据：

- [MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture)
  明确 MCP 是 context exchange 的 client/server 协议，包含 tools、resources、
  prompts 与 transport/lifecycle；它不规定 Agent 如何使用上下文。因此 MCP 适合作为
  可选适配层，不应取代 Gateway Connector Contract 或 Re runtime。
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 及其
  [tracing](https://openai.github.io/openai-agents-python/tracing/) 展示了 tools、
  sessions、guardrails 与 traces 可以由少量 runtime 原语组合，也提醒 traces 可能包含
  敏感输入输出。它支持“外部 runtime + 可观测性”，不支持照搬其内部 API。
- [Godot dedicated server documentation](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_dedicated_servers.html)
  说明 headless/dedicated export 的显示、音频和资源裁剪机制，但没有证明 STS2 业务
  lifecycle 与 live UI 等价。
- [Reflexion](https://arxiv.org/abs/2303.11366) 与
  [Voyager](https://arxiv.org/abs/2305.16291) 展示了语言反馈、episodic memory、
  curriculum 和 skill library 的研究可能性，但任务、反馈和环境与 STS2 不同，不能
  作为 guarded learning 的资格证据。

## 10. 可证伪实验与未决问题

1. **完整 evidence 是否必须长期保持当前 shape？**  
   实验：从 recorded Gateway contract 生成两个 Re evidence 版本，验证 replay/action
   identity 是否保持。若可以，说明稳定边界应在 Connector 而不是当前 normalized DTO。
2. **eager Inspection 是否造成不可接受成本？**  
   实验：按 Surface 测量 Inspection bytes、latency、stale/read failure 和策略使用率。
   没有显著成本前不引入 lazy request。
3. **availability 是否需要共享类型？**  
   实验：收集至少三类真实 empty/unobserved/unavailable ambiguity，比较局部字段与共享
   类型的测试和协议成本。
4. **Development Platform 是否需要独立 lane？**  
   证伪条件：出现第二真实消费者，或 Re/diagnostics 重复实现同一 orchestration。
5. **Headless 是否值得进入 H1？**  
   证伪条件：live evaluation throughput 没有成为瓶颈，或 semantic parity 成本高于收益。
6. **外部 memory 是否提升策略？**  
   只有 frozen baseline、held-out scenarios、disable/rollback 和 contamination controls
   齐备后才可实验。

## 11. 本轮文档决策

- 新增短的 canonical [`../PROGRAM_PLAN.md`](../PROGRAM_PLAN.md)，只维护宏观依赖；
- 保留 [`../ROADMAP.md`](../ROADMAP.md) 作为 Connector/Product functional gates；
- 保留 [`../STATUS.md`](../STATUS.md) 作为当前 gate/blocker 唯一快照；
- 不新增空壳 Development Platform、External Agent、Post-training 文档；
- 修正 README、Architecture、Product 和 dated product audit 顶部的状态漂移；
- 不修改协议、代码、Prompt、权限、live behavior 或 evidence。

## 12. 下一项最高价值工作

仍然不是 memory、compact Prompt、Headless 或训练。

下一项应继续当前 exact-identity Gate 1 journey，关闭第一个真实 operation-level
unsupported/fail-closed gap，并把该证据同时更新到 operation inventory、visible-
information gap 和 v1 retirement 状态。并行只允许一个无权限小切片：为未来
authentication/controller lease/runtime epoch 写 threat model 与合同边界，不实现
Companion 或扩大权限。

