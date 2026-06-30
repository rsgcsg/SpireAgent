# Portable Agent Debug Report

> Historical append-only debug log. This file records what was true during earlier engineering passes; older "current status" sections may be stale. Use `PROJECT_NORTH_STAR.md`, `PROJECT_AUTHORITY_GUIDE.md`, `PROJECT_PLAN.md`, `ARCHITECTURE.md`, `GAME_IO_CAPABILITIES.md`, and `DATA_SCHEMA.md` as source of truth.

调试目录：

```text
/Users/fire/STS2MCP/sts2-ai-agent-portable
```

调试时间：

```text
2026-06-30
```

## Verification Result

已通过：

- `npm install --ignore-scripts`
- `npm exec tsc -- --noEmit`
- `npm run agent:smoke`
- `curl -sS --max-time 2 http://localhost:15526/`
- `npm run agent:tick -- --dry-run`
- `npm run agent:run -- --max-ticks 10 --delay-ms 120`

## Live MCP Result

游戏侧 MCP/REST 服务可连接：

```json
{
  "message": "Hello from STS2 MCP v0.4.0",
  "status": "ok"
}
```

## Agent Execution Result

portable 目录内的 agent 已经真实执行过一小段当前局：

- 在卡牌奖励界面选择 `Hologram`。
- 按右到左顺序领取 potion 和 gold。
- 继续到地图。
- 选择普通怪节点。
- 进入战斗后能读取敌人意图、自身状态、手牌、能量并执行出牌。
- 能处理出牌后的手牌 index 位移。
- 能写入 `memory/decision-log.jsonl` 和 `memory/current-run.json`。

## Observed Behavior

这次调试没有配置外部 LLM，所以部分“不够明显但仍可执行”的节点使用了 `fallback`：

- 卡牌奖励：选择 `Hologram`。
- 战斗第二回合：选择 `Strike -> Corpse Slug`。

这不是运行错误。正式评估智能度时建议配置：

```bash
export STS2_LLM_COMMAND='node /path/to/your-decider.mjs'
npm run agent:run -- --max-ticks 500 --delay-ms 120
```

或开发时使用：

```bash
npm run agent:run:bridge -- --max-ticks 500 --delay-ms 120
```

## Current Status

结论：这个 portable agent 包已经在新目录中调试通过。

## 2026-06-30 Engineering Pass

本轮接手后完成：

- 运行 `npm install`、`npm exec tsc -- --noEmit`、`npm run agent:smoke`、`npm run agent:review`。
- 连接本机 MCP/REST，并运行 `npm run agent:tick -- --dry-run`。
- 未真实执行游戏动作。
- 新增结构化 decision route：`forced_local`、`obvious_local`、`local_fast_combat`、`local_confident`、`local_recommended_llm_arbitrate`、`llm_required`、`no_op_or_poll`。
- tick 输出和新 decision log 增加 LLM audit、fallbackReason、candidateCount、topCandidate。
- `agent:review` 默认输出聚合摘要，`agent:review -- --full` 保留完整 memory dump。
- smoke test 覆盖 LLM 不可用 fallback 和非法 candidate fallback。

已知说明：

- 当前历史 decision log 是旧 schema，因此 review 中旧记录 route 会显示 `unknown`。
- dry-run 会读取并刷新 run memory 的状态摘要，但不会执行游戏动作，也不会写入 decision log。

## 2026-06-30 Checkpoint Pass

本轮完成：

- 复验 baseline：`npm install`、`npm exec tsc -- --noEmit`、`npm run agent:smoke`、`npm run agent:review`、`npm run agent:tick -- --dry-run`。
- 新增 `src/agent/checkpoint.ts`。
- 真实执行后记录 `preStateHash`、`postStateHash`、state diff、checkpoint kind、checkpoint reasons、settled、polls。
- checkpoint kind 包括 `none`、`soft`、`hard`、`unknown`。
- `agent:review` 增加 checkpointByKind、hardCheckpointReasons、recentHardCheckpoints。
- smoke 增加 soft play-card、generated-card hard checkpoint、enemy-death hard checkpoint。
- 真实执行了两段短跑：
  - `npm run agent:run -- --max-ticks 5 --delay-ms 120`
  - `npm run agent:run -- --max-ticks 8 --delay-ms 120`
- 真实短跑结果：完成当前 floor 3 战斗，领取奖励，选择 `Glasswork`，领取 gold，进入地图并选择下一个普通怪节点。
- 修复真实跑局暴露的问题：`end_turn` 已进入新回合但 `isPlayPhase` 短暂为 false 时不应判 settlement timeout。
- 低自由度优化：单一 `choose_map_node` 和单一 `claim_reward` 归入 `forced_local`，避免不必要 LLM 请求。

真实观察：

