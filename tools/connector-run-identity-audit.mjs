#!/usr/bin/env node
import {
  existsSync,
  readFileSync,
  readdirSync
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const WORKSPACE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_RUNS_DIRECTORY = path.join(WORKSPACE, "Re-SpireAgent/data/runs");

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function readJsonLines(file) {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function safeRunDirectory(run, runsDirectory) {
  if (!run) {
    const candidates = readdirSync(runsDirectory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(runsDirectory, entry.name))
      .filter((directory) => existsSync(path.join(directory, "decisions.jsonl")))
      .sort();
    if (candidates.length === 0) throw new Error(`No recorded runs found under ${runsDirectory}.`);
    return candidates.at(-1);
  }

  const direct = path.resolve(run);
  if (existsSync(path.join(direct, "decisions.jsonl"))) return direct;
  if (!/^[A-Za-z0-9._-]+$/u.test(run)) throw new Error(`Unsafe run id or missing run directory: ${run}`);
  const resolved = path.join(runsDirectory, run);
  if (!existsSync(path.join(resolved, "decisions.jsonl"))) {
    throw new Error(`Run does not contain decisions.jsonl: ${resolved}`);
  }
  return resolved;
}

function readSnapshot(runDirectory, reference) {
  if (typeof reference !== "string" || reference.length === 0) {
    return { value: null, error: "snapshot_reference_missing" };
  }
  const file = path.resolve(runDirectory, reference);
  const prefix = `${path.resolve(runDirectory)}${path.sep}`;
  if (!file.startsWith(prefix)) return { value: null, error: "snapshot_reference_outside_run" };
  try {
    return { value: readJson(file), error: null };
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function recordedState(snapshot) {
  if (snapshot?.human_snapshot) {
    return {
      ...snapshot.human_snapshot,
      identity_kind: "human_environment_snapshot"
    };
  }
  return snapshot?.bridge_v2_state ?? null;
}

function identityPair(state) {
  if (state?.identity_kind === "human_environment_snapshot") {
    if (typeof state.snapshot_id !== "string") return null;
    const actionKeys = (state.bound_actions?.actions ?? [])
      .map(boundActionKey)
      .filter(Boolean)
      .sort();
    return {
      semantic: state.snapshot_id,
      authority: JSON.stringify({
        interaction_id: state.interaction?.interaction_id ?? null,
        status: state.status ?? null,
        projection_status: state.bound_actions?.status ?? null,
        actions: actionKeys
      }),
      evidenceSource: "human_environment_snapshot"
    };
  }

  const formalSemantic = state?.semantic_state_id;
  const formalAuthority = state?.authority_projection_id;
  if (typeof formalSemantic === "string" && typeof formalAuthority === "string") {
    return {
      semantic: formalSemantic,
      authority: formalAuthority,
      evidenceSource: "formal_state_identity"
    };
  }

  const shadow = state?.identity_shadow;
  if (!shadow) return null;
  const semantic = shadow.semantic_state_id_candidate;
  const authority = shadow.authority_projection_id_candidate;
  if (typeof semantic !== "string" || typeof authority !== "string") return null;
  return { semantic, authority, evidenceSource: "historical_identity_shadow" };
}

function identityEvidenceSource(preIdentity, postIdentity) {
  if (!preIdentity || !postIdentity) return "missing_identity";
  return preIdentity.evidenceSource === postIdentity.evidenceSource
    ? preIdentity.evidenceSource
    : "mixed_identity_generation";
}

function normalizedBindings(action) {
  const raw = action?.entity_bindings ?? action?.entityBindings ?? [];
  const bindings = Array.isArray(raw)
    ? raw.map((binding) => ({
        role: binding?.role ?? null,
        entity_id: binding?.entity_id ?? binding?.entityId ?? null
      }))
    : [];
  if (typeof action?.subject_ref === "string") {
    bindings.push({ role: "subject", entity_id: action.subject_ref });
  }
  for (const argument of action?.arguments ?? []) {
    if (typeof argument?.referent_id === "string") {
      bindings.push({ role: argument.role ?? null, entity_id: argument.referent_id });
    }
  }
  return bindings
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function boundActionKey(action) {
  const kind = action?.kind ?? action?.action;
  if (typeof kind !== "string") return null;
  return JSON.stringify({
    kind,
    entity_bindings: normalizedBindings(action)
  });
}

function selectedAction(record) {
  const selectedId = record?.execution?.selectedActionId;
  if (typeof selectedId !== "string") return null;
  return record.allowedActions?.find((action) => action.id === selectedId) ?? null;
}

function actionContinuity(record, postState) {
  const selected = selectedAction(record);
  const selectedKey = boundActionKey(selected);
  const publishedActions = postState?.identity_kind === "human_environment_snapshot"
    ? postState.bound_actions?.actions
    : postState?.legal_actions;
  if (!selectedKey || !Array.isArray(publishedActions)) return "not_evaluable";
  return publishedActions.some((action) => boundActionKey(action) === selectedKey)
    ? "same_kind_and_operands_published"
    : "not_published_with_same_kind_and_operands";
}

function identityChange(preIdentity, postIdentity) {
  if (!preIdentity || !postIdentity) return "missing_identity";
  const semantic = preIdentity.semantic !== postIdentity.semantic;
  const authority = preIdentity.authority !== postIdentity.authority;
  if (semantic && authority) return "semantic_and_authority_changed";
  if (semantic) return "semantic_changed";
  if (authority) return "authority_changed";
  return "neither_identity_changed";
}

function exactIdentity(metadata) {
  const negotiated = metadata?.adapter?.negotiated ?? {};
  return {
    protocol_version:
      negotiated.connector_protocol_version
      ?? negotiated.bridge_protocol_version
      ?? null,
    gateway_sha256:
      negotiated.host_artifact_sha256
      ?? negotiated.bridge_assembly_file_sha256
      ?? null,
    gateway_mvid:
      negotiated.host_module_version_id
      ?? negotiated.bridge_module_version_id
      ?? null,
    runtime_instance_id:
      negotiated.host_runtime_instance_id
      ?? negotiated.bridge_runtime_instance_id
      ?? null,
    game_version: negotiated.game_version ?? null,
    game_commit: negotiated.game_commit ?? null,
    main_assembly_hash: negotiated.main_assembly_hash ?? null,
    modset_fingerprint: negotiated.modset_fingerprint ?? null,
    patch_digest: negotiated.runtime_patch_digest ?? null,
    permission_policy_digest: negotiated.permission_policy_digest ?? null
  };
}

export function auditRunIdentity({ run, runsDirectory = DEFAULT_RUNS_DIRECTORY } = {}) {
  const resolvedRuns = path.resolve(runsDirectory);
  const runDirectory = safeRunDirectory(run, resolvedRuns);
  const records = readJsonLines(path.join(runDirectory, "decisions.jsonl"));
  const metadata = existsSync(path.join(runDirectory, "metadata.json"))
    ? readJson(path.join(runDirectory, "metadata.json"))
    : null;
  const staleRecords = records.filter((record) => record.outcome === "not_executed_stale_state");
  const findings = staleRecords.map((record) => {
    const pre = readSnapshot(runDirectory, record.preState?.rawStateRef);
    const post = readSnapshot(runDirectory, record.postState?.rawStateRef);
    const preState = recordedState(pre.value);
    const postState = recordedState(post.value);
    const preIdentity = identityPair(preState);
    const postIdentity = identityPair(postState);
    const change = identityChange(preIdentity, postIdentity);
    return {
      decision_id: record.decisionId ?? null,
      tick: record.tick ?? null,
      context_kind: record.preState?.normalizedState?.context?.kind ?? null,
      surface_kind: record.preState?.normalizedState?.surface?.kind ?? null,
      selected_action_kind: selectedAction(record)?.kind ?? null,
      current_state_id_changed:
        (preState?.snapshot_id ?? preState?.state_id)
        !== (postState?.snapshot_id ?? postState?.state_id),
      identity_change: change,
      identity_evidence_source: identityEvidenceSource(preIdentity, postIdentity),
      selected_bound_action_continuity: actionContinuity(record, postState),
      pre_state_id: preState?.snapshot_id ?? preState?.state_id ?? null,
      post_state_id: postState?.snapshot_id ?? postState?.state_id ?? null,
      snapshot_errors: [pre.error, post.error].filter(Boolean)
    };
  });

  const count = (value) => findings.filter((finding) => finding.identity_change === value).length;
  const sourceCount = (value) => findings.filter((finding) =>
    finding.identity_evidence_source === value).length;
  const compositeOnly = count("neither_identity_changed");
  const missing = count("missing_identity");
  return {
    schema_version: 2,
    analysis_kind: "recorded_run_state_identity_audit",
    authorization_effect: "none",
    run: {
      run_id: metadata?.runId ?? path.basename(runDirectory),
      directory: runDirectory,
      decision_count: records.length,
      evidence_provenance: metadata?.evidence?.provenance ?? "not_recorded",
      qualification_use: metadata?.evidence?.qualificationUse ?? "not_recorded",
      exact_identity: exactIdentity(metadata)
    },
    summary: {
      stale_refusal_count: findings.length,
      semantic_and_authority_changed: count("semantic_and_authority_changed"),
      semantic_changed: count("semantic_changed"),
      authority_changed: count("authority_changed"),
      neither_identity_changed: compositeOnly,
      missing_identity: missing,
      formal_state_identity_findings: sourceCount("formal_state_identity"),
      human_environment_snapshot_findings: sourceCount("human_environment_snapshot"),
      historical_identity_shadow_findings: sourceCount("historical_identity_shadow"),
      mixed_identity_generation_findings: sourceCount("mixed_identity_generation"),
      selected_bound_action_still_published: findings.filter((finding) =>
        finding.selected_bound_action_continuity === "same_kind_and_operands_published").length,
      selected_bound_action_not_published: findings.filter((finding) =>
        finding.selected_bound_action_continuity === "not_published_with_same_kind_and_operands").length,
      composite_only_stale_findings: compositeOnly,
      migration_signal: missing > 0
        ? "incomplete_identity_evidence"
        : compositeOnly > 0
          ? "composite_only_stale_observed"
          : "no_composite_only_stale_observed"
    },
    findings,
    limitations: [
      "identity changes identify hash-domain drift, not whether the underlying game change was strategically material",
      "Human Environment audits compare snapshot identity and the complete finite bound-action projection; they do not recreate native legality",
      "Preview.74 and later use formal state identities; older recorded runs are read through the non-authorizing historical shadow only",
      "bound-action continuity compares only action kind and exact entity operands",
      "recorded evidence does not authorize identity migration or gameplay permission",
      "unrecorded or operator-positioned provenance is not Organic qualification"
    ]
  };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--run") options.run = argv[++index];
    else if (value === "--runs") options.runsDirectory = argv[++index];
    else if (!options.run) options.run = value;
    else throw new Error(`Unknown argument: ${value}`);
  }
  return options;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    console.log(JSON.stringify(auditRunIdentity(parseArgs(process.argv.slice(2))), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
