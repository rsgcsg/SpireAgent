# 工作流 C-R1 短期完成合同与架构复审

> 状态：已接受的 C 短期收口合同，不授予任何运行权限  
> 基线：`develop@bf37ee09a58bc7a236a732415e14255236c998b4`  
> 日期：2026-07-29  
> 详细运行身份仍以 `docs/current/STATUS.md` 和
> `STS2MCP/docs/bridge-v2/CURRENT_STATUS.md` 为准。

## 1. 执行裁决

工作流 C 不需要另一套目标架构。唯一目标仍是 ADR-0002 的 A-first
Semantic Gateway 双平面架构，并受 ADR-0003、ADR-0004 和 Bridge ADR-0005
约束。C-R1 是这套架构的有界完成合同，不是新的 Gateway、第三个权限系统、
万能事务层或游戏规则引擎。

C-R1 的短期产品结果定义为：

> 在一个明确的 vanilla 普通单人支持范围内，Re 能仅依赖 Gateway 的完整、
> 一致、可审计事实和 opaque action，反复完成一局；普通玩家可检查的高价值
> 信息具有正式只读入口；新版本可以保留诊断观察并局部重验；未知来源、未知
> 结果和范围外流程具有可归因的 Fail Closed，而不是 silent fallback。

这比“偶尔能跑完一局”严格，但不等于全游戏、全 Mod、全版本、全百科或公共
SDK 完成。达到 C-R1 后，C 从主动扩建主线转为由真实 A blocker、游戏更新和
有界覆盖需求驱动的维护轨道。

## 2. 证据边界

### 2.1 已确认的当前事实

- Gateway v1 mutation 已退休，Re 只选择 Gateway 当前发布的 action ID。
- Preview.72 已有多个相同精确游戏版本下的长旅程证据，并覆盖 menu、map、
  combat、reward、event、rest、shop、selector 和 game-over。
- 这些运行证明普通 loop 和若干具体事务可用，不证明全部玩家可见信息、跨版本
  兼容、策略质量或持久资格。
- 当前 Inspection catalog 只有 `run_deck`、`combat_piles`、`shop_catalog`；
  当前加载环境仍未启用 Inspection。
- `surface_kind + operation` 仍是当前 mutation permission lookup key；
  native contract identity 和 semantic/authority identity 仍处于 shadow/迁移状态。
- exact environment、session trial、quarantine、persistent package、revoke、
  supersede 和 rollback 已有实际代码与测试，但数量不是 C 完成指标。

### 2.2 2026-07-29 新运行证据

当前精确 Preview.72 运行：

| Run | 结果 | 证据结论 |
|---|---|---|
| `run-20260728143604-oklaik` | Rest 后 `executed_unsettled` | 原生 Rest 已成功；Stone Humidifier 使最终 HP 高于 Gateway 预测的基础治疗值。旧 Witness 错把基础治疗结果当作完整最终状态。 |
| `run-20260728144125-xvgvhc` | Rest Surface `not_executed_invalid_state` | 前一 unknown 正确 quarantine 了 mutation scope；Gateway 随后错误地把当前语义 owner 从 `bridge_owned` 改成 `none_fail_closed`。 |
| `run-20260728144341-2c4ij1` | 重复同一 invalid state | 证明这不是 Provider 或策略偶发错误，而是权限投影与 Surface owner 边界错误。 |

这些记录具有当前精确 Gateway/game/Modset 身份和 Re source digest，但
provenance 是 `unrecorded`。它们是高质量 defect/coverage evidence，不是
Organic qualification 或 persistent qualification。

### 2.3 仍未取得的证据

- Preview.72 当前 source 修复后的新 DLL 尚未构建、安装或加载。
- 当前 build 的 Inspection-enabled 完整旅程尚未发生。
- Hefty Tablet select/skip、actionless generated settling、Crystal Sphere、
  standalone potion discard 和若干非标准流程仍缺自然证据或实现。
- arbitrary Mod、multiplayer 和未来 STS2 版本没有兼容声明。

