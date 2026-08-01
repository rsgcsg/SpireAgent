# Connector V3 阶段与人类式信息架构复审

日期：2026-08-01  
源码基线：`connectorV3@9a9546813566dd9e2e0460553de20a0cdc308cc2` 加本轮未提交修复  
协议：`3.0-preview.1`

> 后续状态：`run-20260801111449-8oze2o` 已完成 176 个命令和完整跑局边界；
> menu direct consumer、menu/generated V3-native cutover 已进入当前源码。
> 本文以下 51-action/menu-adapter 描述保留为当时审计基线，不是最新状态；
> 当前事实见 `docs/current/STATUS.md`。

## 结论

V3 已经不是 DTO 或 MCP 包装原型，而是可运行的纵向 Connector：真实 Re
运行使用了 V3 observation、参数化 command、native Commit、receipt 和 successor，
并在一个 exact runtime 中连续完成了 51 个动作。它仍不是最终形态，主要缺口不是
再增加一个事务框架，而是删除三个迁移耦合：Re 的 V2 semantic normalizer/
`legal_actions[]` 投影、尚未迁移的 Provider binding family，以及 V3 缺失的 linked
detail/Inspection 合同。当前环境也只有 session trial，没有 durable qualification。

架构判决是保留并收紧 ADR-0007 的 Semantic Gateway 双平面，不另建 V4：

```text
Native STS2
-> complete player-visible observation
-> one current interaction and owner
-> parameterized exact command binding
-> execute-time native validation and Commit
-> action-local receipt and successor
-> direct V3 Re consumer

Side plane: exact environment, trial, quarantine, evidence, qualification, rollback
```

## 当前真实阶段

已实现并有当前运行证据：

- exact state/interaction/entity binding；
- single writer、idempotent request、unknown-no-retry；
- combat 与多个普通非战斗 family 的 V3-native resolver；
- Re 的 V3 observation/command/receipt 主路径；
- 可见但 unsupported 的 typed observation；
- exact game/Gateway/Modset/runtime 身份和 session trial。

仍是迁移债或 evidence gap：

- Re 将 V3 candidate 临时展开为 V2-shaped `legal_actions[]`，再进入 V2
  semantic normalizer；
- `/api/v2/capabilities` 仍作为 same-runtime、non-authorizing sidecar；
- menu、generated choice 和部分 selector 仍使用内部 Provider native binding
  adapter；
- V3 `linked_detail_kinds` 和 V3-native Inspection 仍为空；
- 当前 exact environment 没有 persistent claim，跨版本/Mod 的通用自动适配也未被
  一次更新证明。
- machine clean-closure inventory 仍报告 38 个 V2 fallback authority contracts；
  这些是明确迁移债，不是 V3 支持能力。

因此不能用 operation 数量或一次长跑声称 V3 完成。短期完成标准是 direct V3 Re
consumer、ordinary vanilla family 无 V2 mutation dependency、玩家可见信息合同闭合、
以及 exact-runtime journey 和 authority lifecycle 各自有证据。

## 最新运行反例

`run-20260801104256-1qtr0a` 在 exact runtime
`0d517090cd3f4a10a2d844e423f01e5f` 完成 51 个 mutation，包括 V3-native shop card
和 potion purchase。第 52 个 shop close 在 Commit 前被拒绝：候选把
`close_shop_inventory` 映射为 `cancel_interaction`，但 operand builder 只给
`activate_control` 加 `control_id`，执行 resolver 又正确要求精确 close control。

`run-20260801104619-bh39g3` 随后观察到同一仍打开的商店。Gateway 诚实保留完整
shop facts，并仅发布仍获 operation authority 的 purchase candidate；Re 的 V2
validator 却要求每个可见可操作项都有 action，于是把有效 V3 state 判为 invalid。

这不是两个 shop 特例，而是一个架构事实：

```text
player-visible fact != observed fact != published command != granted authority
```

本轮修复为 cancel control 增加精确语义 operand，并让 V3 迁移投影可声明
`authority_filtered` action coverage。已发布 action 仍需 exact binding，原生 V2 输入
仍要求完整 action coverage。此修复是迁移桥，不是保留 V2 normalizer 的理由；其他
family 若再出现同类问题，应优先推进 direct V3 consumer，而不是逐项放宽 V2 规则。

## 对附件信息架构的判决

接受：

- persistent HUD、完整 current surface、linked detail、on-demand Inspection 是合理的
  信息分层；
- 当前 surface 的决策关键事实不能为了 token 压缩而省略；
- omission、unavailable、hidden、failed 和 stale 必须显式区分；
- 信息投影、模型是否收到和 mutation authority 必须正交；
- shared state 中长期描述应逐步变成 summary + state-bound detail reference，牌组数量
  应成为 persistent summary 候选。

修改：

- `semantic_accessibility.tools` 应继续作为主线 A 的默认高效读取语义，而不是被视为
  次等兼容模式；它必须只返回正常玩家可通过当前 UI 获得的信息，并保留来源、
  availability 和 staleness。
- `human_play.strict` 可以作为可选 evidence/profile，用于需要验证真实页面打开、owner
  handoff 或 UI 生命周期的场景，但不应成为每次 Agent 决策的默认路径。

拒绝：

- 默认强制真实打开 deck/pile/map 等页面。打开页面会改变 input owner、增加异步和
  stale 风险，并把只读查询变成控制流 mutation；它没有证明能提升 A 的长跑可靠性。
- 现在先建设万能 Fact/Visibility Framework 或任意 component bag。先交付有限 typed
  summary、detail 和 Inspection kind；只有多个真实 consumer 重复证明需要时再抽象。
- 把 relic/card 示例、攻略或外部知识放进 Gateway。Gateway 只提供当前玩家可见游戏
  事实；用法示例属于 Agent knowledge/retrieval，不属于 STS2 truth。

## 唯一推进顺序

1. 关闭本轮 shop publication/execution parity 与 partial-authority projection 缺陷，取得
   新 artifact 的 exact-runtime close/proceed evidence。
2. 建立 direct V3 Re normalizer/action projection，先迁移 shop 与一个 combat/non-combat
   相邻 family，删除对应 V2 semantic/action validation dependency；不要在 Re 重算
   affordability、legality 或 completion。
3. 迁移剩余 ordinary Provider binding family，并在每个 cutover 后删除旧 execution path。
4. 实现有限 V3-native linked detail 与 read-only Inspection：persistent summary、current
   complete surface、detail catalog、inspection catalog 分开，全部 state-bound 且
   non-authorizing。
5. 删除 V2 capabilities sidecar，收缩 authority 到 V3 supported/trial/quarantined/
   unsupported 投影；最后用 journey、restart、wrong-environment、revoke/rollback 证据
   决定 V2 production retirement。

## Non-claims

- 本轮 fixture、replay、测试和新 Release 不能证明新 artifact 已 loaded 或 shop close 已
  Live 修复。
- 一次 exact-runtime 长跑不证明 Kifuda、所有 selector、跨版本或 bounded Mod 适配。
- V3 仍未达到“所有正常玩家可见详情均可按需取得”。
