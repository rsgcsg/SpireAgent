# Re Human-Equivalent Integration

Re strictly accepts `1.0-preview.1`.

The adapter reads `/api/he/observation`, verifies runtime/MVID/SHA/Modset
coherence, and converts current affordances into finite opaque local choices.
The model never receives or constructs the exact request binding. Re rejects a
stale local choice before submission.

Client registration and controller lease coordination also decode the HE
control schema; the default adapter has no V3 wire-schema dependency.

`applied` is adapter-confirmed delivery. Re uses the receipt successor when
present and otherwise performs a fresh client observation for readiness. A
readiness timeout becomes `executed_checkpoint_pending` and the next tick
continues observation; it does not overwrite delivery with a business failure. `not_applied`
requires a fresh snapshot; `unknown` stops and is never retried.

Modes:

- `he_assisted` (default): C+A plus optional non-authorizing D annotations.
- `he_pure`: C+A only; strict decode rejects any annotation envelope.

Set `SPIREAGENT_HE_MODE` in `.env.local` or the process environment. V3 is not
a fallback in either mode. The old V3 Re client/executor is deleted; retained
V3 schema/normalization code exists only for historical replay and comparison.
`npm run build` clears `dist/` first, so removed live adapters cannot survive as
misleading generated JavaScript on another developer's machine.
