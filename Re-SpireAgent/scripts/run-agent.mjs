#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.dirname(projectRoot);

function git(args) {
  return execFileSync("git", args, { cwd: workspace, encoding: "utf8" }).trim();
}

function sourceIdentity() {
  const revision = git(["rev-parse", "HEAD"]);
  const statusText = git([
    "status", "--porcelain", "--untracked-files=all", "--", "Re-SpireAgent"
  ]);
  const files = execFileSync(
    "git",
    [
      "ls-files", "--cached", "--others", "--exclude-standard", "-z", "--",
      "Re-SpireAgent"
    ],
    { cwd: workspace, encoding: "utf8" }
  ).split("\0").filter((file) => file
    && existsSync(path.join(workspace, file))
    && !file.startsWith("Re-SpireAgent/data/")
    && !file.startsWith("Re-SpireAgent/dist/")
    && !file.startsWith("Re-SpireAgent/node_modules/")
    && !/\.env(?:\.local)?$/u.test(file));
  const hash = createHash("sha256");
  for (const file of files.sort()) {
    hash.update(file);
    hash.update("\0");
    hash.update(readFileSync(path.join(workspace, file)));
    hash.update("\0");
  }
  return {
    revision,
    sourceDigest: hash.digest("hex"),
    worktreeStatus: statusText ? "dirty" : "clean"
  };
}

const identity = sourceIdentity();
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const child = spawnSync(
  npm,
  ["run", "agent:run:direct", "--", ...process.argv.slice(2)],
  {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      SPIREAGENT_RE_SOURCE_REVISION: identity.revision,
      SPIREAGENT_RE_SOURCE_DIGEST: identity.sourceDigest,
      SPIREAGENT_RE_WORKTREE_STATUS: identity.worktreeStatus
    }
  }
);

if (child.error) throw child.error;
process.exitCode = child.status ?? 1;
