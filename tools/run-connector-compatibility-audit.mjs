import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const gameDir = process.env.STS2_GAME_DIR;
if (!gameDir) {
  throw new Error(
    "STS2_GAME_DIR is required. Point it at the Steam Slay the Spire 2 install."
  );
}

const platformDataDirectory = process.platform === "darwin"
  ? "SlayTheSpire2.app/Contents/Resources/data_sts2_macos_arm64"
  : process.platform === "win32"
    ? "data_sts2_windows_x86_64"
    : "data_sts2_linuxbsd_x86_64";
const gameAssembly = path.join(gameDir, platformDataDirectory, "sts2.dll");
if (!existsSync(gameAssembly)) {
  throw new Error(`Could not find exact game assembly at ${gameAssembly}`);
}

const outputDirectory = path.join(root, "STS2MCP/out/compatibility-audit");
await mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, "latest.json");
const result = spawnSync(
  "dotnet",
  [
    "run",
    "--project",
    "STS2MCP/tools/STS2.CompatibilityAudit/STS2.CompatibilityAudit.csproj",
    "--",
    "--game-assembly",
    gameAssembly,
    "--registry",
    "STS2MCP/BridgeV2/Game/combat-pile-source-contracts.json",
    "--environment-policy",
    "STS2MCP/BridgeV2/Game/exact-environment-policy.json",
    "--output",
    outputPath
  ],
  {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }
);
if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}
if (result.error) {
  throw result.error;
}
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.error(`Non-authorizing compatibility report: ${outputPath}`);
