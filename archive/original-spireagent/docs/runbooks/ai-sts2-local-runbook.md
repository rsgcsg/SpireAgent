# 在这台电脑上用 AI 跑《杀戮尖塔 2》

这份文档记录的是当前这台 Mac 上已经跑通的 STS2 MCP 使用方式。目标是：打开游戏后，让 Codex/Claude 这类 AI 通过本地 MCP 或 REST API 读取游戏状态、选择地图、打牌、领奖励，并持续推进一局《Slay the Spire 2》。

## 当前本机环境

- 项目目录：`/Users/fire/STS2MCP`
- MCP 配置文件：`/Users/fire/STS2MCP/.mcp.json`
- MCP Python 服务目录：`/Users/fire/STS2MCP/mcp`
- `uv` 路径：`/opt/homebrew/bin/uv`
- 游戏默认 Steam 目录：
  `~/Library/Application Support/Steam/steamapps/common/Slay the Spire 2`
- macOS 模组目录：
  `~/Library/Application Support/Steam/steamapps/common/Slay the Spire 2/SlayTheSpire2.app/Contents/MacOS/mods`
- 当前已安装的模组文件：
  - `STS2_MCP.dll`
  - `STS2_MCP.json`
  - `STS2_MCP.conf`
- 本地 HTTP API：`http://localhost:15526`
- 当前验证到的接口版本：`Hello from STS2 MCP v0.4.0`

## 启动流程

1. 打开 Steam 里的《Slay the Spire 2》。
2. 确认游戏设置里已经启用 Mods，并且 `STS2_MCP` 模组处于启用状态。
3. 启动或进入一局游戏。
4. 在终端或 AI 会话里进入项目目录：

```bash
cd /Users/fire/STS2MCP
```

5. 验证模组 HTTP 服务是否可用：

```bash
curl -s http://localhost:15526/
```

正常会返回类似：

```json
{
  "message": "Hello from STS2 MCP v0.4.0",
  "status": "ok"
}
```

如果返回 `Connection refused`，通常说明游戏没开、模组没启用，或者模组没有正确加载。

## MCP 配置

当前项目根目录的 `.mcp.json` 已经配置好：

```json
{
  "mcpServers": {
    "sts2": {
      "command": "/opt/homebrew/bin/uv",
      "args": [
        "run",
        "--directory",
        "/Users/fire/STS2MCP/mcp",
        "python",
        "server.py"
      ]
    }
  }
}
```

如果 AI 客户端支持项目级 MCP，打开 `/Users/fire/STS2MCP` 这个目录后，它应该能发现 `sts2` MCP server。重启 AI 会话后，可以让 AI 调用：

- `get_game_state(format="json")`
- `combat_play_card(card_index, target)`
- `combat_end_turn()`
- `map_choose_node(node_index)`
- `rewards_claim(reward_index)`
- `rewards_pick_card(card_index)`
- `rewards_skip_card()`
- `rest_choose_option(option_index)`
- `proceed_to_map()`
- `event_choose_option(option_index)`
- `use_potion(slot, target)`

完整工具表见 `mcp/README.md`。

## REST API 兜底用法

有时当前 AI 会话没有直接暴露 `mcp__sts2__...` 工具，但只要游戏里的模组 HTTP 服务在跑，仍然可以用 `curl` 直接控制游戏。

读取单人游戏状态：

```bash
curl -s 'http://localhost:15526/api/v1/singleplayer?format=json'
```

读取地图、事件等概览时也可以用 markdown：

```bash
curl -s 'http://localhost:15526/api/v1/singleplayer?format=markdown'
```

发送动作：

```bash
curl -s -X POST 'http://localhost:15526/api/v1/singleplayer' \
  -H 'Content-Type: application/json' \
  -d '{"action":"end_turn"}'
```

常用 REST 动作示例：

```bash
# 选地图节点
curl -s -X POST 'http://localhost:15526/api/v1/singleplayer' \
  -H 'Content-Type: application/json' \
  -d '{"action":"choose_map_node","index":0}'

# 打牌，单体牌必须带 target
curl -s -X POST 'http://localhost:15526/api/v1/singleplayer' \
  -H 'Content-Type: application/json' \
  -d '{"action":"play_card","card_index":2,"target":"SOUL_FYSH_0"}'

# 打无目标牌，例如防御或状态牌
curl -s -X POST 'http://localhost:15526/api/v1/singleplayer' \
  -H 'Content-Type: application/json' \
  -d '{"action":"play_card","card_index":3}'

# 结束回合
curl -s -X POST 'http://localhost:15526/api/v1/singleplayer' \
  -H 'Content-Type: application/json' \
  -d '{"action":"end_turn"}'

# 使用药水，slot 是药水栏位，不是手牌下标
curl -s -X POST 'http://localhost:15526/api/v1/singleplayer' \
  -H 'Content-Type: application/json' \
  -d '{"action":"use_potion","slot":0,"target":"SOUL_FYSH_0"}'

# 选休息点选项
curl -s -X POST 'http://localhost:15526/api/v1/singleplayer' \
  -H 'Content-Type: application/json' \
  -d '{"action":"choose_rest_option","index":0}'

# 继续到地图
curl -s -X POST 'http://localhost:15526/api/v1/singleplayer' \
  -H 'Content-Type: application/json' \
  -d '{"action":"proceed"}'

# 选择卡牌奖励
curl -s -X POST 'http://localhost:15526/api/v1/singleplayer' \
  -H 'Content-Type: application/json' \
  -d '{"action":"select_card_reward","card_index":1}'
```