- 普通出牌 checkpoint 多为 `soft`。
- 敌人死亡、进入奖励、选卡、地图流转为 `hard`。
- 无 LLM 配置时，card reward 仍会 `llm_required -> fallback llm_unavailable`，这是预期；正式评估需要接 `STS2_LLM_COMMAND`。
- 战斗结束瞬间曾出现一次 `screen=unknown` 过渡态，下一 tick 正常进入 rewards；目前作为 hard checkpoint 记录，后续可考虑在 state inference 层专门处理。

剩余外部前提：

- 目标位置需要能运行 Node.js。
- 目标位置需要先执行 `npm install`。
- 游戏侧 MCP/REST 服务需要运行并可通过 `STS2_API_URL` 访问。
- 如果需要 LLM-first 行为，需要接入 `STS2_LLM_COMMAND` 或 Codex bridge。

## 2026-06-30 Collector And Conservative Fallback Pass

本轮补充 steer：项目不能只在 controller 里堆功能，要逐步演进成可采集、可回放、可测试、可评估、可复盘、可改进的 agent 系统。

已完成：

- 阅读新增 steer、当前架构文档、client、checkpoint、controller、types、review、smoke、package 配置。
- 新增 `docs/agent-system-principles.md`，保存长期目标、核心思想、模块边界、数据分层和迭代循环。
- 新增 `src/agent/fallback.ts`，把 LLM fallback 策略从 controller 拆出。
- 高压战斗中 LLM 不可用/无效时，fallback 会记录 `fallbackPolicy`；疑似斩杀保留，否则可切到更安全的格挡/保命候选。
- 新增 `src/agent/collector.ts`，提供只读采集 MVP：
  - `npm run collect:state`
  - `npm run collect:watch`
  - 输出 `memory/collected/state-log.jsonl`
  - 保存 raw snapshot 到 `memory/collected/snapshots/`
  - record 包含 schemaVersion、runId、tick、timestamp、screen、floor、hp、gold、stateHash、rawStatePath、compactState。
- `client.ts` 新增最小 `StateSource` / `ActionExecutor` 边界，后续 fixture/replay/dataset source 可以沿这个方向扩展。
- `client.ts` 改善 MCP/REST 不可用时的错误提示。
- `agent:review` 增加 `fallbackByPolicy`，recentDecisions 显示 fallbackPolicy。
- `memory` counters 增加 `conservativeFallbackDecisions`。
- smoke 增加保守 fallback 和 collector record schema 覆盖。
- 更新 README、架构文档、LLM bridge、project boundaries、portable usage、bundle manifest、memory README、handoff。

运行结果：

- `npm install`：通过。
- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过。
- `npm run agent:review`：通过。
- `curl -sS --max-time 2 http://localhost:15526/`：失败，localhost:15526 未连接。
- `npm run agent:tick -- --dry-run`：因 MCP/REST 不可用失败，错误信息已明确提示服务未运行。
- `npm run collect:state`：因 MCP/REST 不可用失败，错误信息已明确提示服务未运行。

本轮没有真实执行游戏动作。原因是本机当前无法连接游戏侧 MCP/REST 服务。该 integration 跳过不视为代码失败。

架构审计结论：

- controller 仍承担 orchestration、LLM gate、fallback、settlement、decision log 组装等多项职责；本轮先拆出 fallback，后续应继续拆 decision-router / executor / settlement。
- 当前 `GameClient` 已能作为最小 StateSource + ActionExecutor，但 controller 还没有完全转为可注入 fixture/replay source。
- 当前可以独立采集游戏状态，但 replay/eval 还未实现。
- checkpoint/state hash 已独立，可被 collector 和后续 replay 共用。
- candidates/scoring 仍偏大，下一步最值得按 screen 拆 combat/card reward/map/shop/event。

## 2026-06-30 Live Collector / Dry-run / Short-run Validation

本轮按要求执行：

- 启动 Steam 游戏：`open "steam://rungameid/2868840"`。
- 验证 MCP/REST：`curl http://localhost:15526/` 返回 `Hello from STS2 MCP v0.4.0`。
- `npm install`：通过。
- `npm run collect:state`：通过，写入 `memory/collected/state-log.jsonl` 和 raw snapshot。
- `npm run agent:tick -- --dry-run`：通过。
- `npm run agent:run -- --max-ticks 5 --delay-ms 120`：真实执行了菜单/Neow 初始事件流程。
- `npm run agent:run -- --max-ticks 3 --delay-ms 120`：真实执行并验证 bundle select / confirm / Proceed。
- `npm run agent:run -- --max-ticks 5 --delay-ms 120`：真实进地图、进普通怪战斗并出牌。
- `npm run agent:review`：通过。

真实验证结果：

- collector 可以采集真实 menu、bundle_select、map、combat 状态。
- fallbackPolicy 真实写入日志：
  - `local_top` 用于无 LLM 时的 `standard`、Neow Scroll Boxes、bundle_select。