## 3. 对两份 C-R1 参考文档的批判

### 3.1 接受

- C 必须有可停止、可验收的短期完成线。
- 决策事实、Inspection、linked detail、动作权限和完成语义必须正交。
- runtime instance 优先于 game-native definition；外部 reference 只能补充，
  不得参与 action identity、合法性或 completion。
- 已证明相同 topology 的 generated choice 应迁入 sealed source registry，
  未证明的新 owner、participant、Commit 或 result topology 仍需代码和证据。
- 新版本应做 component/family 级影响分析，而不是永久全开或整体失明。
- Projection 与 action-local Outcome 必须消费同一组 canonical native facts。

### 3.2 修正

- “所有 card/relic/potion/power/keyword/enchantment/orb/map detail 都完成”
  不是短期单一硬门。C-R1 Core 要求当前决策所需和正常 UI 可检查的高价值族
  具有 typed coverage；低价值百科和未出现族可明确 deferred。
- full operation authority retirement 不能在 dual-read、publication parity、
  execute parity、quarantine parity 和 rollback 证据不足时强切。它属于
  conditional migration closure。
- semantic/authority identity 不能为了 schema 整齐而提前切换。Bridge
  ADR-0005 的 promotion gate 继续有效。
- richer receipt 只能在它能实际改善 Re supervisor 的停止、恢复或诊断时进入
  wire；否则保持 action-local内部 evidence。
- Spire Codex、detached upgrade preview、静态 compendium 和图片资源是可选
  enrichment，不得成为 Gateway 启动、动作权限或 C-R1 完成依赖。
- “自动适配”最多自动发现、分类、生成候选和安排证据；静态相似、一次成功或
  manifest 命中都不能自动变成跨环境持久权限。

### 3.3 拒绝

- universal selector、universal transaction、Effect DSL 或任意反射查询。
- 为证明自动化而在 Gateway 外重建 STS2 规则和最终效果。
- 以 Surface 数、operation 数、package 数或单次胜利代替旅程可靠性。
- 将 current semantic owner 与 mutation grant 合并成一个布尔权限。
- 把 unavailable detail 写成空数组，或把 unobserved 写成 absent。

## 4. 唯一目标架构

```text
Native STS2
  -> Semantic Gateway Live Plane
       coherent Observation Envelope
       one semantic/input owner
       bounded native adapters
       exact state-bound actions
       execute-time revalidation
       game-owned Commit
       action-local Outcome
       read-only Inspection/detail
  -> Semantic Gateway Control Plane
       exact environment identity
       source/adapter/outcome inventory
       trial, quarantine, claim and rollback
       non-authorizing evidence and impact reports
  -> versioned REST contract
  -> Re-SpireAgent
       strict decode and full evidence record
       deterministic consumer projection
       advertised action selection
       transition supervision and replay
```

两个平面不是两个权限源。Live plane 是唯一 observation 和 mutation 路径；
Control plane 可以建议、记录和验证，但 Gateway 在发布和执行时作最终决定。

### 4.1 必须保持分离的状态

| 概念 | 含义 | 不等于 |
|---|---|---|
| semantic Surface | 当前玩家正面对的有业务意义的输入界面 | mutation 已获准 |
| input owner | 当前 UI 谁拥有输入 | 当前一定有 legal action |
| mutation permission | 当前精确 operation 是否可发布和执行 | Surface 是否存在 |
| readiness | 当前是否可动作、settling 或 blocked | support/qualification 总结 |
| Inspection availability | 当前只读详情是否可请求 | action authority |
| Outcome | 本次 action 已经证明的最小语义后果 | 整个游戏最终状态预测 |

Rest defect 是这一分离的直接证据：Rest Surface 在 quarantine 后仍真实存在且仍是
唯一语义 owner，但 mutation action 可以全部被抑制。Stone Humidifier defect
则证明 Outcome 只应验证本次 Rest 的原生最低后果和流程推进，不能声明拥有
所有遗物副作用的最终 HP。

## 5. C-R1 范围

