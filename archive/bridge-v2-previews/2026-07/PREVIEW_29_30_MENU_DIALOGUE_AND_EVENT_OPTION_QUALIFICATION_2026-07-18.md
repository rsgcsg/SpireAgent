# Preview.29-.30 Menu, Dialogue, And Event-Option Qualification

Date: 2026-07-18  
Game identity: `v0.109.0|c12f634d|-840572606`  
Final protocol: `2.0-preview.30`

## Scope

This bounded release adds ordinary single-player character selection, restores
revealed ancient dialogue on the current build, and repairs/requalifies
ordinary single-player event options. It does not add a universal menu,
universal event-effect DSL, multiplayer event voting, or full-game coverage.

## Exact Source And UI Findings

- `NCharacterSelectScreen`, `NCharacterSelectButton`, `NAscensionPanel`,
  `NMainMenu`, and `NSubmenuStack` establish a distinct menu input owner.
- Character select visibly exposes character choices, selected character
  title/description/HP/gold/starting relic, Ascension controls, Embark, and
  Back. It does not visibly expose the starting deck or collection totals.
- `NAncientEventLayout` creates future dialogue nodes, but only the prefix
  through `_currentDialogueLine` is player-visible.
- `NEventOptionButton.OnFocus()` displays `EventOption.HoverTips`.
  `IHoverTip` includes both text `HoverTip` and visual `CardHoverTip` forms.
- `EventOption.Chosen()` sets `WasChosen` before awaiting the actual effect.
  Therefore `WasChosen` is not semantic completion evidence.
- `NEventRoom` refreshes rendered options after the option task changes the
  event model. Required child overlays, combat, map, room exit, or a non-empty
  replacement option set are observable completion boundaries.

## Runtime Evidence

Character-select artifact before the preview.30 tooltip revision:

- protocol `2.0-preview.29`
- commands selected Silent, changed Ascension `10 -> 9 -> 10`, and embarked
  into a Silent Ascension 10 run.
- `shared_state=null` while the menu Surface owned input; Re accepted that
  exact exception and continues to require shared state for in-run Surfaces.

Organic preview.30 event-journey artifact:

- Release/installed SHA-256:
  `d4f9e00fb52bd38543965a477fe6ebabae7082244621ffe01e5743e9f04a0c2a`
- loaded MVID: `f2604133-ed1a-41f3-a638-ab38829d3cb5`
- runtime instance: `b50f7cff817f4c46be8c0b41625176d4`

Fresh current-build commands:

- `organic-preview30b-dialogue-01`: confirmed exact dialogue index advance.
- `organic-preview30b-dialogue-02`: confirmed exact dialogue index advance to
  the option stage.
- the first event-option attempt failed closed with
  `event_option:NotSupportedException`; no actions were published. This exposed
  the incorrect flat-keyword assumption.
- after the typed-tooltip repair, Neow's Sacrifice exposed Ambergris text, a
  full Guilty card preview, and Unplayable text. `npm run agent:inspect`
  accepted the strict normalized contract.
- `organic-preview30-neow-option-talisman-01`: confirmed replacement event
  state. Shared state and `run_deck` Inspection independently showed
  `NEOWS_TALISMAN`, one upgraded Strike, and one upgraded Defend.
- `organic-preview30-neow-proceed-01`: confirmed map open/room departure.

No command timed out, no stale action executed, and no v1 action was merged
into a Bridge-owned state.

Final installed preview.30 artifact after narrowing the completion predicates:

- Release/installed SHA-256:
  `d90b2a5cc7c0e8383f319e0bf5adac9fd985743cac82e9a06b74071045bfa760`
- loaded MVID: `bdc97168-3bc7-40c4-8a2e-bb0698169118`
- runtime instance: `93390677421c46ebb287c62b3b9da0b6`
- exact identity remained `v0.109.0|c12f634d|-840572606` and capabilities
  remained scoped-qualified with `event_option` only an action canary.

The final delta separates proceed completion from option completion and only
accepts a child overlay if it newly opened. It passed Bridge/Re tests, Release
build, installed-hash equality, and loaded-module identity verification. The
same Neow lifecycle was not organically repeated on this final MVID, so its
Organic Evidence remains attributed to the earlier MVID above.

## Abstraction Review

- Character select: **D at the ownership layer, A at the semantic Surface**.
  A `Menu` resolver layer was necessary; the business Surface remains narrow.
- Ancient dialogue: **A**. It remains a purpose-specific revealed-prefix
  Surface.
- Event option: **C**. It keeps independent business/action/completion
  semantics while using a strong typed tooltip component. The component does
  not create action authority.
- Rejected alternatives: universal menu click, flat universal keyword list,
  generic event-effect DSL, and `WasChosen`/screen-close-only completion.

## Remaining Limits

- One Neow option/proceed journey does not qualify all ordinary or ancient
  event variants.
- Unknown `IHoverTip` implementations still fail the entire Surface closed.
- Root main menu and single-player submenu remain v1-owned.
- First-run tutorial confirmation can interrupt Embark and remains explicitly
  unsupported.
- Generic event completion proves the source-backed event-model transition;
  effect-specific facts should still be independently inspected when available.
