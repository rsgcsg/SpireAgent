# LLM Bridge

默认情况下，agent 不调用 LLM；它完全用本地规则跑。要让 Codex 或其他 LLM 在关键节点介入，可以使用 bridge 模式。

## When LLM Is Asked

本地评分会在这些情况请求 LLM：

- 抓牌、地图、商店、事件等战略节点。
- 本地最高分与第二名差距很小。
- 本地置信度低。
- 战斗进入生死局。
- 存在复杂 combo、抽牌、回能、消耗、状态牌处理。

每个 tick 最多一次 LLM 请求。

如果 LLM 没有配置、超时、输出非法 JSON、或返回了不存在的 `candidateId`，agent 不会崩溃，也不会执行未验证动作；它会进入本地 fallback，并在 tick 输出和 decision log 中记录原因。

fallback 分两层记录：

- `fallbackReason`：为什么没用上 LLM，例如 `llm_unavailable`、`llm_invalid_choice`、`llm_timeout`。
- `fallbackPolicy`：本地代替 LLM 时采用的策略。普通情况是 `local_top`；高压战斗会进入 `conservative_combat` 复核，疑似斩杀保留攻击，否则优先选择更安全的格挡/保命候选。

## Command

```bash
npm run agent:run:bridge -- --max-ticks 500 --delay-ms 120
```

这个命令等价于设置：

```bash
STS2_LLM_COMMAND="node scripts/llm-bridge-decider.mjs"
STS2_LLM_TIMEOUT_MS=300000
STS2_LLM_BRIDGE_TIMEOUT_MS=300000
```

## Bridge Files

默认目录：

```text
/tmp/sts2-llm-bridge/
```

当 agent 需要 LLM 时，bridge 会写：

```text
latest-request.json
request-<id>.json
pending-id.txt
```

LLM 或人工需要读取 `latest-request.json`，然后写：

```text
response-<id>.json
```

响应格式：

```json
{
  "candidateId": "card-reward-1",
  "confidence": 0.72,
  "reason": "补防御和抽牌",
  "memoryUpdates": {
    "strategicDirection": ["早期补防御"],
    "riskFlags": ["避免低血进精英"],
    "deficits": {
      "block": 0.65,
      "draw": 0.55
    }
  }
}
```

`candidateId` 必须来自 request 的 `parsedPrompt.candidates[].id`。

## Fallback And Audit

新 decision log 会记录：

```json
{
  "route": "llm_required",
  "fallbackReason": "llm_unavailable",
  "fallbackPolicy": {
    "name": "conservative_combat",
    "originalCandidateId": "play-0-ENEMY_0",
    "selectedCandidateId": "play-1",
    "reasons": ["当前为高压或接近生死回合"]
  },
  "llm": {
    "wanted": true,
    "called": false,
    "available": false,
    "outcome": "unavailable",
    "promptBytes": 1234,
    "candidatesSent": 5
  }
}
```

常见 outcome：

- `selected`：LLM 返回了合法候选并被采用。
- `unavailable`：没有配置 `STS2_LLM_COMMAND`。
- `disabled_by_tick_limit`：本 tick 不允许调用 LLM。
- `timeout`：外部 LLM 命令超时。
- `invalid_output`：输出不是合法 JSON 或缺少 `candidateId`。
- `invalid_choice`：`candidateId` 不在本 tick 候选里。
- `error`：其他外部命令错误。

`npm run agent:review` 会聚合 LLM wanted/called/fallback 统计；`npm run agent:review -- --full` 会输出完整 run memory。

## Manual Response Example

```bash
node - <<'NODE'
const fs = require('fs');
const req = JSON.parse(fs.readFileSync('/tmp/sts2-llm-bridge/latest-request.json', 'utf8'));
fs.writeFileSync(req.responsePath, JSON.stringify({
  candidateId: 'card-reward-0',
  confidence: 0.75,
  reason: '当前缺防御，选择低费防御牌。'
}) + '\n');
NODE
```

## Notes

- LLM 不能自由调用游戏工具，只能从候选动作里选一个。
- LLM 的 `memoryUpdates` 会保守写入本局记忆。
- 参数建议不会自动大幅改权重；局后 reward 机制负责小幅学习。
