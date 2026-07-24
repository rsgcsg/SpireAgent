# Security Policy

## Current Product Status

SpireAgent is a development project. The current STS2 Agent Bridge listens on
loopback and validates game actions, but it does not yet authenticate clients,
issue a controller lease, isolate provider credentials, or provide a
consumer-grade installer. Do not expose port `15526` beyond the local machine.

The Gateway is the only authority for player-visible facts, advertised opaque
actions, execute-time validation, and semantic completion. Re-SpireAgent,
Python MCP, and other clients must not bypass that authority.

## Secrets And Local Data

- Keep provider keys only in `Re-SpireAgent/.env.local`, an OS secret store, or
  the process environment.
- Never include `.env.local`, API keys, run records, game assemblies, installed
  DLLs, or mutable runtime state in an issue or commit.
- Treat third-party Agents and MCP clients as untrusted. The current loopback
  endpoint is not a security boundary.

## Reporting

For a vulnerability that could expose credentials, permit unauthorized game
actions, bypass state binding, retry an unknown outcome, or leak hidden game
information, use GitHub private vulnerability reporting when available. Do not
publish exploit details or credentials in a public issue.

Include the repository commit, Bridge protocol, game identity, Modset, Bridge
SHA/MVID/runtime identity, and a redacted reproduction. Do not attach the game
binary or provider output containing secrets.

## Supported Security Scope

Security fixes target the current `develop` mainline:

- `Re-SpireAgent/`
- `STS2MCP/`

The material under `archive/` is unsupported historical evidence. It must not
be deployed as a fallback.
