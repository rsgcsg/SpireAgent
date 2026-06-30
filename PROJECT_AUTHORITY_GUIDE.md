# STS2 AI Agent 权威指导文档

> `PROJECT_NORTH_STAR.md` 是长期最高原则文档。  
> 本文件是工程权威索引：定义文档权威层级、系统边界、阶段路线、下一步 Codex 工作方式和验收标准。它不替代子系统文档。

---

## 0. 这份文档的目的

当前项目已经完成 Phase 0：已经有完整项目书、架构文档、外部依赖评估、Game I/O capability 文档、data schema 文档、memory / derived / replay / reward / human capture 等子系统文档，并且当前 TypeScript agent 已能通过 smoke、review、dry-run、collector 等基本验证。

当前项目正在进入 Phase 1：文档 source-of-truth 收敛、`domain-core`、`GameIO`、adapter capabilities、transition schema、ground truth invariants 和最小 LLM candidate validation。

后续任何改变系统目标、schema、capability、memory、derived、reward、LLM 输出格式、collector/replay/eval 行为的代码修改，都必须同步更新对应权威文档。文档不能只在聊天记录里更新。

下一阶段的风险不是“文档不够”，而是：

1. 文档太多，权威层级不清。
2. 多份文档重复讲同一件事，后续 agent 不知道该听谁的。
3. 一些文档是历史 debug / portable / runbook，不应继续作为长期架构 source of truth。
4. 架构理念已经写清楚，但还没有充分转化成代码边界、schema、adapter capability、transition recorder 和 replay/eval 闭环。
5. 当前项目有可工作的旧结构，不能大爆炸式重构；必须边界先行、兼容旧命令、小步落地。

因此，本文件的作用是：

- 定义项目最高目标。
- 定义文档权威层级。
- 定义哪些文档应该保留、合并、redirect 或 archive。
- 定义 mod、adapter、本地 agent、data/memory/learning 的边界。
- 定义当前和未来外部依赖的处理规则。
- 定义 Phase 1 到 Phase 5 的长期路线。
- 给出下一轮 Codex 的长期 prompt，让它能自主阅读、审计、检索、构建、整理项目文档索引和项目架构。

---

## 1. 最高目标

项目的最终目标是构建一个能够高水平、较高速度、可复盘、可学习、可维护地真实本地游玩 Slay the Spire 2 的 agent 系统。

这个系统不是纯规则 bot，也不是让本地程序完全替代 LLM。它应该是：

```text
LLM-first + layered local scaffold + structured memory + derived knowledge + lightweight learning + replaceable external adapters
```

核心原则：

1. **LLM 是主要战略玩家**：负责高分歧、高不确定、长期取舍、组合判断、路线规划、抓牌、商店、事件、复杂战斗 plan、局后复盘和受控自我改进。
2. **本地脚手架负责清理战场**：读取完整状态、规范化、生成候选、过滤非法动作、计算确定性指标、压缩上下文、执行动作、checkpoint、记录 transition、构造 replay/eval 数据。
3. **LLM 不看 raw dump**：实时 prompt 只包含 compact state、top candidates、本局记忆摘要、少量相关 long-term memory、少量相关 derived knowledge 和严格 JSON 输出格式。
4. **本地不应变成死规则机器人**：低争议、低自由度、确定性场景可以本地处理；真正有战略分歧的地方必须留给 LLM。
5. **数据闭环比单次聪明更重要**：agent 的每一步决策、执行结果、checkpoint、状态变化、记忆快照、derived 证据和 LLM/fallback 路由都应可记录、可 replay、可 eval。
6. **学习必须保守可回滚**：memory、derived、strategy params、reward、experiment 只能保守更新，必须有 evidence、reason、confidence、rollback。
7. **外部项目不能定义核心架构**：STS2MCP、Spire Codex、LLM provider、vector store 等只能通过 adapter/capability 进入系统。

如果后续某个实现选择和这些原则冲突，应优先维护这些原则。

---

## 2. 当前项目状态摘要

当前项目不是空项目，而是一个已经能跑的 TypeScript agent 包。

已存在的可复用能力包括：

- REST/MCP client 能读取游戏状态并执行动作。
- `state.ts` 已能把当前 MCP JSON 规范化成 compact state。
- `candidates.ts` 已能为 combat、reward、map、shop、event、rest、menu、card select、bundle select 等 screen 生成候选。
- `scoring.ts` 已有本地评分、风险估计、decision route。
- `controller.ts` 已有主循环、LLM gate、fallback、动作执行、checkpoint、记忆更新。
- `checkpoint.ts` 已有 post-action state diff 与 soft/hard/unknown checkpoint 分类。
- `collector.ts` 已有 snapshot-only 只读采集：`collect:state` / `collect:watch`。
- `memory.ts` 已有 run memory、long-term memory、experience、strategy params、轻量 reward 的雏形。
- `review.ts` 已能聚合 route、fallback、LLM、checkpoint。
- `data/spire-codex/`、`derived/`、`memory/` 已经分离。

主要缺口：

- 没有 formal `domain-core`。
- 没有 typed `GameIO` 接口。
- 没有 runtime `AdapterCapabilities` schema。
- 没有稳定 `TransitionRecord` 代码 schema。
- collector 仍是 snapshot-only，不是完整 transition recorder。
- agent action 还没有完整 `executor_logged + isGroundTruth=true` transition 数据闭环。
- human action 当前没有 reliable event log，只能 snapshot / diff inference。
- 没有 replay CLI 和 offline eval runner。
- LLM JSON validation 仍需要强化。
- `controller.ts` 仍承担过多 orchestration。
- `candidates.ts` / `scoring.ts` 仍是多 screen 混合大文件。
- combat 有 checkpoint，但还不是 segmented plan + continuation。
- 文档数量多，source of truth 还需要收敛。

