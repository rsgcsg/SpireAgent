import assert from "node:assert/strict";
import path from "node:path";
import {
  evaluateLoadedArtifact,
  resolveGameDir,
  resolveModsDir
} from "./connector.mjs";

assert.equal(
  resolveGameDir({ STS2_GAME_DIR: "./fixture-game" }, "linux", "/home/test"),
  path.resolve("./fixture-game")
);
assert.equal(
  resolveModsDir("/game", "darwin"),
  "/game/SlayTheSpire2.app/Contents/MacOS/mods"
);
assert.equal(resolveModsDir("C:\\game", "win32"), path.join("C:\\game", "mods"));

const clean = evaluateLoadedArtifact({
  csharpProtocol: "2.0-preview.67",
  reProtocol: "2.0-preview.67",
  builtSha: "a".repeat(64),
  installedSha: "a".repeat(64),
  builtMvid: "mvid",
  installedMvid: "mvid",
  capabilities: {
    protocol_version: "2.0-preview.67",
    bridge: {
      assembly_file_sha256: "a".repeat(64),
      module_version_id: "mvid",
      runtime_instance_id: "runtime"
    },
    game: { version: "fixture" }
  }
});
assert.equal(clean.ok, true);

const mismatch = evaluateLoadedArtifact({
  csharpProtocol: "2.0-preview.67",
  reProtocol: "2.0-preview.66",
  builtSha: "a".repeat(64),
  installedSha: "b".repeat(64),
  builtMvid: "mvid-a",
  installedMvid: "mvid-b",
  capabilities: {
    protocol_version: "2.0-preview.66",
    bridge: {
      assembly_file_sha256: "c".repeat(64),
      module_version_id: "mvid-c"
    }
  }
});
assert.equal(mismatch.ok, false);
assert.deepEqual(mismatch.errors, [
  "source_protocol_mismatch",
  "built_installed_sha_mismatch",
  "built_installed_mvid_mismatch",
  "installed_loaded_sha_mismatch",
  "installed_loaded_mvid_mismatch",
  "source_loaded_protocol_mismatch"
]);

console.log("connector CLI checks passed");