## 让 AI 接手游玩

最简单的方式是在 `/Users/fire/STS2MCP` 目录里打开 AI 会话，然后说：

```text
继续玩
```

或者更明确一点：

```text
用 STS2 MCP 继续跑当前杀戮尖塔 2 存档。战斗中用 json 状态，地图和事件可以用 markdown。注意手牌索引会移动，出牌后要重新读状态。
```

AI 应该先读取当前状态，再根据状态决定出牌、选路、领奖励和休息。当前仓库的 `AGENTS.md` 已经写了基础策略和关键坑点，建议让 AI 遵守它。

## 游玩时最重要的注意事项

### 状态轮询

结束回合后，游戏状态可能短暂显示 `is_play_phase: false` 或敌方回合。需要再次调用 `get_game_state` 或 REST `GET /api/v1/singleplayer?format=json`，有时要读两次，才能看到新的玩家手牌。

### 手牌索引会移动

打出一张牌后，它会从手牌移除，后面的牌下标都会左移。安全做法：

- 多张牌都要打时，尽量从右往左打，也就是先打高下标。
- 任何抽牌、消耗、丢弃、发现牌之后，都重新读取状态。
- 单体攻击必须带 `target`。
- 敌人 ID 通常是大写蛇形命名加 `_0`，例如 `SOUL_FYSH_0`、`KIN_PRIEST_0`。

### 奖励、事件、休息点

- 奖励列表也会因为领取而移动，领取多个奖励时从右往左拿。
- 卡牌奖励会进入子界面，需要选择卡或跳过。
- 事件选完选项后，经常还要点一次 `Proceed`。
- 休息点选完休息或锻造后，通常还要 `proceed_to_map` 或 REST 的 `proceed`。

### 药水

- `slot` 是药水栏位，不是手牌下标。
- 药水不耗能量，也不算打牌。
- Buff 药水要在攻击牌前用。
- boss 战不要囤药水。

## 当前打牌策略简版

- 不攻击的敌人回合，优先输出，不要浪费能量堆没用的格挡。
- 能斩杀就不防御。
- 多数情况下先打 0 费工具牌，再打技能，再打攻击。
- 有易伤、力量、临时伤害时，把大攻击放到后面吃收益。
- boss 战要更保守地计算后续伤害，特别是带状态牌、易伤、力量成长的 boss。
- 卡牌奖励不要无脑拿，烂牌会稀释牌组。

## 常见问题

### `curl http://localhost:15526/` 连接失败

检查：

- 游戏是否正在运行。
- Mods 是否在游戏设置里启用。
- `STS2_MCP.dll` 和 `STS2_MCP.json` 是否在 macOS app bundle 的 `Contents/MacOS/mods/` 下。
- 是否需要重启游戏让模组重新加载。

### AI 看不到 MCP 工具

可以先不用 MCP 工具，直接让 AI 通过 REST API 控制：

```text
当前会话没有 sts2 MCP 工具时，请用 curl 调 http://localhost:15526/api/v1/singleplayer?format=json 读取状态，并用 POST /api/v1/singleplayer 执行动作。
```

同时检查 `.mcp.json` 是否仍然存在，并确认 `command` 指向 `/opt/homebrew/bin/uv`。

### GUI 客户端找不到 `uv`

macOS GUI 程序经常拿不到 shell 的 `PATH`。这台机器已经在 `.mcp.json` 里使用绝对路径 `/opt/homebrew/bin/uv`，不要改成裸 `uv`，除非确认客户端能找到它。

### 打错牌或目标错误

通常是因为索引移动或目标 ID 错。解决方式是马上重新读取状态，不要继续按旧索引出牌。战斗中优先用 `format=json`，因为里面有每张手牌的 `index`、`can_play`、`target_type` 和敌人的 `entity_id`。

## 本机重新构建和安装模组

如果更新了 C# 模组代码，需要重新构建并复制到游戏目录。macOS 上可参考：

```bash
cd /Users/fire/STS2MCP

export DOTNET_ROOT="/opt/homebrew/opt/dotnet@9/libexec"
export PATH="$DOTNET_ROOT:$PATH"

dotnet build STS2_MCP.csproj -c Release -o out/STS2_MCP \
  -p:STS2GameDir="$HOME/Library/Application Support/Steam/steamapps/common/Slay the Spire 2"

GAME_DIR="$HOME/Library/Application Support/Steam/steamapps/common/Slay the Spire 2"
MODS_DIR="$GAME_DIR/SlayTheSpire2.app/Contents/MacOS/mods"
mkdir -p "$MODS_DIR"
cp out/STS2_MCP/STS2_MCP.dll "$MODS_DIR/"
cp mod_manifest.json "$MODS_DIR/STS2_MCP.json"
```

复制后重启游戏，再用：

```bash
curl -s http://localhost:15526/
```

确认服务正常。

## 参考文件

- `README.md`：项目原始安装、构建和 MCP 配置说明。
- `mcp/README.md`：MCP 工具列表。
- `AGENTS.md`：AI 游玩策略和操作注意事项。
- `.mcp.json`：本机项目级 MCP server 配置。
