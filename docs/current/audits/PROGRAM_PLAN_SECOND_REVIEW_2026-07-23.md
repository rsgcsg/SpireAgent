# SpireAgent Program Plan 二次批判审计

> **性质：** 对 `PROGRAM_PLAN.md` 与上一份未来项目审计的独立复审。  
> **基线：** `develop@4cc2620b6cedd7fd7dbf74a95138ed59851ecfa4`，
> 2026-07-23。  
> **权限影响：** 无。本文不改变 Gateway、Re、Prompt、live permission、
> qualification 或运行配置。  
> **当前事实入口：** [`../STATUS.md`](../STATUS.md)。

## 1. Executive Verdict

本次复审接受用户提出的两个主要保留意见：

1. 上一版把 Developer Platform 压缩进 `R` 过度保守。仓库已有 evidence records、
   replay reader、inspect、canary、Prompt audit/comparison、fixtures 和多层测试。
   它们有独立于 Agent 策略的正确性、provenance、repeatability 和 regression
   目标，足以成立一个正式的**内部 D 工作流**。
2. Re-SpireAgent 已经是实际存在的外部 Agent runtime，不应等到出现第二消费者才获得
   独立所有权。应建立 **A 工作流**；真正需要等待第二消费者的是公共 Agent Runtime
   Contract 和 SDK，而不是 A 本身。

但复审拒绝两个可能的过度修正：

- D 现在不是公共 Developer Platform 产品。它没有统一 scenario corpus、grader、
  eval runner、自动 CI、资格引擎或 SDK。
- A 现在只是 frozen RE-P1 baseline。它没有 memory、learning、planner/critic、
  guarded policy promotion 或通用工具 runtime。

修订后的结构是：

```text
C  Connector and Observation                  active primary
D  Internal Development and Evaluation        active supporting
A  Official External Agent Runtime            active frozen baseline
P  Secure Product and Distribution            design gated
X  Headless / Post-training Incubators         admission gated

G  Evidence, authority, version and safety invariants across all lanes
```

这不是回到“六个平台同时开工”。只有 C 是当前交付优先级；D 和 A 有明确的当前
职责，P 只允许设计，X 不进入生产实现。

## 2. 审计方法与证据等级

| 等级 | 含义 |
|---|---|
| A | 当前提交中的实现、脚本、类型、测试和 canonical 文档 |
| B | 有精确环境归属的当前运行/closeout evidence |
| C | 一手外部规范、官方文档或项目原始仓库 |
| D | 待证伪的架构推断 |

检查范围包括：

- `Re-SpireAgent/package.json` 与 CLI；
- runtime、recording、Prompt audit/comparison、tests 和架构文档；
- Gateway Bridge v2 implementation/tests/docs；
- 根 checks、operations、status、roadmap 与上一份 program audit；
- 仓库 workflow 目录；
- MCP Inspector、OpenTelemetry、OpenAI Agents SDK tracing 与 OpenAI Evals
  的一手资料。

本轮没有启动游戏、加载 DLL 或取得新 Organic evidence。

## 3. 对用户总体评价的逐项裁决

### 3.1 “长期愿景没有偏离 Gate 1”

**接受。证据 A。**

上一版明确把 Gate 1 保留为唯一当前交付优先级。此次拆分 D/A 也不能改变这个事实。
D 只能解决 evidence 和 repeatability；A 只能修复被当前 journey 暴露的 runtime
缺陷。二者不能用未来价值抢占 C 的真实 coverage 工作。

### 3.2 “Developer Platform 定义过于保守”

**接受，但改名为 Internal Development And Evaluation Infrastructure。证据 A/C。**

仓库已经有：

- `agent:inspect` 与 production-path connector canary；
- append-only run/evidence records；
- replay record reader；
- Prompt audit、shadow compare 与 repeat baseline；
- Bridge/Re fixtures 和 unit tests；
- docs/inventory mechanical checks。

