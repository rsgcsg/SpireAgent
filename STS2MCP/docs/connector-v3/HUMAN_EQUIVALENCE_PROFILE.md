# Optional Human-Equivalence Evidence Profile

## Purpose

`native_pages.v1` verifies that selected semantic information can also be
reached through the native page a player would open. It is evidence tooling,
not the normal Agent information path and not mutation authority.

Semantic accessibility remains the default. The profile is disabled when its
config is absent, false or invalid.

## Fixed Page Kinds

- `run_deck`;
- `combat_draw_pile`;
- `combat_discard_pile`;
- `combat_exhaust_pile`;
- `shop_catalog`.

There is no arbitrary node, coordinate, method, reflection target or page name
input.

## Contract

Open requires `profile`, `kind`, exact `expected_state_token` and exact
`expected_runtime_instance_id`. The Gateway verifies the pre-owner and
current Inspection availability, invokes the fixed native page control and
captures page evidence.

While a session is active, normal mutation candidates are suppressed. Read
requires the same session/runtime. Return invokes the fixed native return path
and requires post-owner/state restoration. A partial open/return failure enters
`recovery_required`; it is not reported as success and must be explicitly
recovered or followed by a cold restart.

The session:

- is state- and runtime-bound;
- is read-only and operator-invoked;
- does not register a controller;
- does not enter the Command Ledger;
- does not create command or qualification authority;
- reuses only player-visible semantic reads;
- excludes hidden RNG, order and future content.

## Configuration And CLI

Configuration is written atomically to the discovered local STS2 mod config
and requires a cold load:

```bash
npm run connector -- human-profile configure --enabled true
npm run connector -- human-profile status
npm run connector -- human-profile open --kind run_deck
npm run connector -- human-profile read --session SESSION --runtime-instance-id RUNTIME
npm run connector -- human-profile return --session SESSION --runtime-instance-id RUNTIME
npm run connector -- human-profile recover --session SESSION --runtime-instance-id RUNTIME
npm run connector -- human-profile configure --enabled false
```

The REST schema is `sts2.connector.v3/human-equivalence-1`:

```text
POST /api/v3/human-equivalence/sessions
GET  /api/v3/human-equivalence/sessions/{session_id}
POST /api/v3/human-equivalence/sessions/{session_id}/return
```

## Evidence State

Implemented and fixture-tested:

- default-off config and invalid-config behavior;
- capability/CLI contract;
- exact state/runtime checks;
- open/read/return owner lifecycle;
- stale and wrong-runtime rejection;
- mutation suppression;
- partial-failure recovery;
- fixed page adapters.

Exact Preview.11 Live:

- capability advertised `enabled=false`;
- `open run_deck` returned HTTP 409
  `human_equivalence_disabled`;
- no page was opened and no authority was created.

Not yet Live-proven on the final artifact:

- enabled native page open/read/return for every kind;
- pre/post owner restoration;
- induced stale and recovery-required paths.

The profile cannot be marked complete Live evidence until those cases are
recorded on one exact loaded artifact and it is disabled/cold-loaded afterward.
