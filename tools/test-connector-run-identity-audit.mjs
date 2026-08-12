import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { auditRunIdentity } from "./connector-run-identity-audit.mjs";

function identityState({ stateId, semantic, authority, actions, historical = false }) {
  return {
    bridge_v2_state: {
      state_id: stateId,
      ...(historical
        ? {
            identity_shadow: {
              semantic_state_id_candidate: semantic,
              authority_projection_id_candidate: authority
            }
          }
        : {
            semantic_state_id: semantic,
            authority_projection_id: authority
          }),
      legal_actions: actions
    }
  };
}

function action(id, entityId) {
  return {
    action_id: id,
    kind: "play_card",
    category: "combat",
    entity_bindings: [{ role: "card", entity_id: entityId }]
  };
}

function playerSnapshot({ snapshotId, interactionId, actions }) {
  return {
    player_snapshot: {
      snapshot_id: snapshotId,
      status: "interactive",
      interaction: { interaction_id: interactionId },
      bound_actions: {
        status: "complete",
        actions
      }
    }
  };
}

function historicalHumanSnapshot({ snapshotId, interactionId, actions }) {
  return {
    human_snapshot: playerSnapshot({ snapshotId, interactionId, actions }).player_snapshot
  };
}

function humanAction(id, subjectId, targetId) {
  return {
    bound_action_id: id,
    action: "play",
    interaction_id: "combat-1",
    subject_ref: subjectId,
    arguments: [{ role: "target", referent_id: targetId }]
  };
}

function record({ decisionId, preRef, postRef, entityId }) {
  return {
    decisionId,
    tick: Number(decisionId.at(-1)),
    outcome: "not_executed_stale_state",
    execution: { selectedActionId: `${decisionId}-action` },
    allowedActions: [{
      id: `${decisionId}-action`,
      kind: "play_card",
      category: "combat",
      entityBindings: [{ role: "card", entityId }]
    }],
    preState: {
      rawStateRef: preRef,
      normalizedState: { context: { kind: "combat" }, surface: { kind: "combat_turn" } }
    },
    postState: {
      rawStateRef: postRef,
      normalizedState: { context: { kind: "combat" }, surface: { kind: "combat_turn" } }
    }
  };
}

