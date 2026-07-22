# MCP / REST Usage

这个 agent 默认通过 STS2 MCP mod 的 localhost REST API 玩游戏。MCP server 是给支持 MCP 的 AI 客户端直接调用工具用的；本包不包含 MCP server 代码，只说明如何配合外部 MCP 项目使用。

## Required External Service

启动游戏并加载 STS2 MCP mod 后，应能访问：

```bash
curl -s http://localhost:15526/
```

正常返回类似：

```json
{"message":"Hello from STS2 MCP ...","status":"ok"}
```

如果连接失败，通常是游戏没启动、mod 没启用，或 mod 没正确安装。

## REST API Used By This Agent

读取状态：

```bash
curl -s 'http://localhost:15526/api/v1/singleplayer?format=json'
```

执行动作：

```bash
curl -s -X POST 'http://localhost:15526/api/v1/singleplayer' \
  -H 'Content-Type: application/json' \
  -d '{"action":"end_turn"}'
```

常用动作：

```json
{"action":"menu_select","option":"singleplayer"}
{"action":"menu_select","option":"DEFECT"}
{"action":"menu_select","option":"embark"}
{"action":"choose_map_node","index":0}
{"action":"play_card","card_index":2,"target":"ENEMY_ID_0"}
{"action":"play_card","card_index":3}
{"action":"end_turn"}
{"action":"use_potion","slot":0,"target":"ENEMY_ID_0"}
{"action":"claim_reward","reward_index":1,"index":1}
{"action":"select_card_reward","card_index":0}
{"action":"skip_card_reward"}
{"action":"choose_rest_option","index":0}
{"action":"proceed"}
{"action":"choose_event_option","index":0}
{"action":"shop_purchase","index":0}
{"action":"select_bundle","index":0}
{"action":"confirm_bundle_selection"}
{"action":"cancel_bundle_selection"}
```

## MCP Tool Names

如果你使用外部 `mcp/server.py`，常用单人工具包括：

- `get_game_state(format)`
- `menu_select(option, seed?)`
- `combat_play_card(card_index, target?)`
- `combat_end_turn()`
- `use_potion(slot, target?)`
- `discard_potion(slot)`
- `rewards_claim(reward_index)`
- `rewards_pick_card(card_index)`
- `rewards_skip_card()`
- `map_choose_node(node_index)`
- `rest_choose_option(option_index)`
- `proceed_to_map()`
- `event_choose_option(option_index)`
- `shop_purchase(item_index)`

## Important Gameplay Calling Rules

- 战斗后 `combat_end_turn` 之后，可能需要再读状态一次或两次，等敌方回合结算和玩家新回合出现。
- 打牌会移除手牌并导致索引左移。连续打牌时优先从右到左，或每打出一张后重新读状态。
- 单体牌必须带 `target`。敌人 id 通常是大写蛇形并带 `_0` 后缀。
- 奖励建议从右到左领取，避免索引位移。
- 卡牌奖励打开子界面后，用 `rewards_pick_card` 或 `rewards_skip_card`。
- 药水 `slot` 是药水栏位，不是手牌下标。
- 休息点、事件、商店、宝箱后通常需要 `proceed_to_map` 或 `proceed`。

## Agent Client Configuration

默认 API 地址：

```bash
export STS2_API_URL=http://localhost:15526
```

如果 mod 使用了其他端口，设置 `STS2_API_URL` 后再运行：

```bash
npm run agent:run
```
