# Bridge v2 Current Status

This is the canonical current Gateway/Re boundary. Historical preview reports
retain only their recorded environment evidence.

## Source And Artifact Truth

```text
Gateway/Re source     2.0-preview.70
Re normalized schema 28
game                  v0.109.1|c8c577f6|-820620422
game assembly SHA     2cb39e2eee651743829abcc0df4dd9cd7e65f46287c7ca264481115c9602382f
game assembly MVID    208f08b8-d5f5-47f8-9e96-d3a4299ee709
built SHA             28c32f40e22abf1779499d6d28ac4e6dbcea1e0b3d090aa8941ba02d5afbbc55
installed SHA         28c32f40e22abf1779499d6d28ac4e6dbcea1e0b3d090aa8941ba02d5afbbc55
loaded SHA            not loaded (game closed)
built MVID            6f169dfe-3938-4256-ac85-af0e9b3e2ff1
installed MVID        6f169dfe-3938-4256-ac85-af0e9b3e2ff1
loaded MVID           not loaded (game closed)
runtime epoch         none for Preview.70
rollback              STS2MCP/.local/deployments/2026-07-28T05-38-41-553Z
```

The installation has one canonical `STS2_MCP` manifest and no duplicate
Gateway manifest. Source, built, and installed protocol/SHA/MVID match. The
last loaded artifact was Preview.69; its runtime identity and grants do not
transfer. Build/install identity is not loaded, Organic, or persistent
qualification evidence.

## Current Boundary

- Diagnostic observation, encounter provisional trial, and persistent
  qualification are separate.
- A complete unreviewed game identity may expose player-visible diagnostic
  state while starting with no action or Inspection authority.
- In `migration_exploration`, only current uniquely source-resolved actions may
  receive exact-runtime `encounter_source_resolved` grants. Confirmed completion
  yields only `session_trial_confirmed`; restart rolls it back.
- Failure, timeout, witness mismatch, identity/Patch/mode drift, or expiry
  quarantines the affected runtime scope.
- One active Surface is resolved once before authority projection. An
  unadmitted sibling cannot erase an admitted forward action.
- The new/resumed-run mount lifecycle is
  `run_transition/setup/awaiting_run_state + no_action + settling`. Missing
  shared HUD is deferred only for this exact actionless state and carries the
  typed diagnostic
  `bridge.shared_state.deferred_during_run_mount_transition`. Every other
  active-run shared-state failure remains unsupported and fail closed.
- Re refreshes dynamic capabilities during coherent state reads. Startup
  negotiation is not a frozen grant snapshot.
- Provider transport retry is Re-side and pre-mutation only; Gateway unknown
  outcomes remain terminal and are never retried.

The target remains ADR-0002, refined by ADR-0003 and
[ADR-0004](../../../docs/current/decisions/ADR-0004-risk-calibrated-encounter-trial-and-scoped-claims.md).
`surface_kind + operation` is still the current grant lookup key, not the final
compatibility identity.

## Runtime Evidence And Permission Truth

Runs `run-20260728020651-03352e`, `run-20260728021602-bz2rop`,
`run-20260728033215-6n8wsq`, and `run-20260728033638-xrvcre` belong only to the
older loaded `8e7a.../0e3d.../740e...` identity. They provide:

- 258 `executed_and_settled` decisions across ordinary menu, event, map,
  combat, reward, rest, shop, treasure, selector, and game-over flows;
- six safe pre-execution stale-state rejections with later fresh progress;
- one bounded game-over-to-main-menu stop without entering a second game;
- one provider `fetch failed` stop before mutation; and
- one fresh-menu run that reached 100 ticks and stopped at the old decision
  ceiling rather than a game boundary.

All four metadata records declare provenance `unrecorded`. They are current-
build runtime coverage/defect evidence, not Organic qualification. Their
runtime authority does not transfer to another MVID. Historical runs have no
`run-summary.json` and are not backfilled.

Current exact-identity run `run-20260728041630-2z58bz` provided live evidence
for the final run-mount repair. It resumed a saved floor-9 run, completed 114
actions, rejected 11 stale selections before execution, recorded one
Gateway-confirmed `end_turn` whose Re successor-settlement budget expired,
completed the loss/game-over/menu lifecycle, and stopped before a second game.
Its immutable summary is `completed_run_boundary` after 127 decisions. No
unsupported Surface, invalid state, observation failure, executed-unsettled or
unknown mutation occurred.

This run is also `unrecorded`: it proves exact-runtime repair and broad
coverage, not Organic or persistent qualification. Grants remained
operation-scoped and runtime-bound; successful operations reached at most
`session_trial_confirmed`, while `persistent_authority_enabled=false`.

Same-runtime run `run-20260728044555-ltyx7d` then completed a fresh
character-select-to-game-over-to-main-menu boundary: 106 settled actions in
107 decisions, with zero stale, unsupported, invalid, observation/provider
failure, unsettled, or unknown outcomes. It is also `unrecorded`.

Preview.70's read-only run audit found no composite-only stale candidate in
either current run. All 11 earlier stale refusals changed the semantic
candidate; two also changed authority. Preview.70 therefore keeps composite
state/action binding. It separately marks only five explicit component
contracts as non-authorizing digest candidates; 82 fallback rows remain
manifest hypotheses.

## Remaining Boundaries

Known unsupported or evidence-limited scope includes Tutor's unreviewed owner
binding, Crystal Sphere, standalone manual potion discard, unbound source
variants, non-standard profile/menu paths, multiplayer, and incomplete
player-visible detail families. Static audits, fixtures, trial success, and old
MVID evidence do not convert these into support.

## Next Engineering Step

Remain in Gate 2. Cold-load Preview.70, verify exact loaded identity, and run a
bounded ordinary journey without inheriting Preview.69 grants. Then continue
player-visible Inspection/detail closure and ADR-0003 native-contract shadow
migration. No evidence here
authorizes persistent promotion, generic cross-version/Mod compatibility, or
the explicit unsupported scopes above.