- checkpoint 真实记录：
  - bundle confirm / event proceed / map flow 是 hard checkpoint。
  - 普通出牌是 soft checkpoint。
  - bundle preview 选择当前仍容易 settlement timeout，记录为 unknown，但下一 tick 可以继续 confirm。

真实跑局暴露并修复的问题：

- 问题：`bundle_select` 被归一化成 `screen=unknown`，导致 dry-run `No actionable candidates`。
  - 修复：新增 `bundle_select` screen、candidate、scoring、action type、smoke fixture。
- 问题：REST action 名称写错为 `bundle_select`。
  - 修复：`client.ts` 改为实际 REST action：`select_bundle`、`confirm_bundle_selection`、`cancel_bundle_selection`。
- 问题：菜单评分会被旧 run memory 中的 `菜单 DEFECT` 污染，导致过早点 `embark`，这次真实局误开成 Ironclad。
  - 修复：只认最近 120 秒内当前菜单流程的 DEFECT 选择；character_select 未确认 Defect 时降低 embark。

真实跑局仍暴露但尚未修复的问题：

- 当前局已经误开成 Ironclad，不是目标 Defect；后续新局应验证菜单修复是否生效。
- 地图节点选择出现连续两次 `choose_map_node` 才进入战斗；需要进一步区分 map transition / waiting state。
- 当前 combat 本地评分在满血时偏进攻，打完能量后 dry-run 只能 end turn 且会掉 11 HP；需要改进战斗评分，让高 incoming 时保留足够防御价值，即使满血也不应无脑用完能量攻击。
- 一次 Strike 后出现 `hand_changed_beyond_expected_card_removal` / `hand_grew_or_generated_card` hard checkpoint，说明该敌人或遗物/卡牌效果可能让手牌变化非预期，需要继续采集 replay 分析。

本轮停止位置：

- 当前真实游戏在 Act 1 floor 2 combat。
- 当前 dry-run 下一步是 `end_turn`，会掉 11 HP；因此本轮没有继续执行，避免无谓伤血。

## 2026-06-30 GitHub Readiness And Steering Docs Pass

本轮目标：把 portable agent 整理成可以远程上传到 GitHub、被其他人 clone 后重新部署的项目，并把最近几个长期 prompt 的核心目标、架构思想、迭代规范和真实跑局规范写入项目。

已完成：

- 新增 `LICENSE`。
- 新增 `.github/workflows/ci.yml`，CI 运行 `npm ci`、`npm run typecheck`、`npm run agent:smoke`。
- 更新 `package.json`：
  - 包名改为 `sts2-ai-agent-portable`。

  - 增加 `version`、`description`、`license`。
  - 增加 `typecheck` 和 `check` 脚本。
- 更新 `.gitignore`：
  - 忽略 runtime memory、collector raw data、`.env`、`node_modules`。
- 新增 `docs/DEPLOYMENT.md`：
  - 说明 GitHub clone 后安装、MCP mod 安装/验证、启动游戏、dry-run、短跑、LLM bridge。
- 新增 `docs/PROJECT_STEERING.md`：
  - 保存 prompt-derived 长期目标、架构分层、数据层边界、真实跑局规范和当前已知缺口。
- 新增 `docs/ITERATION_GUIDE.md`：
  - 说明 baseline、collector、dry-run、live run、局后修正、patch discipline。
- 新增 `docs/GITHUB_CHECKLIST.md`：
  - 上传 GitHub 前检查项。
- 更新 `README.md`、`AGENTS.md`、`LLM_HANDOFF.md`、`BUNDLE_MANIFEST.md`、`PORTABLE_USAGE.md`、`docs/agent-system-principles.md`、`docs/ai-agent-architecture.md`。

重要规范修正：

- 真实游戏测试时，普通掉血不是工程风险，也不是中途停下改代码的理由。
- 只有明显程序问题才中途停下修复，例如 invalid REST action、unknown screen 阻塞、无候选、重复无进展、过期手牌 index、settlement 卡住、崩溃或 LLM validator 失效。
- 策略质量问题应继续跑到自然节点或局后，根据 collector、review 和 decision log 复盘修正。

运行结果：

- `npm install`：通过。
- `npm run check`：通过。
- `npm run agent:review`：通过。

本轮没有继续真实执行游戏动作；当前真实局仍停在之前记录的 Act 1 floor 2 combat。

## 2026-07-01 Phase 2.6 Eval Classification / Noise Reduction Pass

本轮目标：不加大功能，不拆 controller，只把 Phase 2.5 已有 transition/replay/eval 闭环升级成更可行动的 WARN 分类，并用真实 200 tick 验证。

已完成：