const root = mkdtempSync(path.join(os.tmpdir(), "spireagent-run-identity-"));
try {
  const run = path.join(root, "run-fixture");
  const snapshots = path.join(run, "snapshots");
  mkdirSync(snapshots, { recursive: true });
  writeFileSync(path.join(run, "metadata.json"), JSON.stringify({
    runId: "run-fixture",
    evidence: {
      provenance: "fixture",
      qualificationUse: "coverage_only_unless_independently_reviewed"
    },
    adapter: { negotiated: {
      connector_protocol_version: "3.0-fixture",
      host_artifact_sha256: "he-sha-fixture",
      host_module_version_id: "he-mvid-fixture",
      host_runtime_instance_id: "he-runtime-fixture",
      bridge_protocol_version: "retired-fixture",
      runtime_patch_digest: "patch-fixture",
      permission_policy_digest: "policy-fixture"
    } }
  }));

  const semanticRecord = record({
    decisionId: "decision-1",
    preRef: "snapshots/semantic-pre.json",
    postRef: "snapshots/semantic-post.json",
    entityId: "card-1"
  });
  writeFileSync(path.join(snapshots, "semantic-pre.json"), JSON.stringify(identityState({
    stateId: "state-1",
    semantic: "semantic-a",
    authority: "authority-a",
    actions: [action("old-action", "card-1")]
  })));
  writeFileSync(path.join(snapshots, "semantic-post.json"), JSON.stringify(identityState({
    stateId: "state-2",
    semantic: "semantic-b",
    authority: "authority-a",
    actions: [action("new-action", "card-1")]
  })));

  const compositeRecord = record({
    decisionId: "decision-2",
    preRef: "snapshots/composite-pre.json",
    postRef: "snapshots/composite-post.json",
    entityId: "card-2"
  });
  writeFileSync(path.join(snapshots, "composite-pre.json"), JSON.stringify(identityState({
    stateId: "state-3",
    semantic: "semantic-c",
    authority: "authority-c",
    actions: [action("old-action", "card-2")]
  })));
  writeFileSync(path.join(snapshots, "composite-post.json"), JSON.stringify(identityState({
    stateId: "state-4",
    semantic: "semantic-c",
    authority: "authority-c",
    actions: [action("different-action", "card-3")]
  })));

  const historicalRecord = record({
    decisionId: "decision-3",
    preRef: "snapshots/historical-pre.json",
    postRef: "snapshots/historical-post.json",
    entityId: "card-4"
  });
  writeFileSync(path.join(snapshots, "historical-pre.json"), JSON.stringify(identityState({
    stateId: "state-5",
    semantic: "semantic-d",
    authority: "authority-d",
    actions: [action("old-action", "card-4")],
    historical: true
  })));
  writeFileSync(path.join(snapshots, "historical-post.json"), JSON.stringify(identityState({
    stateId: "state-6",
    semantic: "semantic-d",
    authority: "authority-e",
    actions: [action("new-action", "card-4")],
    historical: true
  })));

  const playerRecord = record({
    decisionId: "decision-4",
    preRef: "snapshots/player-pre.json",
    postRef: "snapshots/player-post.json",
    entityId: "card-5"
  });
  playerRecord.allowedActions[0].kind = "play";
  playerRecord.allowedActions[0].entityBindings = [
    { role: "subject", entityId: "card-5" },
    { role: "target", entityId: "enemy-1" }
  ];
  writeFileSync(path.join(snapshots, "player-pre.json"), JSON.stringify(playerSnapshot({
    snapshotId: "snapshot-1",
    interactionId: "combat-1",
    actions: [humanAction("bound-1", "card-5", "enemy-1")]
  })));
  writeFileSync(path.join(snapshots, "player-post.json"), JSON.stringify(playerSnapshot({
    snapshotId: "snapshot-2",
    interactionId: "combat-1",
    actions: [humanAction("bound-1", "card-5", "enemy-1")]
  })));

  const historicalHumanRecord = record({
    decisionId: "decision-5",
    preRef: "snapshots/human-pre.json",
    postRef: "snapshots/human-post.json",
    entityId: "card-6"
  });
  historicalHumanRecord.allowedActions[0].kind = "play";
  historicalHumanRecord.allowedActions[0].entityBindings = [
    { role: "subject", entityId: "card-6" },
    { role: "target", entityId: "enemy-2" }
  ];
  writeFileSync(path.join(snapshots, "human-pre.json"), JSON.stringify(historicalHumanSnapshot({
    snapshotId: "snapshot-3",
    interactionId: "combat-2",
    actions: [humanAction("bound-2", "card-6", "enemy-2")]
  })));
  writeFileSync(path.join(snapshots, "human-post.json"), JSON.stringify(historicalHumanSnapshot({
    snapshotId: "snapshot-4",
    interactionId: "combat-2",
    actions: [humanAction("bound-2", "card-6", "enemy-2")]
  })));

  writeFileSync(
    path.join(run, "decisions.jsonl"),
    `${JSON.stringify(semanticRecord)}\n${JSON.stringify(compositeRecord)}\n${JSON.stringify(historicalRecord)}\n${JSON.stringify(playerRecord)}\n${JSON.stringify(historicalHumanRecord)}\n`
  );

  const result = auditRunIdentity({ run: "run-fixture", runsDirectory: root });
  assert.equal(result.authorization_effect, "none");
  assert.equal(result.analysis_kind, "recorded_run_state_identity_audit");
  assert.equal(result.run.exact_identity.protocol_version, "3.0-fixture");
  assert.equal(result.run.exact_identity.gateway_sha256, "he-sha-fixture");
  assert.equal(result.run.exact_identity.gateway_mvid, "he-mvid-fixture");
  assert.equal(result.run.exact_identity.runtime_instance_id, "he-runtime-fixture");
  assert.equal(result.run.exact_identity.patch_digest, "patch-fixture");
  assert.equal(result.run.exact_identity.permission_policy_digest, "policy-fixture");
  assert.equal(result.summary.stale_refusal_count, 5);
  assert.equal(result.summary.semantic_changed, 3);
  assert.equal(result.summary.authority_changed, 1);
  assert.equal(result.summary.neither_identity_changed, 1);
  assert.equal(result.summary.composite_only_stale_findings, 1);
  assert.equal(result.summary.formal_state_identity_findings, 2);
  assert.equal(result.summary.historical_identity_shadow_findings, 1);
  assert.equal(result.summary.player_environment_snapshot_findings, 1);
  assert.equal(result.summary.historical_human_environment_snapshot_findings, 1);
  assert.equal(result.summary.selected_bound_action_still_published, 4);
  assert.equal(result.summary.selected_bound_action_not_published, 1);
  assert.equal(result.summary.migration_signal, "composite_only_stale_observed");
  assert.equal(result.findings[0].selected_bound_action_continuity, "same_kind_and_operands_published");
  assert.equal(result.findings[1].selected_bound_action_continuity, "not_published_with_same_kind_and_operands");
  assert.equal(result.findings[2].identity_evidence_source, "historical_identity_shadow");
  assert.equal(result.findings[3].identity_evidence_source, "player_environment_snapshot");
  assert.equal(result.findings[3].pre_state_id, "snapshot-1");
  assert.equal(result.findings[3].post_state_id, "snapshot-2");
  assert.equal(result.findings[4].identity_evidence_source, "historical_human_environment_snapshot");
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log("connector run identity audit checks passed");
