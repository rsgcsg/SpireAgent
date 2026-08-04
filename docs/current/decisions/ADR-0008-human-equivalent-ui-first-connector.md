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
-> State/Frame-Bound Input Executor
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
before state/frame/owner
+ exact target and action
+ delivery result
+ after state/frame/owner
```

The distinction that matters is not read versus write, but human-equivalent UI transition versus non-UI engine mutation.

## Receipt Model

The default receipt describes delivery:

```text
not_applied
applied
pending_delivery
unknown_delivery
```

It does not need to prove the complete business transaction. Re observes the successor and reasons about gameplay consequences. `unknown_delivery` is not blindly retried.

## Compatibility Direction

Compatibility should primarily follow the human-visible UI and structured-control contract. New cards, events, sources, versions and Mods that preserve a usable human UI should not require per-source Gateway authority by default.

Structured controls are preferred. A bounded frame-bound pointer fallback is allowed for current visible custom-drawn UI that cannot be represented structurally. Arbitrary coordinates, node paths, methods and reflection mutation remain forbidden.

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

The inherited V3 executor remains an explicit rollback/comparison endpoint. The
default Re and operator CLI use `/api/he/*`; there is no silent V3 fallback.

## Evidence Boundary

Protocol `1.0-preview.1` implements the structured-UI core, generic affordance
delivery, successor and direct Re consumer. Source/tests/build are separate
from install/load/Live. Exact-runtime HE evidence and broad Human information
parity remain pending and are not inherited from V3.
