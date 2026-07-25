import { assertPermissionTransition } from "./assert-connector-permission-transition.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function record({ promoted = false } = {}) {
  const beforeGrant = {
    grant_id: "grant-before",
    grant_version: 1,
    current: !promoted,
    status: "active",
    surface_kind: "main_menu",
    operation: "continue_run",
    tier: "session_canary",
    runtime_epoch: "runtime-fixture",
    environment_digest: "environment-fixture",
    patch_digest: "patch-fixture",
    operation_fingerprint: "operation-fixture",
    supersedes_grant_id: null
  };
  const afterGrant = {
    ...beforeGrant,
    grant_id: "grant-after",
    grant_version: 2,
    current: true,
    tier: "session_auto_approved",
    supersedes_grant_id: beforeGrant.grant_id
  };
  const current = promoted ? afterGrant : beforeGrant;
  return {
    protocol_version: "2.0-preview.63",
    bridge: {
      assembly_file_sha256: "a".repeat(64),
      module_version_id: "mvid-fixture",
      runtime_instance_id: "runtime-fixture"
    },
    game: {
      version: "v0.109.0",
      commit: "c12f634d",
      main_assembly_hash: -1639417500,
      modset: { fingerprint: "modset-fixture" },
      compatibility: {
        action_permission_scopes: [{
          surface_kind: current.surface_kind,
          operation: current.operation,
          tier: "canary",
          grant_id: current.grant_id,
          grant_version: current.grant_version,
          runtime_epoch: current.runtime_epoch,
          environment_digest: current.environment_digest,
          patch_digest: current.patch_digest,
          operation_fingerprint: current.operation_fingerprint
        }]
      }
    },
    permission_system: {
      policy_digest: "policy-fixture",
      patch_inventory: { digest: "patch-fixture" },
      grants: promoted ? [beforeGrant, afterGrant] : [beforeGrant]
    }
  };
}

const before = record();
const after = record({ promoted: true });
const result = assertPermissionTransition(before, after, "main_menu", "continue_run");
assert(result.status === "pass", "positive fixture did not pass");

for (const mutate of [
  (value) => { value.bridge.runtime_instance_id = "other-runtime"; },
  (value) => { value.permission_system.grants[1].supersedes_grant_id = "wrong"; },
  (value) => { value.game.compatibility.action_permission_scopes = []; }
]) {
  const invalid = structuredClone(after);
  mutate(invalid);
  let rejected = false;
  try {
    assertPermissionTransition(before, invalid, "main_menu", "continue_run");
  } catch {
    rejected = true;
  }
  assert(rejected, "negative permission-transition fixture was accepted");
}

console.log(JSON.stringify({
  status: "pass",
  fixture_cases: 4,
  authorization_effect: "none",
  qualification_effect: "none"
}));