- `data:eval` 新增 WARN 分类：`normal_flow_checkpoint`、`acceptable_settlement_timeout`、`program_risk`、`historical_fixed_evidence`、`strategy_quality`、`needs_fixture_bug_candidate`。
- CLI 顶层 `warnings` 降噪：普通流程和可接受 settlement timeout 留在 `warningSummary`，顶层只保留 actionable/risk/strategy 项。
- 正常 hard checkpoint 白名单覆盖 menu、reward、map、rest、proceed、end_turn、card reward、card select 成功返回、combat 出牌移除/斩杀/跳转等流程。
- shop/treasure/card-select/menu/奖励/地图等低可见度结算 timeout 标成可接受 info。
- 修复前遗留 repeated no-progress 证据标成 historical，不再误导为当前 blocker。
- 新增轻量策略质量 metrics：低血量、高 incoming、block deficit、deck too thick、potion misuse、route greed、fallback rate、repeated low confidence、combat tempo loss。

真实验证：

- 先读状态：`npm run collect:state` 通过，战斗位于 Act 2 floor 31，HP 16/75。
- dry-run：`npm run agent:tick -- --dry-run` 通过，建议使用 Strength Potion。
- 真实 200 tick：`npm run agent:run -- --max-ticks 200 --delay-ms 120` 退出码 0。
- 旧 run `run-mr0rfdcb-yewhg8` 在 boss 后死亡/结束，随后新 run `run-mr192jap-y1qb0x` 开始并推进到 Act 1 floor 15 rewards，HP 39/75，gold 11。
- `npm run data:replay -- --latest` 通过，latest run 为 `run-mr192jap-y1qb0x`，142 transitions。
- `npm run data:eval -- --latest` 返回 `WARN` 且 0 errors；142/142 selected actions 匹配 regenerated candidates。
- 降噪后 `needs_fixture_bug_candidate=0`，顶层 warnings 只剩策略质量项：block deficit、一次 low-pressure potion use、fallback-heavy decisions。

验证命令：

- `npm install`
- `npm exec tsc -- --noEmit`
- `npm run agent:smoke`
- `npm run check`
- `npm run agent:review`
- `npm run data:replay -- --latest`
- `npm run data:eval -- --latest`

本轮未发现需要停跑修复的程序级 bug。剩余问题主要是策略质量：fallback 比例偏高、防御缺口偏多、一次低压药水使用。这些不作为 Phase 2.6 blocker。

## 2026-06-30 Phase 0 Project Book And Architecture Audit

本轮目标：按照最新长期 prompt 开始 Phase 0，不做大规模代码重构，先完成真实项目诊断、外部依赖评估、推荐架构、模块边界、数据流、风险、实施路线和验收标准，并把这些内容落到仓库文档里。

阅读和审计：

- 阅读最新附件 prompt。
- 审计当前目录结构、`package.json`、README、handoff、steering docs。
- 审计核心代码：
  - `src/agent/types.ts`
  - `src/agent/client.ts`
  - `src/agent/state.ts`
  - `src/agent/candidates.ts`
  - `src/agent/scoring.ts`
  - `src/agent/controller.ts`
  - `src/agent/checkpoint.ts`
  - `src/agent/fallback.ts`
  - `src/agent/memory.ts`
  - `src/agent/prompt.ts`
  - `src/agent/llm.ts`
  - `src/agent/collector.ts`
  - `src/agent/review.ts`
  - `src/agent/sts2Knowledge.ts`
  - `src/agent/smoke.ts`
- 复查当前 STS2MCP mod 能力：可读状态、可执行 agent 动作；未发现可靠 human event/action log。
- 外部项目评估：
  - STS2MCP：适合作为 game I/O adapter。
  - Spire Codex：适合作为事实数据库和本地缓存来源，不应污染策略层。

新增 Phase 0 文档：

- `PROJECT_PLAN.md`
- `ARCHITECTURE.md`
- `EXTERNAL_DEPENDENCIES.md`
- `GAME_IO_CAPABILITIES.md`
- `DATA_SCHEMA.md`
- `MEMORY_SYSTEM.md`
- `DERIVED_KNOWLEDGE.md`
- `AGENT_LOOP.md`
- `COMBAT_PLAN_AND_CHECKPOINT.md`
- `HUMAN_CAPTURE_LIMITS.md`
- `REPLAY_AND_EVAL.md`
- `REWARD_AND_EXPERIMENTS.md`
- `CONTRIBUTING_OR_ENGINEERING_RULES.md`

更新文档入口：

- `README.md`
- `LLM_HANDOFF.md`
- `docs/PROJECT_STEERING.md`

基线验证：

- `npm install`：通过。
- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过。
- `npm run check`：通过。
- `npm run agent:review`：通过。
- `curl -sS --max-time 2 http://localhost:15526/`：通过，返回 `Hello from STS2 MCP v0.4.0`。
- `npm run collect:state`：通过，采集当前真实局 `screen=combat`、`floor=2`。
- `npm run agent:tick -- --dry-run`：通过，选择 `end_turn`，`route=forced_local`，未执行真实动作。

本轮没有真实执行游戏动作。

