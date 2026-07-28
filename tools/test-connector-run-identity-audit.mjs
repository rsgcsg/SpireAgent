import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { auditRunIdentity } from "./connector-run-identity-audit.mjs";

function identityState({ stateId, semantic, authority, actions }) {
  return {
    bridge_v2_state: {
      state_id: stateId,
      identity_shadow: {
        semantic_state_id_candidate: semantic,
        authority_projection_id_candidate: authority
      },
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
    adapter: { negotiated: { bridge_protocol_version: "fixture" } }
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

  writeFileSync(
    path.join(run, "decisions.jsonl"),
    `${JSON.stringify(semanticRecord)}\n${JSON.stringify(compositeRecord)}\n`
  );

  const result = auditRunIdentity({ run: "run-fixture", runsDirectory: root });
  assert.equal(result.authorization_effect, "none");
  assert.equal(result.summary.stale_refusal_count, 2);
  assert.equal(result.summary.semantic_changed, 1);
  assert.equal(result.summary.neither_candidate_changed, 1);
  assert.equal(result.summary.composite_only_stale_candidates, 1);
  assert.equal(result.summary.selected_bound_action_still_published, 1);
  assert.equal(result.summary.selected_bound_action_not_published, 1);
  assert.equal(result.summary.migration_signal, "composite_only_stale_candidate_observed");
  assert.equal(result.findings[0].selected_bound_action_continuity, "same_kind_and_operands_published");
  assert.equal(result.findings[1].selected_bound_action_continuity, "not_published_with_same_kind_and_operands");
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log("connector run identity audit checks passed");
