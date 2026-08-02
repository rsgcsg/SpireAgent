# Connector V3 Preview.4 Complete-Journey Evidence

Date: 2026-08-02

Evidence class: reviewed exact-runtime coverage. Run provenance is
`unrecorded`; this is not Organic qualification or a durable claim.

## Exact identity

- run: `run-20260802094606-6734zk`
- source revision: `1d85fc2820728425fbb870561708ae39c8df43a2`
- source digest: `c0e365dbda22daa1ba2266fc3f50673f111c05aec5bc28fd66826372bdb8f387`
- source worktree: `clean`
- protocol: `3.0-preview.4`
- loaded assembly SHA-256:
  `eafde5add1fbe4f815422e6a8abfacbc057179b3ecc8c4e27375e18d1f455da6`
- loaded MVID: `0c011228-68a6-4717-9689-95ba6420a155`
- runtime instance: `5a57a66e318f4bdeb7167e4b719e1c3d`
- game: `v0.110.1`, commit `db5d3552`, assembly hash `-205573697`
- Modset: `exact_bridge_only`, fingerprint
  `9d665afd68a0bba4bc7428ccb12d70456b4d72573b5d91b874950cf8b6460b91`
- authority: exact-environment `migration_exploration` / scoped provisional
  trial; no persistent qualification.

## Journey result

The run reached `completed_run_boundary` after 161 decisions. It recorded 157
`executed_and_settled` decisions. Every executed command returned a
`completed` receipt with `application=confirmed` and an available successor.
No `unknown` receipt occurred.

Direct V3 was exercised for ordinary combat, map, event, reward/card reward,
shop room/inventory, rest site, treasure, menu/run setup and game over. The
Surface counts included 88 combat turns, 14 maps, 17 reward claims, six card
rewards, six rest-site states, seven shop states and eight treasure states.

The only V2-shaped Re sidecar states were two Smith child decisions:

```text
rest -> deck_upgrade_selection selecting -> preview -> rest
```

The exact selected card was Conflagration. Selection completed with
`upgrade_selection_changed_or_preview_opened`; confirmation completed with
`upgrade_screen_closed_and_selected_instances_upgraded`.

## Non-success attribution

- decision 22 was a normal event `no_action` settling observation. No command
  was attempted and supervision continued.
- decisions 85 and 114 were treasure-choice state-hash drift refusals. No
  mutation was attempted; fresh observations later completed the journey.
- decision 161 was the expected completed-game main-menu boundary. No command
  was attempted.

These are not unknown mutations or unsupported-family failures.

## Preview.4 conclusions

The installed Preview.4 artifact was actually loaded with exact SHA/MVID and
completed an ordinary game. Rest, Merchant and Treasure ordinary paths did
not regress. However, the precise known-room model-without-input-owner
settling branch did not naturally appear, so that classifier branch remains
not exercised. Unknown owner behavior also did not appear.

Combat-hand selection did not appear. Preview.4 direct combat-hand select,
deselect/reselect, confirm and peek-return therefore remain pending exact
runtime evidence.

No V3 Inspection request was made. `run_deck`, `combat_piles`, `shop_catalog`
and stale-token rejection remain pending exact-runtime evidence.

## Preview.5 consequence and non-claims

Preview.5 uses this evidence to migrate the observed Smith
`deck_upgrade_selection` path to a direct V3 family contract. It also migrates
merchant `deck_removal_selection` using its independently audited merchant
source, Gold/service Commit and exact-card-removal Outcome. It does not
transfer merchant authority to relic- or reward-originated removal.

Preview.5 also introduces state-bound, non-authorizing `surface_card` linked
detail. These changes have source and automated-test evidence only until the
new artifact is built, installed and cold-loaded.

The run does not prove Kifuda, New Leaf, combat-hand, merchant removal,
Inspection, linked detail, physical UI opening, Organic qualification,
persistent qualification or cross-version/cross-Mod compatibility.