审计发现的主要问题：

- 当前 TypeScript agent 已能跑通基本 loop，但还没有 formal `domain-core` / `game-io` / adapter capability schema。
- `controller.ts` 仍承担较多 orchestration 细节。
- `candidates.ts` 和 `scoring.ts` 仍是多 screen 混合文件。
- collector 仍是 snapshot-only，不是完整 transition recorder。
- 没有 replay CLI 和离线 eval runner。
- Human play 目前只能 snapshot 或 diff inference，不能作为 ground truth labeled examples。
- Combat 已有 checkpoint，但还不是完整 segmented plan。
- Review 已能聚合 route/fallback/checkpoint，但 transition/reward/experiment 还未闭环。

下一步最值得做：

1. Phase 1：新增 typed `AdapterCapabilities`、`GameIO` interface 和 transition schema，同时保持旧命令兼容。
2. Phase 2：实现 agent transition recorder，把 agent action 记录为 `executor_logged` + `isGroundTruth=true`。
3. Phase 2/3：添加 state diff / replay reader / offline eval fixture，优先覆盖地图重复点击、hand index、human diff ambiguity。
4. Phase 3：把 combat candidate 从单动作升级为短 plan + checkpoint continuation。

## 2026-06-30 Phase 1 Source Of Truth And Schema Pass

本轮目标：在 Phase 0 文档基础上继续开发，不另起项目，不继续只堆文档；先审计文档和代码，然后收敛文档 source-of-truth，并落地 Phase 1 的 schema/interface/capability/transition 基础。

审计结论：

- `README.md` 太像完整文档索引，已精简为 quick start + authority docs。
- `LLM_HANDOFF.md` 过长且复制架构内容，已改成当前接手状态。
- `docs/PROJECT_STEERING.md`、`docs/PROJECT_BOUNDARIES.md`、`docs/agent-system-principles.md`、`docs/ai-agent-architecture.md` 与根目录权威文档重复，已改为 redirect。
- `DEBUG_REPORT.md` 顶部已加历史 warning，避免旧“当前状态”误导后续 agent。
- 当前代码已有可工作的 agent loop，但缺 formal domain-core、typed GameIO、runtime AdapterCapabilities、TransitionRecord schema 和 ground truth invariant。

文档整理：

- `PROJECT_NORTH_STAR.md` 保持长期最高原则文档。
- `PROJECT_AUTHORITY_GUIDE.md` 保持工程权威索引，并补充 Phase 1 状态和“代码变更必须同步文档”要求。
- `PROJECT_PLAN.md` 补充 Phase 1 当前状态和代码 anchors。
- `ARCHITECTURE.md` 重写为 five planes 架构，并明确 mod vs local agent boundary。
- `DATA_SCHEMA.md` 同步 `src/data/transitionSchema.ts` helpers 和 ground truth rules。
- `GAME_IO_CAPABILITIES.md` 同步 `src/domain/types.ts`、`src/game-io/types.ts`、`src/adapters/sts2mcp/capabilities.ts`、`src/agent/client.ts`。

新增代码：

- `src/domain/types.ts`
  - `AdapterCapabilities`
  - `GameIO` 相关接口
  - `GameState` / `CanonicalState`
  - `GameAction` / `LegalAction`
  - `GameEvent` / `ActionEvent`
  - `TransitionRecord`
  - `CaptureMode`
  - `RunRecord`
  - `StateSnapshot`
  - `StateDiff`
  - `DecisionAudit`
  - `LlmDecision`
  - `MemorySnapshot`
  - `DerivedSnapshot`
  - `ExecutionResult`
- `src/game-io/types.ts`
  - re-export typed GameIO boundary。
- `src/adapters/sts2mcp/capabilities.ts`
  - `STS2MCP_REST_CAPABILITIES`
  - `getSts2McpRestCapabilities()`
- `src/data/transitionSchema.ts`
  - `createSnapshotOnlyTransition()`
  - `createSnapshotOnlyTransitionFromCollectedState()`
  - `createExecutorLoggedTransitionSkeleton()`
  - `createDiffInferredTransitionSkeleton()`
  - `assertGroundTruthInvariants()`
- `src/agent/llm.ts`
  - `validateLlmDecisionForCandidates()`
- `src/agent/client.ts`
  - `RestGameClient.capabilities()`

Ground truth rules：

- `executor_logged` 可以 `isGroundTruth=true`，但必须有 `selectedAction`。
- `snapshot_only` 永远不能是 ground truth。
- `diff_inferred` 永远不能是 ground truth。
- `mcp_event` 只有同时具备 action identity 和 timing evidence 时才可标记为 ground truth。

Smoke 覆盖：

- STS2MCP capabilities，包括 `canReadHumanEvents=false`。
- `snapshot_only` 不能 ground truth。
- `diff_inferred` 不能 ground truth。
- `executor_logged` 可以 ground truth。
- `CollectedStateRecord` 到 snapshot-only transition 的兼容映射。
- LLM candidate validator：合法、missing candidate、missing candidateId。
- controller 中 invalid LLM output / invalid choice fallback。

