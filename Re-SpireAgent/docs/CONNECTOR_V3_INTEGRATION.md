# Connector V3 Integration

Connector V3 is Re-SpireAgent's only live execution protocol. Re consumes a
current observation, projects the Gateway's bounded parameterized candidates
to local opaque choices, submits the selected command and supervises its
receipt plus successor observation.

## Ownership

The Gateway owns player-visible facts, the active input owner, command
legality, execute-time revalidation, native Commit and action-local Outcome.
Re owns strict decoding, consumer projection, model selection, request
submission, polling, successor stability and append-only local evidence.

Re never:

- looks up or executes a Bridge v2 action ID;
- adds an operand that the current V3 candidate did not advertise;
- retries an `unknown` mutation;
- derives authority from UI shape, fixtures or historical evidence;
- treats Inspection or diagnostics as mutation permission.

## Current Cutover

Direct combat commands (`play_card`, `use_potion`, `end_turn`), shop-room,
map, rest-site, event-option, treasure-room and deck-enchant controls resolve
current native objects from V3 entity/control IDs and call native legality and
Commit paths. Event and treasure candidate discovery is derived from typed
visible control/stage facts rather than `draft.Actions`; their execution does
not call Provider action closures. Source-bound families retain their own
legality and Outcome contracts. Remaining non-combat candidates temporarily
reuse mature Provider-native bindings inside the Gateway. This is bounded
migration debt, not a V2 REST fallback.

Re temporarily reads same-runtime Bridge v2 capabilities only as a
non-executable semantic/environment projection sidecar. No v2 legal action or
v2 command route enters the V3 execution path. The sidecar is removed after
V3-native detail, Inspection and authority projection reach equivalent
decision-relevant coverage.

## Receipt Rules

- `completed`: the Gateway observed the command-specific Outcome.
- `not_executed`: validation rejected before native Commit.
- `pending`: poll the same request ID.
- `unknown`: application may have occurred; terminate and never resubmit.

After `completed`, Re obtains a fresh observation and waits for a stable next
decision checkpoint. This supervision does not reinterpret the Gateway
Outcome.

## Local Validation

```bash
npm run check
npm run agent:inspect
```

`agent:inspect` is read-only. A real run requires a cold-loaded V3 Gateway:

```bash
npm run agent:run
```

Source, fixture, build, install, load, session trial and runtime journey are
separate evidence levels.