---

## 3. 文档权威层级

后续所有 agent 和人类维护者都应按以下层级阅读和维护文档。

### Tier 0：项目入口

#### `README.md`

用途：

- 快速开始。
- 常用命令。
- 最重要文档索引。
- 当前 runtime model 简要说明。

要求：

- 不承载完整架构。
- 不重复所有子系统细节。
- 不把所有历史文档列为同等重要入口。
- 应链接到本文件、`PROJECT_PLAN.md`、`ARCHITECTURE.md`、`LLM_HANDOFF.md` 等。

#### `LLM_HANDOFF.md`

用途：

- 给下一位 Codex/LLM 的接手状态。
- 当前实现状态。
- 当前已验证命令。
- 当前最值得做的下一步。

要求：

- 不承载完整长期架构。
- 不复制 `PROJECT_PLAN.md` / `ARCHITECTURE.md` 的全部内容。
- 每次 Phase 结束后更新“下一步”。

### Tier 1：长期架构和规范 source of truth

#### `PROJECT_AUTHORITY_GUIDE.md`

即本文件。用途：

- 最高层级项目指导。
- 定义文档权威层级。
- 定义系统边界和长期路线。
- 内置下一步长期 Codex prompt。

#### `PROJECT_PLAN.md`

用途：

- 唯一长期项目书。
- 当前诊断。
- 阶段路线。
- 验收标准。
- 当前 Phase 状态。

#### `ARCHITECTURE.md`

用途：

- 唯一系统架构说明。
- five planes / modules / dependency rules / runtime flow。
- mod vs local agent boundary。

#### `DATA_SCHEMA.md`

用途：

- 唯一数据契约。
- `RunRecord`、`StateSnapshot`、`TransitionRecord`、`GameEvent`、`StateDiff`、`ReplayFrame`、`MemorySnapshot`、`DerivedSnapshot`、`RewardRecord`、`ExperimentRecord`。

#### `GAME_IO_CAPABILITIES.md`

用途：

- 唯一 adapter capability 契约。
- 当前 STS2MCP capability。
- human capture levels。
- future event API。

#### `AGENT_LOOP.md`

用途：

- 唯一实时 agent loop 契约。
- target flow。
- decision route。
- prompt rule。
- LLM call / validation / fallback。

#### `CONTRIBUTING_OR_ENGINEERING_RULES.md`

用途：

- 工程规则。
- patch discipline。
- baseline commands。
- live run policy。
- documentation rule。

### Tier 2：子系统设计文档

这些文档不应重复 Tier 1 的大架构，而应只维护各自子系统：

- `MEMORY_SYSTEM.md`
- `DERIVED_KNOWLEDGE.md`
- `COMBAT_PLAN_AND_CHECKPOINT.md`
- `HUMAN_CAPTURE_LIMITS.md`
- `REPLAY_AND_EVAL.md`
- `REWARD_AND_EXPERIMENTS.md`
- `EXTERNAL_DEPENDENCIES.md`

### Tier 3：操作手册、历史状态、portable、debug

这些文档可以保留，但不能作为长期架构 source of truth：

- `DEBUG_REPORT.md`
- `PORTABLE_USAGE.md`
- `BUNDLE_MANIFEST.md`
- `docs/DEPLOYMENT.md`
- `docs/ITERATION_GUIDE.md`
- `docs/GITHUB_CHECKLIST.md`
- `docs/MCP_USAGE.md`
- `docs/LLM_BRIDGE.md`
- `docs/ai-agent-defect-strategy.md`
- `docs/ai-sts2-local-runbook.md`

特别要求：

- `DEBUG_REPORT.md` 顶部应标明：历史 append-only debug log，不是当前架构 source of truth，里面的“当前状态”可能过期。
- portable / bundle 文档只说明迁移和打包，不应重复长期架构。

### Tier 4：重复、应合并、应 redirect 或 archive 的文档

以下文档应被审计：

- `docs/PROJECT_STEERING.md`
- `docs/PROJECT_BOUNDARIES.md`
- `docs/agent-system-principles.md`
- `docs/ai-agent-architecture.md`

处理方式：

1. 提取里面仍然独有且有价值的内容。
2. 合并到 `PROJECT_PLAN.md`、`ARCHITECTURE.md`、`EXTERNAL_DEPENDENCIES.md`、`CONTRIBUTING_OR_ENGINEERING_RULES.md`。
3. 原文档改成短 redirect，或移入 `docs/archive/`。
4. README 不再把这些重复文档列为同等重要入口。

---

## 4. 最新系统架构：Five Planes

推荐把系统理解成五个平面，而不是只是一堆文件。

```text
Plane 1: Game Integration Plane
Plane 2: Canonical State + Mechanics Plane
Plane 3: Planning + LLM Decision Plane
Plane 4: Data + Memory + Learning Plane
Plane 5: Evaluation + Engineering Governance Plane
```

### Plane 1：Game Integration Plane

目标：让游戏状态、动作执行、事件日志以稳定接口进入 agent。

建议模块：

```text
external-mods/sts2mcp/              # 外部或子模块，不一定放进本仓库
external-mods/sts2-eventlog-mod/    # future event-log mod
packages/game-io/ 或 src/game-io/
packages/adapters/sts2mcp/ 或 src/adapters/sts2mcp/
packages/adapters/eventlog/ 或 src/adapters/eventlog/
```

