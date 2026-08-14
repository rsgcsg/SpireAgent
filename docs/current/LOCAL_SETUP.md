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

Ordinary Agent development consumes the immutable SDK tarball recorded in
`Re-SpireAgent/package-lock.json` and does not need Connector source.

For coordinated A+C development, sibling checkouts are optional:

```text
workspace/
|- SpireAgent/
`- STS2-Connector/
```

Temporarily install a local SDK with `npm --prefix Re-SpireAgent install
--no-save ../STS2-Connector/sdk/typescript`. Do not commit the resulting local
resolution. Run `npm run bootstrap` to return to the immutable release asset.

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
