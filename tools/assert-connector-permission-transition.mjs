import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function object(value, name) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${name} must be an object`);
  return value;
}

function exactIdentity(value) {
  const root = object(value, "record");
  const bridge = object(root.bridge, "bridge");
  const game = object(root.game, "game");
  const modset = object(game.modset, "game.modset");
  const permission = object(root.permission_system, "permission_system");
  const patch = object(permission.patch_inventory, "permission_system.patch_inventory");
  return {
    protocol: root.protocol_version,
    gatewaySha: bridge.assembly_file_sha256,
    gatewayMvid: bridge.module_version_id,
    runtimeEpoch: bridge.runtime_instance_id,
    game: `${game.version}|${game.commit}|${game.main_assembly_hash}`,
    modset: modset.fingerprint,
    permissionPolicy: permission.policy_digest,
    patch: patch.digest
  };
}

function sameIdentity(left, right) {
  return Object.keys(left).every((key) => left[key] === right[key]);
}

function currentGrant(record, surfaceKind, operation) {
  const permission = object(record.permission_system, "permission_system");
  assert(Array.isArray(permission.grants), "permission_system.grants must be an array");
  return permission.grants.find((grant) =>
    grant.current === true
    && grant.surface_kind === surfaceKind
    && grant.operation === operation);
}

function scope(record, surfaceKind, operation) {
  const game = object(record.game, "game");
  const compatibility = object(game.compatibility, "game.compatibility");
  assert(
    Array.isArray(compatibility.action_permission_scopes),
    "game.compatibility.action_permission_scopes must be an array"
  );
  return compatibility.action_permission_scopes.find((candidate) =>
    candidate.surface_kind === surfaceKind
    && candidate.operation === operation);
}

function assertScopeMatchesGrant(record, grant, surfaceKind, operation, stage) {
  const candidate = scope(record, surfaceKind, operation);
  assert(candidate, `${stage} record lacks the operation permission scope`);
  assert(candidate.grant_id === grant.grant_id, `${stage} scope grant_id does not match`);
  assert(candidate.grant_version === grant.grant_version, `${stage} scope grant_version does not match`);
  assert(candidate.runtime_epoch === grant.runtime_epoch, `${stage} scope runtime_epoch does not match`);
  assert(candidate.environment_digest === grant.environment_digest, `${stage} scope environment_digest does not match`);
  assert(candidate.patch_digest === grant.patch_digest, `${stage} scope patch_digest does not match`);
  assert(candidate.operation_fingerprint === grant.operation_fingerprint, `${stage} scope operation_fingerprint does not match`);
}

export function assertPermissionTransition(beforeValue, afterValue, surfaceKind, operation) {
  const before = object(beforeValue, "before");
  const after = object(afterValue, "after");
  const beforeIdentity = exactIdentity(before);
  const afterIdentity = exactIdentity(after);
  assert(beforeIdentity.protocol === "2.0-preview.63", "before record is not Bridge 2.0-preview.63");
  assert(sameIdentity(beforeIdentity, afterIdentity), "before/after exact identities differ");

  const beforeGrant = currentGrant(before, surfaceKind, operation);
  assert(beforeGrant, "before record lacks a current grant for the operation");
  assert(beforeGrant.status === "active", "before grant is not active");
  assert(beforeGrant.tier === "session_canary", "before grant is not session_canary");
  assertScopeMatchesGrant(before, beforeGrant, surfaceKind, operation, "before");

  const afterGrant = currentGrant(after, surfaceKind, operation);
  assert(afterGrant, "after record lacks a current grant for the operation");
  assert(afterGrant.status === "active", "after grant is not active");
  assert(afterGrant.tier === "session_auto_approved", "after grant is not session_auto_approved");
  assert(
    afterGrant.grant_version === beforeGrant.grant_version + 1,
    "after grant version does not immediately follow before grant"
  );
  assert(
    afterGrant.supersedes_grant_id === beforeGrant.grant_id,
    "after grant does not supersede the before grant"
  );
  assertScopeMatchesGrant(after, afterGrant, surfaceKind, operation, "after");

  const priorIssuance = after.permission_system.grants.find((grant) =>
    grant.grant_id === beforeGrant.grant_id);
  assert(priorIssuance, "after ledger does not retain the prior issuance");
  assert(priorIssuance.current === false, "superseded issuance remains current");

  return {
    schema_version: 1,
    status: "pass",
    assertion: "session_canary_to_session_auto_approved",
    evidence_role: "recorded_operator_canary",
    authorization_effect: "none",
    qualification_effect: "none",
    surface_kind: surfaceKind,
    operation,
    exact_identity: beforeIdentity,
    before_grant: {
      grant_id: beforeGrant.grant_id,
      grant_version: beforeGrant.grant_version,
      tier: beforeGrant.tier
    },
    after_grant: {
      grant_id: afterGrant.grant_id,
      grant_version: afterGrant.grant_version,
      tier: afterGrant.tier,
      supersedes_grant_id: afterGrant.supersedes_grant_id
    }
  };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const beforePath = argument("--before");
  const afterPath = argument("--after");
  const surfaceKind = argument("--surface");
  const operation = argument("--operation");
  assert(beforePath && afterPath && surfaceKind && operation,
    "usage: --before <json> --after <json> --surface <kind> --operation <operation>");
  const before = JSON.parse(await readFile(beforePath, "utf8"));
  const after = JSON.parse(await readFile(afterPath, "utf8"));
  console.log(JSON.stringify(
    assertPermissionTransition(before, after, surfaceKind, operation),
    null,
    2
  ));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
