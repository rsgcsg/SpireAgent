# SpireAgent

SpireAgent is an Agent consumer for the real Slay the Spire 2 UI. It uses the
versioned Player Environment contract published by
[`rsgcsg/STS2-Connector`](https://github.com/rsgcsg/STS2-Connector).

This repository owns Re-SpireAgent, provider integration, prompts, progress
supervision, run recording, evaluation and product integration. It does not own
the in-game Host, wire schema, REST/MCP transport or native game execution.

## Architecture

```text
real STS2
-> standalone STS2 Connector release
-> @rsgcsg/sts2-connector-client
-> Re normalization and finite choices
-> provider decision
-> exact current BoundAction submit
-> Receipt, successor and run supervision
```

STS2 and the Connector own rules, RNG, native operands, legality, Commit paths,
controller integrity and idempotency. Re selects only an advertised opaque
action. Unknown delivery is never retried.

## Development Setup

The Agent consumes the immutable Connector SDK asset declared in
`connector-requirements.json`. A normal clone does not need Connector source or
a particular sibling directory layout.

```bash
cd SpireAgent
npm run bootstrap
cp Re-SpireAgent/.env.example Re-SpireAgent/.env.local
npm run doctor
npm run check
```

Install the matching real-game Host from the Connector release and verify its
loaded identity with the Connector tools. Start STS2, then:

```bash
cd Re-SpireAgent
npm run agent:run
```

Keep API keys only in `.env.local` or the process environment. Never commit
game assemblies, installed artifacts, run directories or provider output.

Read the [current documentation map](docs/current/DOCUMENT_MAP.md) and
[engineering guide](AGENTS.md) before editing.
