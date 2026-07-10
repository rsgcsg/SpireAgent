# STS2 AI Agent Portable Usage

这个文件夹是可搬走的 Slay the Spire 2 AI agent **工程运行时**。复制到其他位置后，只要那台机器能连接已经运行的 STS2 MCP/REST 服务，就可以继续使用同一套 agent、结构化知识库、派生策略和本地数据。它还不是已经完成的玩家安装产品；长期产品方向见 `docs/PRODUCT_VISION.md`。

## 包含什么

- `src/agent/`：TypeScript agent 源码。
- `scripts/`：数据同步和 Codex bridge 脚本。
- `data/spire-codex/`：本地结构化事实库，运行时优先读本地 JSON。
- `derived/`：派生策略层，存卡牌/遗物标签、协同规则、抓牌规则。
- `memory/`：本局记忆、长期记忆、经验库、策略参数和快照。
- `memory/collected/`：只读采集数据，运行 collector 后生成。
- `docs/`：MCP 使用、LLM bridge、架构、策略和本地 runbook。
- `package.json` / `package-lock.json` / `tsconfig.json`：Node/TypeScript 项目配置。
- `.env.example`：可选环境变量示例。

## 不包含什么

- 不包含 STS2 MCP C# mod 源码。
- 不包含 Python MCP server。
- 不包含游戏本体、mod 构建产物、`node_modules`。
- 不包含 Codex 本体；Codex bridge 只是把 LLM 请求落到 `/tmp/sts2-llm-bridge/`。

这些都属于外部运行依赖。项目默认通过 `http://localhost:15526` 调用 STS2 MCP mod 暴露的 REST API。

## 搬到新位置后的安装

```bash
cd /path/to/sts2-ai-agent-portable
npm install
npm run check
```

如果 `npm run check` 通过，说明 TypeScript 类型和离线 smoke 回归测试正常。

## 连接游戏

1. 启动 Slay the Spire 2。
2. 确认 STS2 MCP mod 已加载。
3. 验证 REST API：

```bash
curl -s http://localhost:15526/
curl -s 'http://localhost:15526/api/v1/singleplayer?format=json'
```

如果端口不同：

```bash
export STS2_API_URL=http://localhost:15526
```

## 运行方式

纯本地脚手架运行：

```bash
npm run agent:run -- --max-ticks 500 --delay-ms 120
```

只读采集当前状态，不执行动作：

```bash
npm run collect:state
```

持续 watch 人类或 agent 正在玩的局：

```bash
npm run collect:watch -- --max-ticks 60 --interval-ms 1000
```

开发调试时使用 Codex bridge：

```bash
npm run agent:run:bridge -- --max-ticks 500 --delay-ms 120
```

正式跑局时接外部 LLM 命令：

```bash
export STS2_LLM_COMMAND="/path/to/your/llm-json-decider"
export STS2_LLM_TIMEOUT_MS=300000
npm run agent:run -- --max-ticks 800 --delay-ms 80
```

`STS2_LLM_COMMAND` 从 stdin 读短 JSON prompt，向 stdout 输出短 JSON：

```json
{
  "candidateId": "card-reward-1",
  "confidence": 0.72,
  "reason": "补防御和抽牌，同时接受较低的即时伤害收益"
}
```

Live/provider 输出不能直接写 stable memory、derived knowledge、strategy、skill 或 scaffold policy。任何学习意图必须先成为 typed proposal，经过 evidence、counterexample、shadow、promotion ledger 和 rollback gate；当前 stable promotion 仍未启用。

## 保留和迁移记忆

`memory/` 包含本地运行状态和历史 legacy 数据。是否迁移应由用户明确决定；它不是自动可信的 stable learning store，也不应提交到 Git。

- `memory/current-run.json`：当前局短期记忆。
- `memory/long-term.json`：局后长期 lessons。
- `memory/experience.json`：卡牌、遗物、敌人、路线经验。
- `memory/strategy-params.json`：可回滚的本地策略参数。
- `memory/decision-log.jsonl`：逐步决策日志。
- `memory/snapshots/`：历史快照。
- `memory/collected/`：raw snapshots 和 compact state JSONL，可用于后续 replay / fixture / eval。

如果想开一个干净的本地运行状态，应先备份并使用项目后续提供的受控 reset/migration 流程。不要把手工删除文件当成稳定知识 rollback；P9 的 promotion ledger 和 rollback snapshot 尚未完成。

## 更新结构化数据

```bash
npm run sync:sts2-data
```

同步脚本只更新 `data/spire-codex/` 原始事实层，不会覆盖 `derived/` 和 `memory/` 的学习经验。

## 运行前检查清单

```bash
npm install
npm run agent:smoke
curl -s http://localhost:15526/
npm run agent:review
```

如果使用 bridge，查看当前 LLM 请求：

```bash
cat /tmp/sts2-llm-bridge/latest-request.json
```

## 设计约束

- MCP/REST 只负责读状态和执行动作。
- 本地脚手架负责整理状态、生成候选、组合/预算评估、记忆检索和快速执行。
- collector 只负责只读采集 raw/compact/hash/timestamp，不参与策略。
- LLM 是主要战略玩家，但只在关键分歧点介入。
- Provider mode、rollout mode、learning mode 和 strategic authority mode 必须分开；本地能力增强不等于自动获得战略权力。
- 不把所有数据塞进 prompt；只传当前 compact state、本局记忆、少量相关长期记忆和候选动作。
- 脚本不能写死单张牌策略；本地判断必须结合当前状态、敌人意图、自身状态、手牌/抽弃牌摘要、记忆和策略参数。
- 旧 `finalizeRun()` 学习属于默认阻断并审计的 legacy path，不是 P9 proposal promotion。
- 游戏仍处于持续更新环境；未来 promotion evidence 必须绑定 game/mod/adapter/fact environment scope。
- 真实跑局时不要因为普通掉血或策略争议频繁停下；只有程序 bug 才中途修，策略优化局后修。
