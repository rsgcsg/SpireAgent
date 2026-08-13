# Security Policy

## Current Product Status

SpireAgent is a development project. The STS2 Player Environment listens on
loopback and validates current bound actions, but it does not authenticate hostile local clients,
isolate provider credentials, or provide a consumer-grade installer. It
coordinates one runtime-bound mutation controller, but registration metadata
and lease IDs are not authentication and do not isolate a malicious local
process. Do not expose port `15526` beyond the local machine.

The in-game Host is the only authority for player-visible facts, advertised
opaque actions, execute-time validation and native input delivery. Re-SpireAgent,
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

Include the repository commit, Player Environment protocol, game identity, Modset, Host
SHA/MVID/runtime identity, and a redacted reproduction. Do not attach the game
binary or provider output containing secrets.

## Supported Security Scope

Security fixes target the current active implementations:

- `Re-SpireAgent/`
- `STS2MCP/`

The material under `archive/` is unsupported historical evidence. It must not
be deployed as a fallback.

No branch name, successful CI run or installed DLL is a security support claim
by itself. Report the exact source and loaded identities described in
[`docs/current/DEVELOPMENT_MODEL.md`](docs/current/DEVELOPMENT_MODEL.md).
