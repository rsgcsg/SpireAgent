# Human Environment Interface Synthesis And Preview.4

Baseline: `d650b5dc6b2104c61ee9ec16377d424d21396971`

## Inputs And Method

This reaudit independently compared the two supplied architecture documents,
the pasted correction proposing one HE format, current ADR/docs, C and Re
source, Preview.3 runs, known STS2 UI/Task/Command behavior, and external
implementations. No candidate document was treated as authority.

## Finding

The correct long-term boundary is one **Human Environment semantic core with
Host profiles**, not unrelated Live/Headless APIs and not a universal simulator
API. Human-visible facts, information reachability, current interaction,
referent identity, current affordances, stale/idempotency semantics and delivery
receipts are universal. UI node discovery, main-thread dispatch, engine command
delivery, artifact identity and controller mechanics are Host-specific.

Lifecycle, branching, scenario control and acceleration are privileged Host
ports. Training reward/mask/tensors and Search trees are consumer adapters.
They must not change fair-player fact or action authority.

## Preview.3 Counterexample

Exact run `run-20260810080457-fr1fog`, decision 15, contained complete visible
combat enemies and intents in `surface.content`, but normalized A context was
`enemies: []`. Its card-play affordance exposed only the card as target; exact
enemy selection remained hidden in C-local parameters. With multiple enemies,
distinct legal actions could therefore have identical public meaning.

The root cause was architectural, not missing source authority: elements were
primarily projected from action bindings rather than independently from facts,
and the affordance model could express only one target.

## Decision And Implementation

Preview.4:

- replaces owner/surface with one current `interaction`;
- derives `referents[]` recursively from player-visible facts before actions;
- separates referent visibility from actionability;
- represents an affordance with optional `subject_ref` and role-labelled
  referent arguments;
- repeats that public binding in receipts while keeping exact native operands
  private;
- unifies Inspection and linked detail under advertised `/api/player-environment/reads/{id}`;
- makes Re preserve visible combat enemies/status/intents and exact target
  bindings;
- adds strict negative and multi-target consumer tests.

## External Pressure Tests

- WebDriver's element/stale split supports stable remote referents and stale
  refusal, but coordinate-driven browser automation is not copied.
- Gymnasium demonstrates that reset, reward and terminated/truncated belong in
  a training environment adapter rather than the fair-player C boundary.
- `wuhao21/sts2-cli` history shows that Headless correctness still requires
  engine lifecycle and target-specific fixes; a decision Host cannot be
  inferred from Live UI serialization alone.
- `Gennadiyev/STS2MCP` history shows practical state/action adapters repeatedly
  need version, preview and map fixes; exact runtime identity and conformance
  remain necessary.

## Evidence Boundary

Preview.3 has exact Live mutation and resumed-journey evidence on one artifact.
Preview.4 currently has source, strict schema, Gateway, Re, MCP and deterministic
multi-target evidence. It has no loaded, Live mutation, full journey, second
Host conformance, Organic or qualification evidence.

## Remaining Debt

The Live Host still calls five V3-owned adapter-library functions. They do not
control HE wire or authority, but their ownership is not clean. Move the actual
implementation to `NativeUi` when doing so removes ownership rather than adding
a forwarding shim. Interaction content also needs generated schemas and broader
consumer projection; information parity still lacks hover/focus/tooltip/scroll
and native-page round trips.