职责：

- 读 raw state。
- 执行动作。
- 读取 action result。
- 读取 event log。
- 报告 capabilities。
- 处理连接、超时、错误、settlement、重试。

禁止：

- 不做策略。
- 不做 LLM。
- 不做 memory。
- 不做 derived。
- 不做 reward。

当前主 adapter：STS2MCP。

当前能力：

```json
{
  "canReadState": true,
  "canReadRawState": true,
  "canReadScreen": true,
  "canExecuteActions": true,
  "canReadAgentActionResults": "partial",
  "canListLegalActions": false,
  "canReadEventLog": false,
  "canReadHumanEvents": false,
  "canProvideFactData": false,
  "canProvideVersionedFacts": false
}
```

这意味着：

- agent 自己通过 executor 发送的动作可以作为 selected action ground truth。
- human UI action 当前不能 ground truth 记录。
- legal actions 当前主要由本地从 normalized visible state 生成。

### Plane 2：Canonical State + Mechanics Plane

目标：把 raw 外部状态变成内部稳定状态，并提供确定性计算。

建议模块：

```text
packages/domain-core/ 或 src/domain/
packages/state-normalizer/ 或 src/state-normalizer/
packages/mechanics-engine/ 或 src/mechanics/
packages/fact-db/ 或 src/fact-db/
packages/adapters/spire-codex/ 或 src/adapters/spire-codex/
```

职责：

- 定义 versioned schema。
- raw MCP state -> canonical `GameState`。
- screen 识别。
- card/enemy/relic/potion/option identity 标准化。
- legal action sanity check。
- energy / target / affordability。
- damage / block / lethal / incoming risk。
- state diff。
- fact lookup。

禁止：

- 不调用 LLM。
- 不依赖 long-term memory。
- 不写策略经验到 raw facts。

Spire Codex 只能作为 fact source：卡牌名、费用、稀有度、描述、遗物效果、关键词、药水、敌人、事件等客观事实。agent 学出的内容必须进入 `derived/` 或 `memory/`，不能写回 `data/spire-codex/`。

### Plane 3：Planning + LLM Decision Plane

目标：让本地脚手架把复杂局面压缩成少量候选，再由本地或 LLM 做决策。

建议模块：

```text
packages/planning-scaffold/ 或 src/planning/
packages/llm-decision/ 或 src/llm-decision/
packages/execution-loop/ 或 src/execution/
```

职责：

- 生成候选动作。
- 生成 combat segmented plans。
- 抓牌 / 商店 / 路线 / 事件 / 营火候选评分。
- decision gate：
  - `no_op_or_poll`
  - `forced_local`
  - `obvious_local`
  - `local_fast_combat`
  - `local_confident`
  - `local_recommended_llm_arbitrate`
  - `llm_required`
- 构造 compact decision context。
- 调用 LLM。
- schema validate LLM JSON。
- fallback。
- 动作执行。
- checkpoint 后继续、重规划或问 LLM。

核心规则：

- LLM 每个 tick 至多调用一次。
- LLM 只能从合法 candidate/plan 中选择。
- LLM 不直接调用 MCP。
- prompt 不能包含 full raw state、完整卡牌/遗物数据库、完整历史、所有 memory。

### Plane 4：Data + Memory + Learning Plane

目标：建立可复盘、可评估、可学习的数据闭环。

建议模块：

```text
packages/data-recorder/ 或 src/data-recorder/
packages/replay/ 或 src/replay/
packages/eval-runner/ 或 src/eval/
packages/memory-system/ 或 src/memory/
packages/derived-knowledge/ 或 src/derived/
packages/reward-engine/ 或 src/reward/
packages/experiment-manager/ 或 src/experiments/
```

职责：

- snapshots / events / transitions。
- AgentDecisionRecorder。
- HumanPlayRecorder。
- TransitionBuilder。
- replay。
- offline eval。
- run memory。
- long-term memory。
- derived knowledge。
- reward。
- strategy params。
- experiment log。
- rollback。

核心规则：

- data-recorder 只记录事实，不直接决定策略。
- memory 是结构化、可检索、可压缩、可回滚的决策资源，不是纯文本日志。
- derived knowledge 是事实之上的策略知识，不能污染 raw facts。
- reward 是轻量反馈，不是神经强化学习。
- experiment manager 记录每次策略/prompt/derived/weight/rule 更新。

### Plane 5：Evaluation + Engineering Governance Plane

目标：让项目可维护、可验证、可交接。

建议模块：

```text
apps/replay-cli/
apps/review-cli/
apps/eval-runner/
apps/data-tools/
tests/
fixtures/
docs/
```

职责：

- smoke tests。
- schema tests。
- adapter conformance tests。
- fixture replay tests。
- prompt budget tests。
- offline eval。
- documentation source-of-truth 管理。
- CI。
- patch discipline。

---

## 5. Mod 边界

有些能力必须做成游戏侧 mod 或 mod patch；有些绝对不应该进入 mod。

### 应该做成 mod / mod patch 的能力

这些能力必须靠近游戏内部对象、UI hook 或 action hook：

- 读取游戏内部状态。
- 执行动作。
- 暴露 action result。
- 暴露 legal action 或 raw actionable state。
- 捕获 human UI action。
- 捕获 game event log。
- 记录 cardInstanceId、cardIndex、targetId、optionId。
- 记录 preStateHash / postStateHash。
- 暴露：

```http
GET /api/v1/events?since=<eventId>
```

事件类型至少包括：

