# Deployment Guide

This document is for a fresh clone of this repository. It explains how to install the agent, connect Slay the Spire 2 through STS2 MCP, and run the agent safely.

## Requirements

- Node.js 20+.
- Slay the Spire 2 installed.
- STS2 MCP mod installed and enabled in the game.
- Optional: `uv` and the external MCP Python server if your AI client wants MCP tools.
- Optional: an external LLM command for strategic decisions.

## Clone And Install

```bash
git clone <your-repo-url> sts2-ai-agent-portable
cd sts2-ai-agent-portable
npm install
npm run check
```

`npm run check` runs TypeScript typecheck and offline smoke tests. It does not require the game.

## Install Or Verify STS2 MCP Mod

This repository is the TypeScript agent package. The game-side MCP/REST mod is an external dependency.

Expected files inside the Slay the Spire 2 app bundle:

```text
SlayTheSpire2.app/Contents/MacOS/mods/STS2_MCP.dll
SlayTheSpire2.app/Contents/MacOS/mods/STS2_MCP.json
SlayTheSpire2.app/Contents/MacOS/mods/STS2_MCP.conf
```

On macOS Steam installs, the default mods directory is:

```bash
MODS_DIR="$HOME/Library/Application Support/Steam/steamapps/common/Slay the Spire 2/SlayTheSpire2.app/Contents/MacOS/mods"
```

If you build the mod from the upstream STS2 MCP project, copy the built files into that directory. The mod should start a local REST server when the game launches.

## Start Game And Verify REST

On macOS with Steam:

```bash
open "steam://rungameid/2868840"
```

After the game loads and mods are enabled:

```bash
curl -s http://localhost:15526/
```

Expected response:

```json
{"message":"Hello from STS2 MCP v0.4.0","status":"ok"}
```

If the port differs:

```bash
export STS2_API_URL=http://localhost:15526
```

## Run The Agent

Read-only collection:

```bash
npm run collect:state
npm run collect:watch -- --max-ticks 60 --interval-ms 1000
```

Dry-run one decision:

```bash
npm run agent:tick -- --dry-run
```

Run a short live validation:

```bash
npm run agent:run -- --max-ticks 20 --delay-ms 120
```

Run a longer live evaluation:

```bash
npm run agent:run -- --max-ticks 500 --delay-ms 120
```

Review logs and memory:

```bash
npm run agent:review
```

## LLM Modes

Without LLM configuration, the agent uses local scaffold and fallback. That is useful for testing execution, but not the final intelligence target.

External LLM command:

```bash
export STS2_LLM_COMMAND="/path/to/your-json-decider"
export STS2_LLM_TIMEOUT_MS=300000
npm run agent:run -- --max-ticks 500 --delay-ms 120
```

Codex/manual bridge:

```bash
npm run agent:run:bridge -- --max-ticks 500 --delay-ms 120
```

Bridge requests are written to `/tmp/sts2-llm-bridge/`.

## What Not To Commit

Do not commit:

- `node_modules/`
- `.env`
- runtime memory JSON/JSONL
- `memory/collected/`
- raw snapshots
- local logs

Commit:

- source code
- docs
- smoke fixtures embedded in tests
- `data/spire-codex/` fact cache when intentionally updated
- `derived/` strategy knowledge when reviewed