运行结果：

- `npm install`：通过。
- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过。
- `npm run agent:review`：通过。
- `npm run check`：通过。
- MCP 在线：`curl http://localhost:15526/` 返回 `Hello from STS2 MCP v0.4.0`。
- `npm run collect:state`：通过，采集当前真实局 `screen=combat`、`floor=2`。
- `npm run agent:tick -- --dry-run`：通过，选择 `end_turn`，未执行真实动作。

本轮没有真实执行游戏动作。

下一步最值得做：

1. Phase 2：实现 `AgentDecisionRecorder`，在 executor 周围生成 `executor_logged` transition skeleton。
2. Phase 2：新增 `data/runs/<runId>/metadata.json`、`snapshots/`、`transitions.jsonl` 写入器。
3. Phase 2：把 current collector 的 snapshot-only record 迁移/导出为 TransitionRecord。
4. Phase 2：新增最小 replay reader，能按 timeline 打印 pre/action/post/diff。

## 2026-06-30 Phase 2 Minimum Data Loop Pass

本轮目标：实现最小可用数据闭环，不重写 controller，不改变 action semantics，保留 `memory/collected/` collector 兼容。

已完成：

- 新增 `src/agent/decisionRecorder.ts`。
- CLI agent 默认创建 `AgentDecisionRecorder`。
- controller 在真实动作成功执行、settlement 完成并生成 checkpoint 后写 transition。
- 新增 `data/runs/<runId>/` 写入结构：
  - `metadata.json`
  - `snapshots/`
  - `events.jsonl`
  - `transitions.jsonl`
  - `replay.json` placeholder
- transition 记录：
  - `source="agent"`
  - `captureMode="executor_logged"`
  - `isGroundTruth=true`
  - `preStateRef` / `postStateRef`
  - `rawStatePath`
  - `compactPreState` / `compactPostState`
  - `legalActions`
  - `selectedAction`
  - `executionResult`
  - `stateDiff.checkpoint`
  - `decisionAudit`
  - `memorySnapshot`
  - minimal `derivedSnapshot`
- `CollectedStateRecord` 仍可映射为 `snapshot_only + isGroundTruth=false`。
- 新增 `src/replay/reader.ts` 和 `src/replay/cli.ts`。
- 新增 `npm run data:replay -- <runId-or-run-dir>`。
- `.gitignore` 忽略 `data/runs/` runtime output。
- smoke 新增：
  - agent executor_logged transition 是 ground truth。
  - transition JSONL 可解析。
  - replay reader 能读取 transitions。
  - run directory 基础文件存在。

已验证：

- `npm install`：通过。
- `npm run check`：通过。
- `npm run agent:review`：通过。
- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过。
- MCP 在线：`curl http://localhost:15526/` 通过。
- MCP 在线：`npm run collect:state` 通过，当前真实状态为 `screen=combat`、`floor=2`。
- MCP 在线：`npm run agent:tick -- --dry-run` 通过，当前 dry-run 为 `end_turn`，未执行真实动作。

真实短跑验证：

- `npm run agent:run -- --max-ticks 10 --delay-ms 120`：通过。
- 本轮真实执行 10 个动作：
  - floor 2 combat end turn。
  - Defend / Bash / end turn / Unrelenting。
  - 领取 card reward，选择 `Cinder`。
  - 领取 potion、gold。
  - proceed 到地图。
- `data/runs/run-mr0ckah9-99khw3/transitions.jsonl` 写入 10 条真实 transition。
- `data/runs/run-mr0ckah9-99khw3/snapshots/` 写入 20 个 pre/post raw snapshots。
- 抽查首条 transition：
  - `source="agent"`
  - `captureMode="executor_logged"`
  - `isGroundTruth=true`
  - 有 pre/post refs、selectedAction、executionResult、stateDiff、legalActions、memorySnapshot。
- `npm run data:replay`：通过，输出 10 条 timeline。
- 短跑后 `npm run agent:review`：通过。
- 短跑后 `npm run collect:state`：通过，当前真实状态为 `screen=map`、`floor=2`、`hp=72/80`、`gold=116`。

剩余缺口：

- offline eval runner 已有最小工程检查版本，但还没有策略质量评分。
- 未实现 HumanPlayRecorder diff fallback。
- 当前 STS2MCP 仍不能可靠提供 human UI action ground truth。

## 2026-07-01 Phase 2.5 Offline Eval Runner Pass

本轮目标：把 transition/replay 数据升级为可自动检查的工程闭环，不重写 controller，不调复杂策略。

已完成：