```text
CARD_PLAYED
TURN_ENDED
REWARD_SELECTED
MAP_NODE_SELECTED
SHOP_PURCHASED
POTION_USED
EVENT_CHOICE_SELECTED
REST_OPTION_SELECTED
CARD_PURGED
CARD_UPGRADED
COMBAT_STARTED
COMBAT_ENDED
SCREEN_CHANGED
```

推荐事件字段：

```json
{
  "eventId": 123,
  "type": "CARD_PLAYED",
  "source": "human",
  "screen": "combat",
  "floor": 3,
  "timestamp": "2026-06-30T18:10:00+10:00",
  "cardName": "Strike",
  "cardInstanceId": "card_42",
  "cardIndex": 2,
  "targetId": "CULTIST_0",
  "energyCost": 1,
  "optionId": null,
  "preStateHash": "hash_before",
  "postStateHash": "hash_after",
  "rawEvent": {}
}
```

### 不能放进 mod 的能力

这些属于本地 agent brain，不应放进游戏 mod：

- LLM 调用。
- prompt。
- API key。
- memory。
- derived knowledge。
- reward。
- experiment manager。
- route/shop/card/combat planning。
- 局后复盘。
- 向量数据库。
- 训练数据导出。
- 大型 eval。

原因：mod 应该小、稳、少依赖；agent brain 应该可快速迭代、可测试、可回滚。

---

## 6. 人工游玩数据采集方案

人工玩采集数据必须采用双层设计。

### 6.1 游戏内层：event-log mod

位置建议：

```text
external-mods/sts2-eventlog-mod/
```

职责：

- 捕获 human UI/action event。
- 捕获 game event。
- 记录 cardInstanceId / targetId / optionId。
- 记录 screen / floor / timestamp。
- 记录 pre/post state hash。
- 暴露 `/api/v1/events?since=<eventId>`。

产出：

```text
events.jsonl raw event stream
```

### 6.2 本地层：HumanPlayRecorder

位置建议：

```text
packages/data-recorder/human/
# 或 src/data-recorder/human/
```

职责：

- 拉取 event-log mod events。
- 读取 pre/post state snapshot。
- 把 event + state 拼成 `TransitionRecord`。
- 计算 `StateDiff`。
- 保存 `data/runs/<runId>/events.jsonl`、`snapshots/`、`transitions.jsonl`。

当 event-log 可用时：

```json
{
  "source": "human",
  "captureMode": "mcp_event",
  "isGroundTruth": true,
  "confidence": 1.0
}
```

当前没有 reliable human event log 时，只能 fallback：

```text
StatePoller -> preState/postState diff -> ActionInferer -> inferred transition
```

必须标记：

```json
{
  "source": "human",
  "captureMode": "diff_inferred",
  "isGroundTruth": false,
  "confidence": 0.58,
  "uncertainty": ["duplicate_cards", "possible_relic_trigger"],
  "candidateActions": [],
  "inferenceReason": "hand/energy/enemy-hp changed, but duplicate Strike and relic trigger make exact action ambiguous"
}
```

diff-inferred human action 可以用于：

- 复盘。
- 状态分析。
- fixture 构造。
- 粗略观察人类打法。

不能用于：

- high-confidence labeled training examples。
- ground truth action imitation。

---

## 7. Data Schema 权威规则

长期 run data 目录：

```text
data/runs/<runId>/
  metadata.json
  snapshots/
  events.jsonl
  transitions.jsonl
  replay.json
  review.json
  rewards.json
  experiment_refs.json
```

每条 transition 至少包含：

```ts
interface TransitionRecord {
  schemaVersion: number;
  runId: string;
  transitionId: string;
  source: "agent" | "human" | "game";
  captureMode: "executor_logged" | "mcp_event" | "diff_inferred" | "snapshot_only";
  isGroundTruth: boolean;
  confidence: number;
  uncertainty: string[];
  candidateActions: unknown[];
  inferenceReason?: string;
  tick: number;
  timestamp: string;
  screen: string;
  floor?: number;
  preStateRef: string;
  postStateRef?: string;
  compactPreState: unknown;
  compactPostState?: unknown;
  legalActions: unknown[];
  selectedAction: unknown | null;
  localScores?: unknown;
  llmDecision?: unknown;
  derivedSnapshot?: unknown;
  memorySnapshot?: unknown;
  executionResult?: unknown;
  stateDiff?: unknown;
  rawRefs: string[];
}
```

Ground truth 规则：

```text
Agent executor action:
  captureMode=executor_logged
  isGroundTruth=true

MCP/mod event action:
  captureMode=mcp_event
  isGroundTruth=true only if event has enough identity/timing fields

Human diff inference:
  captureMode=diff_inferred
  isGroundTruth=false

Snapshot-only record:
  captureMode=snapshot_only
  isGroundTruth=false
```

当前 `memory/collected/` 仍保留兼容。旧 `CollectedStateRecord` 应映射成 snapshot-only transition。

---

## 8. LLM 决策规范

LLM 实时决策必须短、结构化、可验证。

### 8.1 Prompt 应包含

- 当前 screen 和 compact state。
- hp、floor、gold、energy。
- combat 时的敌人 intent/risk。
- 当前 hand 或 options。
- run memory summary。
- 少量相关 long-term memory。
- 少量相关 derived knowledge。
- top candidates / plans。
- local score 和 risk。
- 严格输出 schema。

### 8.2 Prompt 不应包含

- full raw state dump。
- full card/relic database。
- all memory。
- all history。
- unbounded reflection。
- 大段自然语言复盘。

