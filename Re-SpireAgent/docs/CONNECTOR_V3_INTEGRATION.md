# Connector V3 Integration

Connector V3 is Re-SpireAgent's only live execution protocol. Re consumes one
current observation, projects bounded candidates to local opaque choices,
submits the selected command and supervises its receipt and successor.

## Ownership

The Gateway owns player-visible facts, the active input owner, operation
authority, native legality, execute-time revalidation, Commit and action-local
Outcome. Re owns:

- strict capability/control/observation/receipt decoding;
- deterministic compact Prompt projection;
- model choice from exact advertised candidates;
- client registration and one controller lease;
- submit/poll of one request ID;
- stable-successor supervision;
- append-only local evidence.

Re never adds an operand, executes a V2 action ID, reconstructs STS2 legality
or effects, infers completion, retries `unknown`, or treats Inspection,
qualification metadata or diagnostics as mutation permission.

## Current Cutover

All currently cataloged ordinary vanilla single-player families and selectors
have direct V3 consumer projections. The active V3 adapter/client/control path:

- imports no `BridgeV2RestClient` or V2 protocol;
- requests no V2 capabilities/state/action sidecar;
- accepts only `3.0-preview.11` and its exact schemas;
- strictly decodes Gateway/game/Modset/runtime/Patch identity;
- strictly decodes permission/qualification scopes and records them in run
  metadata;
- uses only current candidate command/operation/operands;
- preserves visible unsupported and known settling as different states.

Historically compiled V2/hybrid files remain regression/rollback material but
are not exported by the public production entrypoint.

## Information

On-demand `run_deck`, `combat_piles` and `shop_catalog` Inspection and
current-Surface `surface_card` linked detail use the exact state token. They
are read-only, cannot add candidates and reject stale reads.

The optional Human-equivalence profile is operator-only Gateway evidence. Re
does not invoke it in normal Agent flow and receives no authority from it.

The model receives compact projection v1: player-visible decision facts, one
exact action menu and necessary information boundaries. Full normalized
evidence remains recorded.

## Command Lifecycle

- `completed`: Gateway observed the command-specific Outcome;
- `not_executed`: rejected before native Commit;
- `pending`: poll the same request ID;
- `unknown`: application may have occurred; stop and never resubmit.

After `completed`, Re reads a fresh observation and waits for a stable next
checkpoint. It does not reinterpret the Gateway Outcome.

## Evidence

The final Preview.11 artifact has strict Re inspect, one completed menu canary,
stable successor and one Gateway stale refusal. The bounded Agent run recorded
all exact identities but failed at the first DeepSeek network request before
command submission. This is not a Journey or qualification.

## Local Validation

```bash
npm run check
npm run agent:inspect
```

A real run requires a cold-loaded exact Gateway:

```bash
npm run agent:run
```

Source, tests, build, install, load, canary, Journey, Organic evidence and
qualification remain separate.