- 新增 `src/eval/runner.ts`。
- 新增 `src/eval/cli.ts`。
- 新增 `npm run data:eval`。
- `data:eval` 默认读取 latest run，也支持：
  - `npm run data:eval -- --latest`
  - `npm run data:eval -- --run-id <runId>`
  - `npm run data:eval -- --run-dir <path>`
- eval 输出：
  - `status`: `PASS` / `WARN` / `FAIL`
  - `summary`
  - `errors`
  - `warnings`
- 当前检查项：
  - `metadata.json` 可读且有 runId。
  - `transitions.jsonl` 每行可解析。
  - transition runId 与 metadata runId 一致。
  - transitionId 唯一。
  - pre/post/raw snapshot ref 存在。
  - ground truth invariant。
  - human 非 `mcp_event` 不能 ground truth。
  - pre raw snapshot 可重新 normalize。
  - actionable screen 不能 0 candidates。
  - selectedAction 必须匹配 regenerated candidates。
  - stale card index、illegal target、unknown screen action 作为 FAIL。
  - hard/unknown checkpoint、settlement timeout、repeated no-progress 作为 WARN。
- `src/replay/cli.ts` 支持 `npm run data:replay -- --latest` 和 `--run-id`。
- smoke 覆盖 eval runner PASS 路径和 human ground-truth invariant。

已验证：

- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过。
- `npm run data:replay -- --latest`：通过。
- `npm run data:eval -- --latest`：通过，当前真实 run 返回 `WARN`，0 errors，10/10 selectedAction matched，仅 hard checkpoint warnings。

## 2026-07-01 Phase 2.5 Live Hardening Follow-up

本段修正上一节之后继续真实长跑暴露的程序级问题。上一节的 eval `WARN` 结果只适用于当时的短 run；后续 latest run 保留了修复前的坏 transition，因此会被当前 eval 正确判为 `FAIL`。

已修复：

- map/loading 状态不再生成不可用的 proceed。
- `hand_select` 归一化为 card-select 流程，并使用真实 REST action `combat_select_card` / `combat_confirm_selection`。
- shop 不再为 sold-out 或 unaffordable 商品生成购买候选。
- treasure loading 状态不再生成无效 proceed；可领取 relic 时使用 `claim_treasure_relic`。
- event loading 状态不再生成通用 proceed。
- potion reward 在药水槽已满时不再直接 `claim_reward`；候选改为 proceed/skip 或 discard potion。
- potion action 使用 raw `slot`，避免稀疏 potion 数组导致 stale slot。
- self/buff potion 不再带 enemy target；只有 enemy-target potion 才生成 target。
- rest 选择后增加短 settlement backoff，避免立即 proceed 时 REST 按钮尚未启用。

已验证：

- `npm install`：通过。
- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过。
- `npm run check`：通过。
- `npm run agent:review`：通过。
- `npm run data:replay -- --latest`：通过。

当前重要说明：

- `npm run data:eval -- --latest` 对 `run-mr0qudda-21si27` 返回 `FAIL` 是预期的历史证据：该 run 内含修复前的重复 `claim_reward:0` no-progress 和旧 potion target action。
- 不要把这个 latest-run FAIL 记为当前代码未通过；需要用修复后的新 run 覆盖 latest，再用 `npm run data:eval -- --latest` 判断当前闭环。
- 普通掉血、路线争议、fallback 策略不聪明仍不是停跑条件。程序级 FAIL 才停。

## 2026-07-01 Phase 2.5 Fresh Latest Run And Adapter Edge Fixes

本段继续真实跑局，旧污染 run 已结束并开启新的 Defect run：`run-mr0rfdcb-yewhg8`。

新发现并修复的程序级问题：

- `embark` 后 raw state 仍短暂显示 `state_type=menu` / `menu_screen=character_select`，但 `run.act=1`、`floor=0`，并且 `embark/confirm` 已 disabled。此前会再生成 stale menu action，REST 报 `Not on a menu screen`。
  - 修复：菜单候选过滤 disabled options；post-embark run-start menu transition 返回空候选等待下一 screen。
- `Fairy in a Bottle` 出现在 potion list 中但为 automatic potion，不能手动 `use_potion`。此前会重复请求手动使用，REST 报 `Potion 'Fairy in a Bottle' is automatic and cannot be manually used`。
  - 修复：combat potion candidate 过滤 raw unusable/automatic flags，并按文本过滤 `Fairy in a Bottle` / automatic / upon death 类药水。

已验证：

- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过，新增 disabled menu / run-start transition / automatic potion fixture。
- `npm run check`：通过。
- `npm run agent:review`：通过。
- MCP 在线：`npm run collect:state`：通过。
- MCP 在线：`npm run agent:tick -- --dry-run`：通过，Fairy 被过滤后候选为 `end_turn`。
- MCP 在线：`npm run agent:run -- --max-ticks 10 --delay-ms 120`：通过，解除 automatic potion no-progress 后继续完成 floor 2 战斗并进入 rewards。
- `npm run data:replay -- --latest`：通过，latest run 22 transitions。
- `npm run data:eval -- --latest`：通过，返回 `WARN`、0 errors、22/22 selectedAction matched、0 repeatedNoProgress。

