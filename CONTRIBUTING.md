# Contributing To The Current Mainline

Work in the component that owns the behavior:

- Agent, prompts, recording, and connector consumption: `Re-SpireAgent/`.
- Game observation, advertised actions, validation, commit, completion, REST,
  and optional MCP adaptation: `STS2MCP/`.

Read [AGENTS.md](AGENTS.md), then the component-level guide before editing.
The root package intentionally exposes only Re checks and active Markdown-link
checks. Gateway validation needs the local game installation described in
[`STS2MCP/README.md`](STS2MCP/README.md).

GitHub Actions runs Re checks, active-document checks, connector-inventory
checks, and Python adapter syntax. It cannot build or test the C# Gateway
without proprietary local game assemblies. Every Gateway change must therefore
include the exact local test/build commands and, when runtime behavior changes,
separately scoped installed/loaded/Organic evidence.

Use [Fresh Clone And Local Deployment](docs/current/LOCAL_SETUP.md) when
preparing another development machine.

Do not treat `archive/` as a source directory. If historical code or evidence
is needed, cite it in a current decision document and make the smallest
explicit extraction possible.
