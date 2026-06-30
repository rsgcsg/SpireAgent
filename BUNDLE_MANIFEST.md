# STS2 AI Agent Bundle Manifest

这个文件说明当前可迁移包里每一类文件的用途，以及迁移后如何确认没有漏东西。

## What This Bundle Is

这是 Slay the Spire 2 AI agent 的独立运行包。它包含：

- 本地 TypeScript agent 控制器
- 本地 MCP/REST 客户端
- 候选动作生成、评分、LLM 调用、prompt 压缩逻辑
- 只读 collector、state hash 和采集 JSONL schema
- 分层记忆系统和当前已有记忆
- Spire Codex 本地结构化数据缓存
- 派生策略知识
- 同步脚本、LLM bridge 脚本、GitHub CI 和操作文档

这个包被设计成可以复制到另一个目录后直接运行。迁移后只需要安装 Node 依赖，并确保目标机器上游戏侧 MCP/REST 服务可用。

## Included Files

### Runtime Code

- `src/agent/index.ts`：命令行入口。
- `src/agent/controller.ts`：主循环、本地决策、LLM gate、执行动作、记录结果。
- `src/agent/client.ts`：连接游戏 MCP/REST 服务。
- `src/agent/collector.ts`：只读采集 raw state、compact state、state hash 和 JSONL 记录。
- `src/agent/state.ts`：压缩和规范化游戏状态。
- `src/agent/candidates.ts`：生成合法候选动作。
- `src/agent/scoring.ts`：本地启发式评分、明显决策判断、轻量风险估计。
- `src/agent/fallback.ts`：LLM 不可用/无效时的 fallback 策略和 audit。
- `src/agent/llm.ts`：外部 LLM 命令和 Codex bridge 接入。
- `src/agent/prompt.ts`：短 prompt 组装。
- `src/agent/memory.ts`：本局记忆、长期记忆、经验和策略参数读写。
- `src/agent/sts2Knowledge.ts`：本地结构化知识库读取和检索。
- `src/agent/smoke.ts`：无需启动游戏的最小回归测试。
- `src/agent/types.ts`、`src/agent/utils.ts`：共享类型和工具函数。
- `.github/workflows/ci.yml`：GitHub Actions，运行 install、typecheck 和 smoke。

### Scripts

- `scripts/sync-sts2-data.mjs`：从 Spire Codex 同步卡牌、遗物、角色、关键词、药水数据到本地。
- `scripts/llm-bridge-decider.mjs`：开发调试用 LLM bridge。正式跑局建议用 `STS2_LLM_COMMAND` 接外部 LLM/API。

### Local Knowledge

- `data/spire-codex/`：原始事实层。运行时优先读本地 JSON，不依赖远程 API。
- `derived/`：派生策略层。保存抓牌规则、协同、标签和策略经验。

### Memory

- `memory/current-run.json`：当前局/最近局的运行记忆。
- `memory/decision-log.jsonl`：关键决策日志。
- `memory/long-term.json`：局后复盘沉淀的长期记忆。
- `memory/experience.json`：卡牌、遗物、敌人、路线等经验条目。
- `memory/strategy-params.json`：可保守微调、可回滚的策略参数。
- `memory/snapshots/`：局结束时的记忆快照。
- `memory/collected/`：只读采集数据，用于 replay、fixture、eval、失败分析。

### Docs

- `README.md`：快速开始和常用命令。
- `PORTABLE_USAGE.md`：迁移到新目录后的完整使用说明。
- `AGENTS.md`：给后续 agent/Codex 看的工程和玩法约束。
- `docs/MCP_USAGE.md`：MCP/REST 操作手册和常见坑。
- `docs/DEPLOYMENT.md`：从 GitHub clone 后重新部署的步骤。
- `docs/PROJECT_STEERING.md`：长期目标、prompt steer、架构原则和真实跑局规范。
- `docs/ITERATION_GUIDE.md`：持续开发、真实跑局、局后修正和 patch discipline。
- `docs/GITHUB_CHECKLIST.md`：上传 GitHub 前检查清单。
- `docs/agent-system-principles.md`：长期目标、核心思想、模块边界和迭代循环。
- `docs/LLM_BRIDGE.md`：LLM bridge 和外部命令接入说明。
- `docs/PROJECT_BOUNDARIES.md`：项目边界，说明哪些属于 agent，哪些是外部依赖。
- `docs/ai-agent-architecture.md`：LLM-first + 本地脚手架架构设计。
- `docs/ai-agent-defect-strategy.md`：已知缺陷、策略盲点和迭代方向。
- `docs/ai-sts2-local-runbook.md`：本机跑局流程。

### Node Metadata

- `package.json`：命令和依赖声明。
- `package-lock.json`：锁定依赖版本，保证迁移后安装一致。
- `tsconfig.json`：TypeScript 配置。
- `.env.example`：环境变量模板。
- `LICENSE`：MIT license。
- `.gitignore`：忽略本地依赖、日志和临时文件。

## Excluded Files

这些文件不属于 agent 包，迁移时不应该混进来：

- STS2 MCP C# Mod 工程
- Python MCP server
- 游戏安装目录和存档
- `node_modules/`
- TypeScript 构建输出
- 仓库根目录下与 agent 无关的源码、日志、IDE 配置

## External Runtime Requirements

- Node.js 20 或更新版本。
- 目标机器上能启动 Slay the Spire 2。
- 游戏侧 MCP/REST 服务已运行，默认地址为 `http://localhost:15526`。
- 如需 LLM 决策，配置 `STS2_LLM_COMMAND`，或开发时使用 `npm run agent:run:bridge`。

## First Run After Moving

```bash
cd sts2-ai-agent-portable
npm install
npm run agent:smoke
cp .env.example .env
```

如果游戏侧服务不是默认地址，在 `.env` 或 shell 中设置：

```bash
export STS2_API_URL=http://localhost:15526
```

启动 agent：

```bash
npm run agent:run -- --max-ticks 500 --delay-ms 120
```

只读采集当前状态：

```bash
npm run collect:state
```

使用外部 LLM：

```bash
export STS2_LLM_COMMAND='node /path/to/your-decider.mjs'
npm run agent:run -- --max-ticks 500 --delay-ms 120
```

开发调试 bridge：

```bash
npm run agent:run:bridge -- --max-ticks 500 --delay-ms 120
```

## Verification Checklist

迁移后至少确认：

- `npm install` 成功。
- `npm run agent:smoke` 成功。
- `curl -s http://localhost:15526/` 能连到游戏侧服务。
- `memory/long-term.json`、`memory/experience.json`、`memory/strategy-params.json` 存在。
- `data/spire-codex/cards-zhs.json` 和 `data/spire-codex/relics-zhs.json` 存在。

如果上述检查通过，这个文件夹就是完整 agent 包。