### 8.3 LLM 输出规则

LLM 输出必须是短 JSON。示例：

```json
{
  "candidateId": "combat-plan-2",
  "confidence": 0.76,
  "reasonCode": "safe_lethal_or_low_risk_damage",
  "memoryPatch": {
    "deckNeeds": ["draw", "scaling"]
  }
}
```

必须验证：

- JSON parse 成功。
- schema validate 成功。
- candidateId 存在。
- candidateId 是当前 legal candidates/plans 之一。
- memoryPatch 字段只允许安全结构。

失败时：

- fallback。
- 记录 fallbackReason。
- 不执行未验证 action。

---

## 9. 战斗计划与 checkpoint

当前代码是一 tick 一动作，安全但可能慢。长期目标是 segmented combat plan + checkpoint。

Plan 示例结构：

```ts
interface CombatPlan {
  planId: string;
  label: string;
  initialActions: unknown[];
  estimatedDamage: number;
  estimatedBlock: number;
  estimatedHpLoss: number;
  likelyLethal: boolean;
  usesPotion: boolean;
  risk: string[];
  localScore: number;
  checkpointExpected: boolean;
  continuePolicy: string;
  llmDispute: string[];
}
```

执行中遇到以下情况必须 hard checkpoint：

- screen changed。
- turn changed。
- draw / generated card。
- discover / card-select opened。
- enemy died。
- target set changed。
- energy unexpected。
- hand changed beyond expected removal。
- potion state changed。
- action result differs from prediction。
- MCP error or no settlement。

checkpoint 后流程：

```text
re-read full state
  -> regenerate candidates/plans
  -> local deterministic continue if obvious
  -> ask LLM only if strategic uncertainty remains
```

短期不要急着做大规模 multi-action execution，因为手牌 index shift 很危险。Phase 2/3 应先用 transition/replay 找真实错误，再逐步实现 right-to-left / re-read / safe multi-action。

---

## 10. Memory / Derived / Reward 边界

### 10.1 Fact DB

只存客观事实：

- card names。
- costs。
- rarity。
- descriptions。
- relic effects。
- character data。
- keyword text。
- potions、monsters、events 等客观信息。

### 10.2 Derived Knowledge

存策略层知识：

- card tags。
- relic tags。
- synergies。
- anti-synergies。
- pick conditions。
- avoid conditions。
- enemy/boss risk notes。
- route/shop/event strategic preferences。

更新必须包含：

- id。
- targetType。
- targetId。
- claim。
- conditions。
- evidence。
- confidence。
- source。
- createdAt / updatedAt。
- rollback。

单局观察不能直接覆盖 derived。应该先成为 proposal 或 low-confidence memory。

### 10.3 Memory

Run memory 必须影响决策，而不是只记录。

必须追踪 deficits：

- damage。
- block。
- draw。
- energy。
- scaling。
- aoe。
- deck_thinness。
- status_control。
- healing。
- potions。

Run memory 影响：

- combat priorities。
- card reward pick/skip。
- shop priorities。
- route risk。
- event choices。
- rest choices。

Long-term memory 用于跨局经验，但实时 prompt 只检索少量相关内容，不 dump 全部文件。

### 10.4 Reward / Experiment

Reward 是轻量反馈，不是神经网络强化学习。

失败类别应至少支持：

- low_block。
- low_draw。
- low_energy。
- low_damage。
- low_scaling。
- low_aoe。
- deck_too_thick。
- path_too_greedy。
- potion_misuse。
- shop_misprioritized。
- bad_card_reward。
- missed_lethal。
- unsafe_auto_decision。
- candidate_generation_miss。
- combat_tempo_loss。

策略参数更新规则：

- bounded。
- conservative。
- evidence-based。
- reasoned。
- rollbackable。
- never mutate raw facts。

---

## 11. 外部依赖处理规范

所有外部项目必须这样进入系统：

```text
External Project
  -> Adapter
  -> Capability Detection
  -> Conformance Tests
  -> Internal Stable Interface
  -> Agent Core
```

禁止：

- raw external JSON 泄漏到策略层。
- 假设外部项目永远有某字段。
- 假设 current MCP 能读 human action。
- 把 external fact source 当 strategy source。
- 因为外部工具缺能力而扭曲 core 架构。

当前推荐外部项目定位：

```text
STS2MCP:
  current primary GameIO adapter
  read state + execute actions
  no reliable human event log now

Spire Codex:
  fact-db source/cache
  not strategy source

External LLM provider:
  strategic decision provider
  must output validated short JSON

Future event-log mod:
  human/game event source
  should be small and limited to game I/O/event hooks
```

---

## 12. Phase 路线

### Phase 0：已完成

目标：项目书、架构、外部依赖、人类采集限制、阶段路线。

状态：已完成。不要继续只扩写 Phase 0 文档。

### Phase 1：核心边界和 schema

目标：先把概念落成代码边界，不重写整个 controller。

必须实现：

1. `domain-core` / `src/domain/types.ts`
2. `GameIO` interface / `src/game-io/types.ts`
3. `AdapterCapabilities` runtime object
4. `STS2MCP capabilities` module
5. `TransitionRecord` schema / constructor
6. snapshot-only compatibility mapping
7. 最小 LLM decision schema validation
8. smoke tests for ground truth rules and invalid candidate fallback
9. 文档权威层级整理

必须保持旧命令兼容：

```bash
npm run agent:smoke
npm run agent:review
npm run check
npm run collect:state
npm run collect:watch
npm run agent:tick -- --dry-run
npm run agent:run
npm run agent:run:bridge
```

