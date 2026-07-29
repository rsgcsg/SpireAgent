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
const releaseInfo = process.platform === "darwin"
  ? path.join(
    gameDir,
    "SlayTheSpire2.app/Contents/Resources/release_info.json"
  )
  : path.join(gameDir, "release_info.json");
if (!existsSync(gameAssembly)) {
  throw new Error(`Could not find exact game assembly at ${gameAssembly}`);
}
if (!existsSync(releaseInfo)) {
  throw new Error(`Could not find exact release identity at ${releaseInfo}`);
}

const outputDirectory = path.join(root, "STS2MCP/out/operation-binding-audit");
await mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, "latest.json");
const result = spawnSync(
  "dotnet",
  [
    "run",
    "--project",
    "STS2MCP/tools/STS2.OperationBindingAudit/STS2.OperationBindingAudit.csproj",
    "--",
    "--game-assembly",
    gameAssembly,
    "--manifest",
    "STS2MCP/compatibility/operation-binding-probes.v1.json",
    "--release-info",
    releaseInfo,
    "--output",
    outputPath
  ],
  {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }
);
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.error(`Non-authorizing operation binding report: ${outputPath}`);
