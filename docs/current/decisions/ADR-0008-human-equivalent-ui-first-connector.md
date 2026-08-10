# ADR-0008: Human-Equivalent UI-First Connector

Status: Accepted and implemented on `human_equivalent_connector`

Date: 2026-08-04

Supersedes as this branch's target: ADR-0007's universal source-contract requirement. ADR-0007 remains the inherited implementation baseline and evidence history.

## Decision

The branch target is a Human-Equivalent UI-first Connector:

```text
Native STS2 UI
-> Human-Reachable Observation
-> Current UI Affordance Catalog
-> State-Bound Input Executor with C-local native binding
-> Delivery Ledger
-> Successor Observation Stream
-> Re-SpireAgent
```

The default authority boundary is what a normal human player can currently see, reveal, navigate to and operate through the real game UI. A current human-operable control does not require an exact business source, source-specific operation contract, native-effect taxonomy or business Outcome witness before it can be exposed.

## Human-Equivalent Boundary

Human-reachable information includes:

- directly rendered text, entities, resources, selection and enabled state;
- hover, focus, tooltip, scroll, expand, tab and detail information;
- information reachable by opening native deck, pile, map, shop or detail pages;
- successor states reached through ordinary UI interaction.

Human-equivalent actions include hover, focus, scroll, open, close, select, deselect, drag, drop, activate, confirm, cancel, play, use, end turn, skip, abandon run and return to menu when the real UI currently permits them.

Human-equivalent does not require physical mouse movement when an equivalent player-visible value or native control action can be obtained directly. Observation fields and actions retain provenance such as `direct_visible`, `hover_equivalent`, `native_page`, `structured_control` or `frame_pointer_fallback`.

## Run-Local Policy

The Connector does not protect the quality or survival of the current run. It may expose strategically bad, irreversible or run-ending choices, including abandoning the run.

It protects input integrity instead:

- an old request must not land on a new page;
- one input must not be delivered twice;
- one controller owns mutation at a time;
- current actionability is checked immediately before dispatch;
- delivery uncertainty is explicit and is not blindly replayed;
- successor observations remain available.

## Main-Menu Governance

Persistent or application-level management is a separate policy plane. It must classify profile creation/deletion, save-slot and cloud-save management, Mod enablement/load order, global persistent settings, quit application, process termination and destructive file actions.

Returning from a run to the main menu is ordinary gameplay. Quit application and destructive profile/save operations are denied by default or require explicit operator policy.

## Observation And Transition Model

Observation is not restricted to zero-side-effect reads. Hover, scroll, opening a native page, previewing a choice and reversible navigation may be part of normal perception because that is how a human obtains the information.

Every transition is recorded as:

```text
before snapshot ID and current owner
+ opaque target/action identity (exact native operands remain C-local)
+ delivery result
+ after snapshot ID/current owner
```

The distinction that matters is not read versus write, but human-equivalent UI transition versus non-UI engine mutation.

## Receipt Model

The default receipt describes delivery:

```text
not_applied
applied
unknown
```

It does not need to prove the complete business transaction. Re observes the
successor and reasons about gameplay consequences. `unknown` means input may
have been delivered and is never automatically retried. There is no second
pending mutation: Re may only poll the same request identity.

## Compatibility Direction

Compatibility should primarily follow the human-visible UI and structured-control contract. New cards, events, sources, versions and Mods that preserve a usable human UI should not require per-source Gateway authority by default.

Structured elements are required for authority. Unmapped custom-drawn UI is
reported as visible unsupported until a bounded native adapter provides stable
element identity and actionability. Coordinates, node paths, arbitrary methods
and reflection mutation are forbidden.

## Relationship To Connector V3

Retain reusable V3 infrastructure:

- stable state/entity/control identity;
- stale rejection;
- one-controller lease;
- idempotent request ledger;
- exact runtime provenance;
- strict Re/transport boundaries;
- observation and evidence recording.

Do not retain as universal requirements:

- exact business source for every UI operation;
- per-source mutation authority;
- source-specific Outcome before successor observation;
- unknown source automatically meaning no current UI action;
- native-page access restricted to an operator-only evidence lane.

The inherited game-side V3 endpoint remains an explicit rollback/comparison
surface. Its Re live client and executor are retired; historical protocol and
normalization code remains only for replaying old evidence. The default Re and
operator CLI use `/api/he/*`; there is no silent V3 fallback.

HE is a standalone runtime, not a `ConnectorV3Runtime` partial. Bounded V3
provider/native-adapter implementations may still be called through the small
machine-checked migration seam while each family moves under authority-neutral
`NativeUi` ownership. They do not supply HE wire types, permission,
qualification or business Outcome authority. This is one-way implementation
reuse, not a second production executor.

## Evidence Boundary

Protocol `1.0-preview.2` proved the delivery model through assisted and pure
A+C journeys, but it is historical. It does not authorize or prove the current
breaking wire revision.

## Short Freeze Amendment (2026-08-09)

The short freeze accepts the macro architecture and rejects the migration
wire as a final contract. C must naturally expose UI truth and affordances,
not serialize a business command and ask A to echo exact parameters. A owns
semantic action labels, transition context, cycle recovery and strategy. D is
outside C. The remaining legacy `surface.facts` deny-list and V3-owned adapter
implementation seams are tracked migration debt, not accepted target design.

## Human Environment Contract Amendment (2026-08-10)

`preview.2` proved the execution model but is superseded as the current wire by
`preview.3`. The public boundary is host-neutral: capabilities own full
host/game identity; observations carry snapshot/session identity, versioned
Surface content, one element ontology, exact affordances and state-bound reads.
Every targeted action/read must reference a current element.

Extensible persistent, element-property, Surface and read content is explicitly
schema-versioned. Capabilities carry a generic host identity plus optional
implementation provenance; observations carry an exact runtime/environment
reference which consumers verify against capabilities.

This amendment does not broaden C. Live and future Headless hosts may implement
the same fair-player contract. Host reset/seed/clone/fork, Training reward,
terminated/truncated/action masks, A strategy and D graders remain separate.
No previous Live evidence transfers across the breaking wire revision.

## Environment Interface Amendment (2026-08-10)

Preview.3 is superseded by Preview.4 as source truth. The macro decision remains
correct, but Preview.3's `owner + surface + elements + one target` ontology is
rejected as a universal contract:

- observable facts could remain trapped in `surface.content` unless an action
  candidate happened to reference them;
- an action with a card subject and enemy target exposed only one target field;
- Inspection and linked detail advertised one read concept but used two routes;
- Re discarded complete visible combat context and emitted empty enemies.

The canonical candidate is now:

```text
capabilities
+ snapshot/session
+ one interaction
+ observable referents
+ affordance { subject_ref, role-labelled arguments }
+ advertised state-bound reads
+ delivery receipt/successor
```

Facts produce referents independently of authority. The Host retains exact
native operands and revalidates them at execution. This is one Human Environment
semantic core with Host profiles, not one identical implementation: Live owns
UI callbacks and single-writer delivery; Headless may own engine decision
delivery. Reset/seed/save/load, clone/fork, scenario mutation and acceleration
are privileged Host ports outside C. Training and Search consume C through
their own projections.

Preview.4 is not frozen as 1.0 until a second Host or deterministic conformance
probe demonstrates equivalent fair-player meaning. Five V3-owned adapter calls
remain Live Host implementation debt and may not define public types, action
authority or Headless requirements.