这些不是零散脚本：它们横跨 Connector 和 Agent，且需要独立回答“数据是否可比、
experiment 是否可复现、evidence 是否有资格、grader 是否可信”。如果继续把它们视为
R 的附属功能，最可能出现的最小故障是：

```text
Agent 改动同时修改记录、样本选择和评判逻辑
-> baseline 与 candidate 不再可比较
-> 文档仍声称实验支持某个策略结论
```

MCP 官方将 Inspector 定义为独立的 server testing/debugging 工具；OpenTelemetry 将
traces、metrics 和 logs 视为独立 signals；OpenAI Agents SDK 也把 generation、
tool、guardrail 与 custom events 组织为 trace。它们共同支持“开发/evidence
基础设施有独立所有权”，但不要求复制这些框架。

### 3.3 “不应现在做公共平台产品”

**接受。证据 A。**

当前 D 缺少：

- versioned scenario corpus；
- replay assertion runner；
- grader registry；
- held-out split；
- CI workflow；
- qualification engine；
- redacted export/retention；
- 第二 Agent consumer。

所以将 D 称为公共平台会把 inventory 误写成 capability。正式 lane 与产品平台不是
同一件事。

### 3.4 “外部 SpireAgent 没有独立 lane”

**接受。证据 A。**

Re 已拥有与 D 清楚不同的职责：

- normalize and consume full evidence；
- assemble current model input；
- invoke provider；
- choose one advertised action ID；
- run bounded decision loop；
- preserve unknown/no-retry。

OpenAI Evals 的 solver/eval 分离提供了一个有用但不具约束力的外部例子：任务与评分
逻辑应和求解策略分开。对本项目而言，A 是 solver/runtime，D 是 scenario/evidence/
evaluation。即使永远只有一个官方 Agent，这种边界也成立。

第二消费者仍是**冻结公共 Runtime Contract/SDK**的条件，因为在此之前很难知道哪些
Re 内部形状真的值得承诺兼容。

### 3.5 “计划偏文档驱动”

**接受。证据 A。**

`4cc2620` 只修改文档。仓库没有 `.github/workflows/`，因此该提交没有仓库内定义的
GitHub Actions 结果。上一轮运行 `check:docs` 能证明链接和 inventory 在本地通过，
不能证明：

- Re tests/build 在该提交自动通过；
- Gateway C# tests 或 Release build 通过；
- installed/loaded DLL identity；
- canary 或 Organic journey；
- D/A 的任何新增能力。

本次修订增加一条硬规则：

```text
documented lane/status
!= implemented capability
!= tested capability
!= loaded evidence
!= Organic qualification
```

D0 本轮只完成“诚实名名和 inventory”。第一个真正的 D 工程切片应是可执行的
offline CI；在它合入并实际运行前，不能声称 D1 完成。

## 4. 当前仓库的真实 D/A 边界

### 4.1 D 的现状

| 能力 | 当前事实 | 不得声称 |
|---|---|---|
| inspect | strict read-only current-state output | complete visibility closure |
| connector canary | operator-selected production-path action | automatic qualification |
| records | append-only local decision evidence | immutable external evidence store |
| replay | record reader/printer | deterministic replay execution |
| Prompt audit | bytes/duplication measurement | strategy eval |
| provider compare | bounded non-executing comparison | causal attribution or grader |
| fixtures/tests | local contracts and regressions | Organic behavior |
| repository checks | local npm scripts | GitHub CI |

### 4.2 A 的现状

| 能力 | 当前事实 | 不得声称 |
|---|---|---|
| external runtime | real Re process over strict v2 | consumer Companion |
| model path | one DeepSeek decision provider | provider platform |
| state input | complete normalized evidence Prompt | stable public Agent schema |
| actions | advertised action-ID selection | game-rule ownership |
| records | full local decision linkage | learning memory |
| run loop | bounded one-game orchestration | autonomous multi-run curriculum |

## 5. 修订后的工作顺序

### Current: C1 + D0 + A0

1. **C1 primary:** 继续 exact-identity Gate 1 journey，关闭真实 unsupported/
   fail-closed operation 与 v1 dependency。
