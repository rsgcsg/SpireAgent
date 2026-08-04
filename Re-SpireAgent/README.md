# Re-SpireAgent

Re-SpireAgent is the strict LLM consumer for Human-Equivalent C. It decodes the
current HumanSnapshot, projects finite opaque UI choices, asks the configured
model to select one, submits that exact affordance once and observes the
successor.

Re owns strategy and flow interpretation. It does not own STS2 legality,
native input, hidden information or business completion.

## Setup

From repository root:

```bash
npm run bootstrap
cp Re-SpireAgent/.env.example Re-SpireAgent/.env.local
npm run doctor
```

Put the provider key only in `.env.local` or process environment. The default
mode is `he_assisted`; set `SPIREAGENT_HE_MODE=he_pure` to disable all optional
D annotations. `STS2_MCP_PROTOCOL`, when set, may only be `he`.

## Check And Run

```bash
npm run check
```

After root `npm run deploy`, cold-start STS2 and:

```bash
npm run verify:loaded
cd Re-SpireAgent
npm run agent:run
```

The root CLI verifies source/build/install/load identity and `/api/he/*`
availability. It does not require V2 permission, trial or qualification.

## Runtime Contract

- only current `human_ui_action` opaque IDs can execute;
- state/frame/owner and exact parameters are hidden local bindings;
- `applied` means delivery, then Re observes successor;
- `not_applied` requires a fresh observation;
- `unknown` terminates and is never retried;
- one run has one Gateway controller and one executor;
- V3 is not a silent fallback.

See [integration contract](docs/HUMAN_EQUIVALENT_INTEGRATION.md). Local
`data/runs/` may contain provider output and must not be committed.