当前 latest run 说明：

- `run-mr0rfdcb-yewhg8` 为当前最新 run，可作为当前代码的 engineering eval 信号。
- Eval 仍为 `WARN`，因为 hard checkpoint、menu Defect unknown checkpoint、Dexterity Potion unknown checkpoint 属于审计项；当前没有 JSONL/schema/snapshot/action matching 错误。

## 2026-07-01 Phase 2.5 Live Stability Validation

本段继续使用现有 transition/replay/eval 闭环做真实稳定性验证，没有新增大功能或重写 controller。当前 latest run 仍是 `run-mr0rfdcb-yewhg8`，后续 transition 已推进到 Act 2。

真实验证过程：

- 50 tick 真实跑局从 Act 1 floor 2 推进到 Act 1 floor 5，`data:eval -- --latest` 返回 `WARN`、0 errors。
- 随后 200 tick 真实跑局暴露 stale hand index：一次 `play_card` 后 post-state 仍保留同 index/cardName，settlement 误判为完成，下一 tick 使用了过期手牌，REST 返回 `card_index 2 out of range`。
- 修复 stale index 后继续 200 tick，跑过 Act 1 boss 并进入 Act 2 floor 18 event。
- Act 2 floor 18 `Pael's Tooth` 多选移除事件暴露 repeated no-progress：REST 接受 `select_card index=0` 但 raw fingerprint 不变，agent 重复 toggle 同一张 Strike。
- 修复 card-select guard 后，50 tick 验证成功选择 index 0/1/2/3/4 并 confirm，离开事件，继续到 Act 2 floor 20 rewards。

已修复的程序级问题：

- `play_card` settlement 不再接受“同 screen/state 且被打出的 card 仍在同一 hand index/name”的 post-state；此类状态继续轮询，避免 stale index。
- `card_select` / `combat_select_card` 在未 settle 且 fingerprint 不变时记录已尝试 index，后续选择同类未尝试 candidate；若没有可尝试项则等待，不再无限 toggle 同一选择。
- replay/eval 的短 action 标识现在包含 `cardIndex` / `index`，避免把 `select_card:0:Strike`、`select_card:1:Strike` 等误判为同一 repeated no-progress。

已验证：

- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过，包含 stale play-card settlement 和 repeated card-select guard fixture。
- `npm run check`：通过。
- `npm run agent:review`：通过。
- `npm run data:replay -- --latest`：通过。
- `npm run data:eval -- --latest`：通过，返回 `WARN`、0 errors、374 parsed transitions、374 selected actions matched。

当前 eval 说明：

- `run-mr0rfdcb-yewhg8` 的 `WARN` 包含历史 transition 证据：修复前同一 run 内曾重复 `select_card:0:Strike`，因此 repeatedNoProgress 仍会显示 14。
- 修复后的 Pael's Tooth 流程已在同一 run 中依次记录 `select_card:0:Strike`、`select_card:1:Strike`、`select_card:2:Strike`、`select_card:3:Strike`、`select_card:4:Defend`、`confirm_selection`。
- 没有 JSONL parse、snapshot ref、ground truth invariant、candidate regeneration、selectedAction matching 错误。
- 第二个修复之后已完成一整段新的 200 tick 无程序级中断验证：从 Act 2 floor 20 rewards 推进到 Act 2 floor 31 combat。`data:eval -- --latest` 返回 `WARN`、0 errors、574 parsed transitions、574 selected actions matched。下一步可进入 Phase 2.6 的轻量设计/验证准备，但仍应把 checkpoint/settlement WARN 当作后续工程审计输入。

## 2026-07-01 Phase 2.5 Fresh 200 Tick Validation

在 stale play-card settlement、card-select guard、indexed replay/eval action identity 都修复后，重新执行 200 tick：

- 起点：Act 2 floor 20 rewards，hp 55/75。
- 终点：Act 2 floor 31 combat，hp 16/75，run `run-mr0rfdcb-yewhg8`。
- 新增 transition：从 374 增至 574。
- `npm run data:replay -- --latest`：通过，可读取 574 条 timeline。
- `npm run data:eval -- --latest`：`WARN`，0 errors，574/574 selectedAction matched regenerated candidates。

本段没有发现新的程序级 bug。剩余主要是策略/审计问题：

- LLM 不可用时 fallback 仍会在无 incoming 或高压局面做不聪明选择。
- shop/treasure/potion/card-select 等界面仍会产生 unknown checkpoint / settlement timeout WARN，但没有形成 invalid REST action 或重复无进展。
- 同一 run 内仍保留修复前 Pael's Tooth 的 14 条 historical repeatedNoProgress warning；它们不是 fresh 200 的新回归。