### 5.1 Core 必须完成

1. **普通 vanilla 单人 support envelope**
   - 每个自然可达高频 family 标记为 `supported_exact`、
     `typed_unsupported`、`deferred_with_reason` 或 `out_of_scope`。
   - 不允许 silent fallback 或 Re-side legality reconstruction。
2. **旅程可靠性**
   - 多个有 provenance 的 fresh/resumed 单人旅程。
   - ordinary flow 几乎总能完成一局或在精确 typed 边界停止。
   - stale 在 mutation 前拒绝；unknown mutation 不重试。
3. **决策真值与 owner**
   - Surface、owner、readiness、permission 和 Outcome 明确分离。
   - 当前可见事实不因 operation quarantine 而被伪装成 unsupported。
4. **Core Inspection**
   - 当前 build 上 `run_deck`、`combat_piles`、`shop_catalog` 可用。
   - 至少 card/relic/potion/current-preview 的决策关键详情具有 bounded、
     read-only、state-aware 合同和明确 availability。
   - `empty`、`not_applicable`、`not_observed`、`available_on_request`、
     `unavailable`、`hidden`、`read_failed`、`stale` 不互相冒充。
5. **适配与权限恢复**
   - exact identity、component impact、diagnostic observation、session trial、
     quarantine、persistent claim、revoke、supersede 和 rollback 可重复验证。
   - 未知 source 只影响其精确 family/Surface，除非 identity 本身不可信。
6. **开发与运维闭环**
   - 单一命令入口覆盖 inspect/test/build/install/verify/run/status/rollback。
   - build、installed、loaded SHA/MVID 和 evidence provenance 分开报告。
7. **合同冻结**
   - observation、Inspection/detail、opaque action、minimum receipt、typed
     unsupported、compatibility metadata 和 error taxonomy 版本化并被 C#/Re
     fixture 机械检查。

### 5.2 Conditional Migration Closure

只有证据门通过才完成：

- supported family 从 operation lookup 迁到 native source/adapter/outcome claim；
- semantic identity 与 authority projection identity 正式切换；
- richer receipt/witness fields 进入公开 wire；
- 已有 source-specific Provider 分支迁入 registry 并删除旧路径。

未通过时必须保留可回滚的旧 authority key，但不得继续叠加第二套生产权限系统。

### 5.3 Optional Enrichment

不阻塞 C-R1：完整 compendium、Spire Codex、detached preview、图片、任意 Mod、
multiplayer、Daily/Custom、public SDK、Companion、Headless、stable memory 和
learning。

## 6. 实施顺序

### R1.0 合同与证据收口

- 发布本合同并同步 Status、Roadmap、Program Plan 和文档入口。
- 把最新三次 run 的 Rest/owner 根因写入 component current status。
- 修复 Rest minimum Outcome 和 semantic-owner/mutation-permission 边界。

退出：C#/Re fixture、测试、Release build 通过；新 DLL 安装并核对身份；等待
精确 Live canary，不把安装冒充加载。

### R1.1 Core Inspection 与 availability

- 先重新资格化现有三个 Inspection，不先发明新框架。
- 从真实 A Prompt 缺口选择 card/relic/potion/current-preview 详情。
- Catalog 声明 source、scope、state binding、availability、completeness 和
  hidden policy；detail response 不进入 command ledger。

退出：同一状态的完整 observation 与按需 detail 可一致读取，stale detail 被
拒绝，Inspection-enabled journey 不改变 action authority。

### R1.2 普通单人 family closure

- 关闭自然阻塞：Crystal Sphere、standalone potion discard 和重复出现的
  generated/selector 变体。
- 明确 skip、full-hand、cancel、empty-result、continuation handoff 的 family
  状态。
- Tutor 若源码确认只涉及非单人 ownership，移出 C-R1 blocker。

退出：support envelope 每个范围内 family 有 typed row 和证据等级。

### R1.3 数据驱动 source 适配