2. **D0 complete as docs:** 能力 inventory、术语和非声明边界已明确。
3. **D1 next implementation:** 增加不依赖游戏二进制的 offline CI，并明确
   Gateway proprietary-assembly local checks 没有运行时的状态。
4. **A0:** 保持 frozen RE-P1；只修复真实 journey 暴露的 runtime defect。
5. **P0:** auth/lease/epoch threat and contract design only。
6. **X:** disabled。

### After representative C1 evidence: C2 + D2 + A0

- C 进入系统化 visible-information closure；
- D 建立 scenario/evidence contract 与 replay assertions；
- A 建立 held-out frozen baseline，但不加入持久 memory；
- P 才实现 secure local connector alpha。

### After secure connector and D3 eval baseline: A1/P1

- A 才可试验 read-only retrieval、consumer view 或 memory proposal；
- D 必须拥有 baseline/candidate/counterexample/held-out comparison；
- P 构建最小 Companion；
- public SDK 仍等待第二 Agent consumer。

### Research admission

- Headless 必须证明 live evaluation throughput 是真实瓶颈并通过 host parity gate；
- post-training 必须有 eligible/decontaminated trajectory 与 held-out evaluation；
- 二者都不阻塞 live Agent 产品。

## 6. 为什么不立即写 D/A 大架构

此次只新增 D 的职责和阶段，不新增 universal scenario DSL、trace framework、
grader framework 或 Agent Runtime Protocol。原因：

- 当前样本还不足以选择公共数据模型；
- Gateway C# tests 依赖 proprietary game assemblies，CI 边界需先验证；
- current records 已经有可复用 provenance，不应先复制；
- A 只有一个真实实现，公共合同容易冻结内部偶然结构。

下一步代码应小而可证伪：先证明哪些 offline checks 能在干净 GitHub runner
重复执行，再根据失败和缺口设计 D2。

## 7. 外部资料的有限影响

- [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) 将测试和调试
  工具明确放在 protocol server 之外，支持 D 与 C 分离。
- [OpenTelemetry signals](https://opentelemetry.io/docs/concepts/signals/) 与
  [traces](https://opentelemetry.io/docs/concepts/signals/traces/) 强调结构化、
  可关联的独立 telemetry；本项目可借鉴 provenance/trace identity，而非引入完整
  OTel deployment。
- [OpenAI Agents SDK tracing](https://openai.github.io/openai-agents-python/tracing/)
  展示 Agent、model、tool 和 guardrail event 可以统一关联，同时提醒 traces 可能含
  敏感输入输出。D 的未来 export 必须默认 redacted。
- [OpenAI Evals](https://github.com/openai/evals) 及其
  [solver/eval separation](https://github.com/openai/evals/blob/main/evals/solvers/README.md)
  支持 scenario/evaluation 与 Agent solver 解耦；它不证明现成框架适合 STS2。

## 8. 文档与工程裁决

本轮：

- 将 canonical plan 从 `C/R/P/X` 修订为 `C/D/A/P/X`；
- 新增 D current capability/missing/sequence 文档；
- 保留上一份 audit 的 consumer/evidence 分层结论；
- 明确 supersede 上一份 audit 的 lane 决定；
- 修复 Re 当前 normalized schema 文档漂移；
- 不实现 CI、scenario runner、grader、SDK、memory 或 learning；
- 不改变 current status、runtime permission 或 qualification。

## 9. 下一项可执行任务

最高价值主线仍是 C Gate 1 journey。

可并行的最小 D 切片是 **D1 Offline Check Baseline**：

1. 为 Re check、active-doc links、Connector inventory 和 Python syntax 增加
   GitHub Actions；
2. 明确 C# tests/build 因 proprietary STS2 assemblies 是 required-but-local，
   而不是绿色或跳过后被视为成功；
3. workflow 输出机器可读的 executed/skipped summary；
4. 不启动游戏、不修改 Gateway runtime、不增加权限。

该 PR 实际合入并在 GitHub 运行前，D1 状态必须保持未完成。