Phase 1 禁止：

- 大规模 controller rewrite。
- 改变 action semantics。
- 大迁移 monorepo。
- 引入未经说明的重依赖。
- 写完整 event-log mod。
- 写完整 vector memory。

### Phase 2：agent transition recorder + replay

目标：agent 动作数据闭环。

实现：

- AgentDecisionRecorder。
- `data/runs/<runId>/`。
- `metadata.json`。
- `snapshots/`。
- `transitions.jsonl`。
- StateDiff 独立模块。
- replay reader / replay CLI MVP。
- HumanPlayRecorder diff fallback skeleton。
- offline eval fixture skeleton。

### Phase 3：分层脚手架和短 prompt

目标：速度和质量提升。

实现：

- mechanics-engine 拆分。
- candidates/scoring 按 screen 拆分。
- combat segmented plan generator。
- checkpoint continuation。
- card reward / shop / route / event / rest scorer。
- stronger LLM schema validation。
- prompt budget tests。

### Phase 4：memory / derived / reward / experiment 闭环

实现：

- memory retrieval scoring。
- derived retrieval snapshots。
- structured review output。
- reward record。
- strategy update evidence / rollback。
- `memory/experiments.jsonl`。
- experiment manager。

### Phase 5：event-log mod / event-first human recorder

实现：

- STS2MCP fork patch 或单独 `sts2-eventlog-mod`。
- `/api/v1/events?since=<eventId>`。
- EventLog adapter。
- event-first HumanPlayRecorder。
- diff inference 变成 fallback / validation。

---

## 13. 当前最重要的工作优先级

### P0：必须马上做

1. 文档 source-of-truth 整理。
2. typed `AdapterCapabilities`。
3. typed `GameIO`。
4. `TransitionRecord` schema。
5. snapshot-only compatibility。
6. ground truth rules tests。
7. invalid LLM candidate fallback tests。

### P1：紧随其后

1. AgentDecisionRecorder。
2. `data/runs/<runId>/`。
3. replay CLI。
4. StateDiff 独立化。
5. offline eval fixtures。

### P2：再做

1. segmented combat plan。
2. prompt schema / provider upgrade。
3. memory retrieval。
4. derived retrieval。
5. reward/experiment。

### P3：长期

1. event-log mod。
2. vector memory。
3. HTML replay。
4. game overlay。
5. training export。

---

## 14. 必须清理或收敛的重复内容

下一轮 Codex 应审计并处理：

```text
docs/PROJECT_STEERING.md
docs/PROJECT_BOUNDARIES.md
docs/agent-system-principles.md
docs/ai-agent-architecture.md
```

判断标准：

- 如果内容已经被 `PROJECT_PLAN.md` / `ARCHITECTURE.md` / `EXTERNAL_DEPENDENCIES.md` / 本文件吸收，则改为 redirect 或 archive。
- 如果有独有内容，则合并到对应 Tier 1/Tier 2。
- README 只列权威入口，不把所有历史文档平铺。

`DEBUG_REPORT.md` 应顶部加 warning：

```text
This is an append-only historical debug log. It is not an architecture source of truth. Current runtime state described here may be stale.
```

---

## 15. 校验清单

每次非平凡改动后至少运行：

```bash
npm install
npm exec tsc -- --noEmit
npm run agent:smoke
npm run agent:review
npm run check
```

如果 MCP 正在运行：

```bash
npm run collect:state
npm run agent:tick -- --dry-run
```

短 live validation 只在离线检查通过后运行：

```bash
npm run agent:run -- --max-ticks 5 --delay-ms 120
```

不要因为普通掉血、策略争议、路线不完美而中断 live run 修代码。只有程序级错误才中途修：

- invalid REST action。
- no candidates on actionable screen。
- repeated no-progress actions。
- stale card index loop。
- illegal target loop。
- settlement failure。
- crash。
- invalid LLM output accepted。
- corrupted memory/data logs。

---

# 16. 下一步长期 Codex Prompt

下面这段 prompt 应直接交给下一轮 Codex / coding agent。目标不是让它继续写空泛文档，而是让它自主阅读、审计、检索、构建并完整理顺项目文档索引结构和项目架构，然后小步进入 Phase 1 代码落地。

