# STS2 Console Debug Runbook

This runbook treats the Slay the Spire 2 developer console as a debug and fixture tool for this agent project. It is not normal gameplay, not agent capability, and not a strategic shortcut.

The console can help reproduce expensive states quickly for adapter debugging, fixture construction, P8 workspace readiness sampling, P9 guarded-learning validation, replay/eval edge cases, and cost-controlled regression tests. Any console-modified run must be marked as debug/fixture data and must not be mixed into real strategy baselines, win-rate claims, memory evidence, or stable learning inputs.

## Sources And Uncertainty

The command list is based on current community/modding documentation, not a stable public API:

- STS2 Mods command list: https://sts2mods.com/slay-the-spire-2-console-commands/
- Nexus Mods Dev Console Enabler: https://www.nexusmods.com/slaythespire2/mods/245
- The Escapist console command guide: https://www.escapistmagazine.com/news-slay-the-spire-2-console-commands/
- GameWatcher warning about console/mod instability: https://www.gamewatcher.com/slay-the-spire-2-console-commands-and-cheats

Version caveat: STS2 is in active development and console access may depend on game branch, `full_console` config, a console-enabler mod, or a specific mod version. Always confirm commands in-game with `help <cmd>` or Tab completion before relying on them.

## Project Boundary

Allowed uses:

- debug MCP/adapter/state mismatch issues
- build fixture states for replay/eval and smoke tests
- reproduce shop, event, combat, reward, death, and transition boundaries
- sample P8 workspace readiness across controlled decision classes
- stage P9 proposal/replay validation without spending many live-run ticks
- export or confirm IDs for fact DB, card/relic/potion/event alignment

Forbidden uses:

- treating console-modified runs as real strategy baseline data
- writing console-modified evidence into stable memory, derived knowledge, or strategy params
- using console commands as a normal live strategy or agent power
- letting console shortcuts replace candidate generation, validation, execution, or replay/eval truth
- using risky commands as routine workflow

Any console run should be tagged in notes/metadata as `debug_console=true`, `dataUse=fixture_only`, or equivalent before it is used for analysis.

## High-Value Commands

Testing speed and logs:

- `instant`: turns instant mode on, useful for reducing animation wait during fixtures and short validation loops.
- `log`: changes log levels for types such as `Generic`, `Network`, `Actions`, `GameSync`, and `VisualSync`.
- `getlogs`: gathers logs into a zip and opens the directory.
- `open`: opens common local paths in the OS file browser.
- `log-history`: saves command history and opens its path.

ID discovery and fact alignment:

- `unlock`: marks cards, potions, relics, monsters, events, epochs, ascensions, or `all` as discovered.
- `dump`: dumps the model ID database to console/logs.

Scene construction:

- `travel`: enables jumping to rooms on the map.
- `act`: jumps to or replaces the current act.
- `room`: jumps to a specific room.
- `fight`: jumps to a specific encounter.
- `event`: jumps to a specific event.

State construction:

- `card`: spawns a card, hand by default; IDs commonly use screaming snake case.
- `draw`: draws cards.
- `energy`: adds energy.
- `gold`: manipulates player gold.
- `relic`: adds or removes a relic.
- `potion`: adds a potion; IDs commonly use screaming snake case.
- `block`: gives block to player or target creature.
- `damage`: damages enemies or a target creature.
- `heal`: heals the player.

Boundary shortcuts:

- `kill`: kills one target or `all`.
- `win`: wins the combat.
- `die`: kills the player.

## Risky Or Debug-Only Commands

Do not recommend these as routine agent-development workflow:

- `cloud`: can delete Steam Cloud save files.
- `leaderboard`: can upload/randomize leaderboard scores.
- `achievement`: changes achievements.
- `sentry crash confirm` or crash-test variants: can deliberately crash the game.
- `godmode`: useful only for very narrow fixture setup and must be tagged debug-only.
- external trainers: higher instability/corruption risk than console fixtures.

Back up saves before using console-enabled or modded test environments. Nexus documentation notes that console-enabler mod use may switch the game to modded saves, and other sources warn that console/mod use can cause instability or corrupted saves.

## Practical Test Flows

### P8 Workspace Sampling

Goal: collect diverse fresh transitions for workspace readiness without spending a full run.

1. Start or resume a debug run and mark it fixture/debug-only.
2. Use `instant` to reduce animation wait.
3. Use `travel`, `act`, `room`, `fight`, or `event` to create target decision classes.
4. Use `card`, `draw`, `energy`, `relic`, `potion`, `gold`, `block`, or `damage` to shape the state.
5. Run `npm run collect:state`.
6. Run `STS2_P8_WORKSPACE_SHADOW=1 npm run agent:tick -- --dry-run`.
7. If executing a fixture transition, run a short `agent:run`, then `npm run data:replay -- --latest` and `npm run data:eval -- --latest`.
8. Keep the run out of real baseline metrics.

### Shop Fixture

Goal: reproduce affordability, potion-slot, purge, relic, and card-purchase candidate behavior.

1. Use `travel` or `room` to reach a shop-like state if supported by the current console build.
2. Use `gold` to test low, exact, and high affordability.
3. Use `potion` to fill potion slots before inspecting reward/shop candidate behavior.
4. Run `collect:state`, `agent:tick -- --dry-run`, replay/eval after any executed fixture.

### Event Fixture

Goal: exercise event option parsing, proceed flow, and state mismatch debugging.

1. Use `event` with a confirmed event ID from Tab completion or `dump`.
2. Use `log Actions Debug` or equivalent log settings if adapter/state mismatch is suspected.
3. Run `collect:state` before and after the event option.
4. Use replay/eval to confirm selected action identity and checkpoint classification.

### Combat Prediction Fixture

Goal: test CandidateFuture prediction checks and PredictionError attribution.

1. Use `fight` to enter a known encounter.
2. Use `card`, `draw`, `energy`, `relic`, `potion`, `block`, `damage`, and `heal` to construct a specific hand/resource/enemy state.
3. Run a dry tick to inspect candidates and P8 workspace coverage.
4. Execute one short transition only when the candidate is legal.
5. Run replay/eval and inspect damage, defense, HP, kill, phase, card-flow, and resource attribution.

### Death / Reward / Boundary Fixture

Goal: verify replay/eval boundaries around death, win, rewards, and game-over handling.

1. Use `damage`, `die`, `kill all`, or `win` to force a boundary.
2. Re-read state immediately with `collect:state`.
3. Run the smallest possible agent action if a screen requires proceed/return.
4. Run replay/eval and confirm ground-truth invariants, checkpoint kind, and transition refs.

## Recording Discipline

Console fixtures should be separated from real play evidence:

- Put notes in `DEBUG_REPORT.md` or a fixture-specific note before using the output.
- Do not use console runs to update long-term memory confidence.
- Do not use console runs to claim strategy quality, win rate, or route/card/relic preference.
- Prefer using console runs to create tests, fixture snapshots, candidate future checks, and eval regressions.

