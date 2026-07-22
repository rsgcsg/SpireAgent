# GitHub Checklist

Before pushing this project to GitHub:

- `npm install`
- `npm run check`
- confirm `node_modules/` is absent or ignored
- confirm `.env` is not committed
- confirm runtime memory JSON/JSONL is not committed unless intentionally shared as fixtures
- confirm `memory/collected/` raw snapshots are not committed
- confirm `README.md` links deployment and steering docs
- confirm `LICENSE` exists
- confirm `.github/workflows/ci.yml` exists
- optionally refresh the portable tarball if distributing an archive

Recommended first issue labels:

- `bug`
- `state-parser`
- `mcp-action`
- `combat-policy`
- `llm-bridge`
- `memory`
- `collector-replay`
- `docs`