- 复用 combat-pile sealed registry 的成功模式，而不是造 universal selector。
- 迁移已经证明共享 owner/participant/Commit/Outcome topology 的 generated
  sources；unknown source fail closed。
- Workbench 只生成候选、差分、negative fixture 和 evidence plan，不授权。

退出：至少一个新来源仅增加数据和证据即可接入；至少一个新 topology 被正确
分类为 `code_required`。

### R1.4 版本、权限与恢复验收

- 对两个精确环境或可控差分 fixture 运行 component impact。
- 验证 observation、trial、quarantine、persistent claim、expiry、revoke、
  supersede、wrong-environment reject 和 rollback。
- 验证 external reference mismatch 只降级 enrichment。

退出：新环境不继承旧权限，但不相关变化不使全部诊断观察失明。

### R1.5 Conditional cutover 与最终冻结

- 逐 family 通过 ADR-0003/Bridge ADR-0005 的 dual-read 和 parity gate。
- 只删除已经迁移且有 rollback 的旧路径。
- 运行多次 provenance journey，包括至少一次 Inspection-enabled run。

退出：发布独立 migration closeout；若 gate 不通过，C-R1 Core 仍可完成，但
保留的旧 key 必须被明确标为 constrained rollback debt。

## 7. 可测量验收

| 维度 | Core 退出证据 |
|---|---|
| 普通旅程 | 多次 fresh/resumed、有 provenance、到 game-over/menu 或 typed supported boundary；不以单次胜利为指标 |
| 动作正确性 | published action precision、pre-execution stale rejection、unknown-no-retry、semantic successor |
| 信息 | Core Inspection 可用；关键详情 availability/omission 可区分；无 hidden RNG/draw order |
| 可维护性 | 新已知 source topology 可数据接入；新 topology 明确 `code_required`；无 silent fallback |
| 版本恢复 | exact diff、trial/quarantine、claim lifecycle、wrong-environment rejection、rollback 可复现 |
| A 消费 | Re 不读取 qualification history 决策，不重建严格合法性，完整 evidence 保留 |
| 运维 | fresh clone 的 build/install/verify/run/rollback 文档和命令自洽 |

“Provider 数”“Surface 数”“operation 数”“qualification 数”“Prompt 更短”或
“一次 canary 成功”都不是单独完成证据。

## 8. 回滚与停止规则

- 每个运行行为切片保留前一 DLL deployment snapshot。
- 新 contract 先有 cross-language fixture；authority identity 先 shadow/dual-read。
- unknown outcome、identity drift、owner ambiguity 或 contradictory evidence 立即
  quarantine 精确 scope，不自动重试。
- 如果某个 optional detail 只能通过隐藏信息、任意反射或第二规则引擎获得，
  将其标记 unsupported/deferred，而不是扩大 Gateway 权限。
- C-R1 完成后，只有自然 A blocker、游戏更新或已批准 support-envelope 变化才能
  重开主动 C 扩建。

## 9. 当前执行状态与立即工作

已完成：

1. Rest Outcome 改为“native base-heal minimum + option progression”，避免
   合法 relic side effect 造成 false unknown。
2. blocked Surface 保留 `bridge_owned` semantic owner、抑制 mutation actions，
   Re 合法投影为 `non_actionable`。
3. Preview.73 cross-language 测试、Release 构建、备份安装、冷加载和严格 Re
   只读解码完成。最终 loaded SHA 为 `f6b2d268...151b18`，MVID 为
   `f67e272a...4c8a`。

仍待完成：

1. 在普通长跑中自然触发 Rest minimum-Outcome canary；失败不得重试 unknown
   action。
2. 自然验证 quarantined operation 的 blocked-owner 投影；不得人为制造 rare
   state 只为通过阶段。
3. 两项 canary 收口后进入 R1.1；不得因本次两个修复宣称 C-R1 已完成。

## 10. Non-Claims

本合同和本次文档同步不证明任何新代码、安装、加载、canary、Organic、持久资格、
跨版本或跨 Mod 能力。只有实际执行并带精确身份的证据才能改变这些状态。
