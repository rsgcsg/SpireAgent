# Connector V3 Preview.5 Selector And Linked-Detail Cutover

Date: 2026-08-02

Evidence class: source and automated-test closeout. Build, install, load and
Live evidence are recorded separately.

## Trigger

Exact Preview.4 run `run-20260802094606-6734zk` completed a 161-decision game.
Its only V2-shaped Re sidecar states were Smith deck-upgrade selection and
preview. Merchant removal did not occur, but its source, native transaction and
Outcome already had source-specific automated coverage.

## Migration Scope

Preview.5 moves two complete selector lifecycles to the V3 Native Command
Catalog:

- Smith/event deck upgrade: select, deselect/reselect, cancel selection,
  preview return and confirm;
- merchant deck removal: select, deselect/reselect, preview, cancel selection,
  preview return and confirm.

Both publish typed Surface facts and exact screen/card/control bindings. The
Gateway resolves the current native screen, card membership and control again
at execution. Candidate discovery does not consume `draft.Actions`, and direct
execution cannot invoke a Provider action closure.

The two families share bounded card-selection and entity mechanics only.
Merchant removal retains merchant source identity, current inventory entry,
Gold/service preconditions and exact selected-card removal Outcome. Relic and
reward removal remain separate migration debt and receive no merchant
authority.

## Information Slice

The observation may advertise `surface_card` entries for cards on the exact
current visible Surface. `GET /api/v3/linked-details/{entity_id}` and the MCP
equivalent require the same current state token and return only that current
visible card. The read path is non-authorizing and never enters the command
ledger or controller lifecycle.

This is deliberately not a universal Fact API. Persistent shared state and the
complete current Surface remain in the observation; run deck, combat piles and
shop catalog remain typed Inspection; physical UI opening remains a separate
optional evidence profile.

## Safety And Rollback

- exact state, interaction, owner, source and entity binding are retained;
- publication and execution use the same typed Surface facts;
- execute-time native revalidation precedes native Commit;
- request idempotency and unknown-no-retry are unchanged;
- no V2 action ID, index mutation, coordinate or reflection mutation is added;
- protocol moves to `3.0-preview.5`, so Preview.4 permission and Live evidence
  cannot transfer;
- rollback restores the timestamped pre-install Preview.4 deployment snapshot.

## Automated Acceptance

Gateway tests cover typed Surface serialization, stages, exact selected-card
membership, source isolation, owner/card drift and linked-detail token/entity
validation. Re tests cover strict command-set parity, no-sidecar consumption,
select/deselect/reselect, preview/return/confirm projection and strict linked
detail decoding.

Gateway 258/258 and Re 265/265 tests pass together with Re typecheck/build,
Python MCP syntax and repository docs/CLI/identity/compatibility/permission/
qualification/profile/migration checks. The Release was built and installed
with SHA
`dda1e348d7972f42c75768bdde9db5242f332c08bfb739c26fceef96385babcd`
and MVID `7446a1a2-4a7f-44c0-8c5c-ad95651a7ebd`. Rollback snapshot:
`STS2MCP/.local/deployments/2026-08-02T10-38-42-535Z`.

The game remained stopped after installation. Loaded Preview.5 identity is a
non-claim pending a cold start.

## Non-Claims

- Preview.5 is not loaded or Live merely because source/tests/build pass.
- Preview.4 Smith sidecar evidence is not Preview.5 direct-family evidence.
- Merchant removal, combat-hand, Inspection and linked detail require exact
  Preview.5 runtime exercise.
- Kifuda, New Leaf, relic/reward removal, physical UI opening, Organic
  qualification, durable qualification and cross-version/cross-Mod
  compatibility are not claimed.
