# Preview.67 Identity Shadow Live Handoff

Status: source/test/build/install complete; cold-load and Live mutation pending  
Date: 2026-07-27

## Prepared Baseline

```text
source protocol    2.0-preview.67
Re schema          26
Release SHA        7da8946c9374c7030d5162e8cb1930e1fc0186edc1c1088f3b2fc371c7a9b768
Release MVID       12b55aef-499f-4ea8-8414-d3a360baa2ac
built/installed    exact SHA and MVID match
game process       stopped during install
last loaded        Preview.66 b0b31f...d7a8a / a7008eea-b3cd-4cb8-b75c-6dee64e9cd5c
```

The previous Gateway artifact was backed up under the local ignored
`STS2MCP/.local/deployments/2026-07-27T06-28-57-208Z/` directory. This is a
machine-local rollback point, not a repository artifact.

## Completed Non-Live Evidence

- Gateway tests: `163/163`.
- Re tests: `187/187`; typecheck and production build pass.
- Connector CLI, docs, inventory, adaptation, permission, qualification,
  Profile and migration fixtures pass.
- Exact `v0.109.1` compatibility scenario passes with Tutor retained as a
  diagnostic-only `code_required_new_owner_binding` holdout.
- Exact operation-binding report is `reviewed_bindings_match` for the five
  probed operations.
- Release build has zero warnings and zero errors.
- Preview.67 built and installed SHA/MVID match.

None of these is loaded or Organic evidence.

## Shortest Cold-Load Checklist

1. Start the game through Steam and wait at a stable menu:

   ```bash
   open "steam://run/2868840"
   ```

2. Verify source, built, installed and loaded identity:

   ```bash
   npm run connector -- verify-loaded-artifact
   ```

   Required result: `ok=true`, protocol `2.0-preview.67`, loaded SHA/MVID equal
   the prepared baseline, exact game/Modset/Patch identity present. Stop on any
   mismatch.

3. Capture a read-only state/control snapshot:

   ```bash
   npm run connector -- collect-evidence
   npm --prefix Re-SpireAgent run agent:inspect
   ```

   Required state facts:

   ```text
   identity_shadow.status = candidate_non_authorizing
   identity_shadow.current_state_id_role = legacy_authoritative_composite
   identity_shadow.action_binding_uses_current_state_id = true
   identity_shadow.authorizing = false
   ```

4. If the exact new Gateway environment advertises no intended operation, do
   not reuse Preview.66 permission. Run the migration cycle for the new exact
   Profile:

   ```bash
   npm run connector -- start-or-resume-trial -- \
     --endpoint http://127.0.0.1:15526 \
     --registry STS2MCP/.local/environment-profiles.json \
     --workspace STS2MCP/.local/migration \
     --store "$HOME/Library/Application Support/Steam/steamapps/common/Slay the Spire 2/SlayTheSpire2.app/Contents/MacOS/mods/STS2_MCP.qualifications.json" \
     --binding-audit STS2MCP/out/operation-binding-audit/latest.json \
     --policy STS2MCP/BridgeV2/Runtime/migration-permission-policy.json \
     --negative-evidence STS2MCP/compatibility/migration-negative-evidence.v1.json \
     --runs Re-SpireAgent/data/runs \
     --apply true
   ```

   This may install an exact candidate package. It does not qualify an
   operation; the Gateway must revalidate it and may expose only the matching
   session canary.

5. At an ordinary, semantically unambiguous state, inspect one decision before
   mutation:

   ```bash
   npm --prefix Re-SpireAgent run agent:tick -- --dry-run
   ```

6. Execute exactly one tick only after the dry run names a current
   `bridge_advertised` action:

   ```bash
   npm --prefix Re-SpireAgent run agent:tick
   ```

   Prefer a different Commit/completion family from `continue_run`, such as a
   normal map transition or ordinary combat action. Stop on provider failure,
   unsupported state, unknown outcome, witness mismatch, identity drift, or
   absent successor state. Never retry an unknown command.

7. Capture evidence again and compare current state, semantic candidate,
   authority candidate, command outcome and successor:

   ```bash
   npm run connector -- collect-evidence
   ```

## Acceptance

The Live slice passes only if:

- loaded identity matches the installed Preview.67 artifact;
- Re strictly decodes the Preview.67 state;
- the shadow remains explicitly non-authorizing;
- one exact advertised action submits, settles through its native completion,
  and produces a coherent successor;
- no permission, witness, unknown-outcome, or unsupported-state contradiction
  occurs; and
- evidence is attributed to the new runtime epoch and exact environment.

This passes a Preview.67 canary and identity-shadow observation. It does not
authorize switching `state_id`, qualifying all operations, or claiming broad
Connector completion.

## Rollback

Close the game, then restore the previous machine-local Gateway artifact:

```bash
npm run connector -- restore-known-environment \
  --backup STS2MCP/.local/deployments/2026-07-27T06-28-57-208Z
```

Cold-start again and verify loaded identity. This restores only the Gateway DLL
and manifest. It does not restore the Steam game, Modset, config, qualification
ledger, or run save.