```text
你现在在 /Users/fire/STS2MCP/sts2-ai-agent-portable 中继续开发 Slay the Spire 2 AI agent。请不要另起项目，也不要继续只堆文档。当前 Phase 0 已经完成，仓库中已有 PROJECT_PLAN.md、ARCHITECTURE.md、EXTERNAL_DEPENDENCIES.md、GAME_IO_CAPABILITIES.md、DATA_SCHEMA.md、MEMORY_SYSTEM.md、DERIVED_KNOWLEDGE.md、AGENT_LOOP.md、COMBAT_PLAN_AND_CHECKPOINT.md、HUMAN_CAPTURE_LIMITS.md、REPLAY_AND_EVAL.md、REWARD_AND_EXPERIMENTS.md、CONTRIBUTING_OR_ENGINEERING_RULES.md 等文档。现在你的任务是以专业 agent 工程师、软件工程师、AI 工程师的标准，批判性检视所有已有文档和程序，建立文档 source-of-truth，清理重复文档，并开始 Phase 1 的 schema/interface/capability/transition 代码落地。

最终目标不变：把当前项目演进成一个 LLM-first + 分层本地脚手架 + 结构化记忆 + derived 经验层 + 轻量学习 + 可替换外部依赖 adapter 的 Slay the Spire 2 agent。LLM 是主要战略玩家；本地脚手架负责状态读取、规范化、候选生成、确定性计算、上下文压缩、动作执行、checkpoint、数据记录、replay、eval、memory/derived/reward 支撑。最终系统要能高水平、高速度、可复盘、可学习、可维护地真实本地玩 STS2。

请先完整阅读并审计以下文档：

Tier 0 / Tier 1 candidates:
- PROJECT_AUTHORITY_GUIDE.md
- README.md
- LLM_HANDOFF.md
- PROJECT_PLAN.md
- ARCHITECTURE.md
- EXTERNAL_DEPENDENCIES.md
- GAME_IO_CAPABILITIES.md
- DATA_SCHEMA.md
- MEMORY_SYSTEM.md
- DERIVED_KNOWLEDGE.md
- AGENT_LOOP.md
- COMBAT_PLAN_AND_CHECKPOINT.md
- HUMAN_CAPTURE_LIMITS.md
- REPLAY_AND_EVAL.md
- REWARD_AND_EXPERIMENTS.md
- CONTRIBUTING_OR_ENGINEERING_RULES.md

Operational / historical docs:
- DEBUG_REPORT.md
- BUNDLE_MANIFEST.md
- PORTABLE_USAGE.md
- docs/DEPLOYMENT.md
- docs/ITERATION_GUIDE.md
- docs/GITHUB_CHECKLIST.md
- docs/MCP_USAGE.md
- docs/LLM_BRIDGE.md
- docs/ai-agent-defect-strategy.md
- docs/ai-sts2-local-runbook.md

Potentially duplicate / redirect candidates:
- docs/PROJECT_STEERING.md
- docs/PROJECT_BOUNDARIES.md
- docs/agent-system-principles.md
- docs/ai-agent-architecture.md

请完整阅读并审计核心代码：

- package.json
- tsconfig.json
- src/agent/types.ts
- src/agent/client.ts
- src/agent/state.ts
- src/agent/candidates.ts
- src/agent/scoring.ts
- src/agent/controller.ts
- src/agent/checkpoint.ts
- src/agent/fallback.ts
- src/agent/memory.ts
- src/agent/prompt.ts
- src/agent/llm.ts
- src/agent/collector.ts
- src/agent/review.ts
- src/agent/sts2Knowledge.ts
- src/agent/smoke.ts
- scripts/sync-sts2-data.mjs
- scripts/llm-bridge-decider.mjs
- data/spire-codex/
- derived/
- memory/

第一部分：输出审计报告

请先输出一个审计报告，不要马上大规模改代码。审计报告必须包括：

1. 文档权威层级
把当前文档分成：
- Tier 0：入口文档。
- Tier 1：长期架构和规范 source of truth。
- Tier 2：子系统设计文档。
- Tier 3：操作手册、迁移、debug、历史状态。
- Tier 4：重复、应合并、应 redirect、应 archive 的文档。

请指出：
- 哪些文档重复讲同一件事。
- 哪些文档包含过期或危险信息。
- 哪些文档应该精简。
- 哪些内容应合并到 PROJECT_AUTHORITY_GUIDE.md、PROJECT_PLAN.md、ARCHITECTURE.md、DATA_SCHEMA.md、GAME_IO_CAPABILITIES.md。
- README 是否过长或把太多文档列为同等权威入口。
- DEBUG_REPORT 是否需要历史 warning。

2. 当前代码与文档差距
逐项核对：
- 文档说有的能力，代码是否真的有。
- 文档说 future 的能力，是否明确标注 future。
- 是否缺 formal domain-core。
- 是否缺 typed GameIO。
- 是否缺 AdapterCapabilities runtime object。
- 是否缺 TransitionRecord schema。
- 是否缺 AgentDecisionRecorder。
- 是否缺 data/runs/<runId>/。
- 是否缺 replay CLI。
- 是否缺 offline eval。
- 是否缺 human diff inference fallback。
- 是否缺 event-log adapter 抽象。
- controller.ts 是否承担过多 orchestration。
- candidates.ts / scoring.ts 是否仍是多 screen 大文件。
- LLM 输出是否缺 schema validation。
- prompt 是否仍可能过长或重复。
- memory/derived/fact 是否仍可能混用。

3. 当前最高优先级
请明确 Phase 1 只做：
- 文档 source-of-truth 整理。
- domain-core / GameIO / AdapterCapabilities。
- TransitionRecord schema。
- snapshot-only compatibility。
- 最小 LLM candidate validation。
- ground truth rules tests。

不要在 Phase 1 做：
- 完整 controller rewrite。
- 完整 replay/eval。
- full event-log mod。
- vector memory。
- full segmented combat plan。
- 大型 monorepo 迁移。

第二部分：整理文档索引结构

请根据审计报告进行小步文档整理：

1. 新增或更新 PROJECT_AUTHORITY_GUIDE.md，使其成为最高指导文档。
2. README.md 精简为入口，只列权威文档和 quick start。
3. LLM_HANDOFF.md 只保留当前接手状态，不复制完整架构。
4. PROJECT_PLAN.md 保留为唯一长期项目书，补充 Phase 1 状态。
5. ARCHITECTURE.md 更新为 five planes 架构，并明确 mod vs local agent boundary。
6. DATA_SCHEMA.md 同步 TransitionRecord 和 ground truth rules。
7. GAME_IO_CAPABILITIES.md 同步 AdapterCapabilities 代码路径。
8. DEBUG_REPORT.md 顶部加历史 warning。
9. 对 docs/PROJECT_STEERING.md、docs/PROJECT_BOUNDARIES.md、docs/agent-system-principles.md、docs/ai-agent-architecture.md 做去重：有独有内容则合并到权威文档；重复则改为 redirect 或移动到 docs/archive/。不要直接删除历史。

第三部分：Phase 1 代码落地

请小步实现，不要破坏旧命令。

必须新增或整理：

1. domain-core
建议路径：
- src/domain/types.ts
或
- src/core/domain.ts

至少包含：
- AdapterCapabilities
- GameIO interfaces
- GameState / CanonicalState 最小稳定类型
- GameAction / LegalAction
- GameEvent / ActionEvent
- TransitionRecord
- CaptureMode
- RunRecord
- StateSnapshot
- StateDiff
- DecisionAudit
- LlmDecision
- MemorySnapshot
- DerivedSnapshot
- ExecutionResult

2. GameIO interface
建议路径：
- src/game-io/types.ts

至少定义：
- StateReader
- RawStateReader
- ActionExecutor
- GameEventReader
- CapabilityProvider
- GameIO

3. STS2MCP adapter capabilities
建议路径：
- src/adapters/sts2mcp/capabilities.ts

当前 capability 必须明确：
- canReadState=true
- canReadRawState=true
- canReadScreen=true
- canExecuteActions=true
- canReadAgentActionResults="partial"
- canListLegalActions=false
- canReadEventLog=false
- canReadHumanEvents=false
- canProvideFactData=false
- canProvideVersionedFacts=false

4. transition schema
建议路径：
- src/data/transitionSchema.ts

实现：
- TransitionRecord 类型导出。
- createSnapshotOnlyTransition()。
- createExecutorLoggedTransitionSkeleton()。
- createDiffInferredTransitionSkeleton()。
- ground truth invariant checks。

Rules：
- executor_logged 可以 isGroundTruth=true。
- mcp_event 只有 identity/timing 足够时可以 isGroundTruth=true。
- diff_inferred 永远 isGroundTruth=false。
- snapshot_only 永远 isGroundTruth=false。

5. LLM decision validation 最小实现
不要一次性重写 LLM provider，但必须确保：
- LLM 输出 JSON parse 失败 fallback。
- LLM 输出 candidateId 不存在 fallback。
- LLM 输出 candidateId 不在当前 candidate list fallback。
- fallback 被记录。

如果引入 Zod 或其他 schema 库，必须说明原因、license、替代方案、测试和回滚路径。Phase 1 可以先用轻量自写 validator。

6. smoke tests
新增或扩展 smoke 覆盖：
- STS2MCP adapter capabilities。
- canReadHumanEvents=false。
- diff_inferred 不能 isGroundTruth=true。
- snapshot_only 不能 isGroundTruth=true。
- executor_logged 可以 isGroundTruth=true。
- snapshot-only mapping。
- invalid LLM candidate fallback。
- old CollectedStateRecord compatibility。

第四部分：mod 边界要求

请确保文档和代码注释都明确：

应该做成 mod / mod patch 的能力：
- 读取游戏内部状态。
- 执行动作。
- action result。
- legal action 或 raw actionable state。
- human UI action event。
- game event log。
- cardInstanceId、cardIndex、targetId、optionId。
- preStateHash/postStateHash。
- GET /api/v1/events?since=<eventId>。

不能放进 mod 的能力：
- LLM 调用。
- prompt。
- API key。
- memory。
- derived knowledge。
- reward。
- experiment manager。
- planning/scoring。
- replay/eval。
- vector database。
- training export。

人工玩数据采集必须是：
- 游戏内 event-log mod 捕获真实 human/game events。
- 本地 HumanPlayRecorder 把 event + pre/post state 拼成 TransitionRecord。
- 当前无 event log 时只能 diff_inferred，isGroundTruth=false。

第五部分：必须保持兼容

必须保持以下命令不坏：

npm run agent:smoke
npm run agent:review
npm run check
npm run collect:state
npm run collect:watch
npm run agent:tick -- --dry-run
npm run agent:run
npm run agent:run:bridge

完成后必须运行：

npm install
npm exec tsc -- --noEmit
npm run agent:smoke
npm run agent:review
npm run check

如果 MCP 正在运行，也运行：

npm run collect:state
npm run agent:tick -- --dry-run

第六部分：输出总结

完成后请输出：

1. 做了哪些文档整理。
2. 哪些文档被设为权威。
3. 哪些文档被 redirect/archive。
4. 新增了哪些 schema/interface/capability 文件。
5. Ground truth rules 如何被代码和测试覆盖。
6. 哪些旧命令已验证。
7. Phase 2 下一步清单。
8. 风险和回滚方式。

每个非平凡 patch 必须说明：
- layer changed。
- reason。
- expected effect。
- risk。
- tests。
- rollback path。

现在请开始：先做审计报告，再小步整理文档，然后执行 Phase 1 代码落地。
```

---

## 17. 最后校验

本文件已按以下目标自检：

- 是否定义了项目最高目标：是。
- 是否定义了文档权威层级：是。
- 是否明确哪些文档应保留、合并、redirect、archive：是。
- 是否明确 mod 与 local agent 边界：是。
- 是否明确 human capture 当前限制：是。
- 是否明确 STS2MCP 当前不能读 human events：是。
- 是否明确 agent action ground truth 规则：是。
- 是否明确 data schema 与 transition 方向：是。
- 是否明确 Phase 1 不做大爆炸重构：是。
- 是否明确下一步 Codex prompt：是。
- 是否保留长期自主探索空间：是。
- 是否避免把实现绑定死到某个外部项目：是。
