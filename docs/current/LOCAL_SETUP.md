# Local Setup

## Agent Development

Clone SpireAgent and install the exact Connector client dependency:

```bash
git clone https://github.com/rsgcsg/SpireAgent.git
cd SpireAgent
npm run bootstrap
cp Re-SpireAgent/.env.example Re-SpireAgent/.env.local
npm run doctor
```

Keep provider keys in `.env.local` or the process environment. Do not commit
run data or provider responses.

Ordinary Agent development consumes a released STS2 Connector and does not
need Connector source. During coordinated A+C development, use sibling
checkouts:

```text
workspace/
|- SpireAgent/
`- STS2-Connector/
```

The pre-release dependency in `Re-SpireAgent/package.json` names that sibling
source explicitly. Once the package release exists, replace it with the exact
version declared by `connector-requirements.json`; do not consume a branch.

## Run

Install and verify the Connector using its own release or repository tools.
Start STS2, then:

```bash
cd Re-SpireAgent
npm run agent:run
```

Re waits for the Player Environment endpoint and strictly rejects an
unsupported protocol. It does not build, install or silently repair the game
Mod.

## Validation

```bash
npm run check
git diff --check
```

Connector Host builds, deployment and loaded identity verification belong in
the standalone Connector repository.
