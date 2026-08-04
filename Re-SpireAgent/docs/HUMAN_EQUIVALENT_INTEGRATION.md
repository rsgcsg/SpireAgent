# Re Human-Equivalent Integration

Re strictly accepts `1.0-preview.1`.

The adapter reads `/api/he/observation`, verifies runtime/MVID/SHA/Modset
coherence, and converts current affordances into finite opaque local choices.
The model never receives or constructs the exact request binding. Re rejects a
stale local choice before submission.

`applied` uses the receipt successor when present and otherwise performs a
fresh client observation for readiness; `not_applied`
requires a fresh snapshot; `unknown` stops and is never retried.

Modes:

- `he_assisted` (default): C+A plus optional non-authorizing D annotations.
- `he_pure`: C+A only; strict decode rejects any annotation envelope.

Set `SPIREAGENT_HE_MODE` in `.env.local` or the process environment. V3 is not
a fallback in either mode.
