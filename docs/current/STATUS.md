# Current Status — Human-Equivalent Connector Branch

Baseline date: 2026-08-04

Branch: `human_euivalent_connector`

Fork point: `connectorV3@5e57e47028b780619a9cd37b0cd13aeaebddaa2a`

## Branch Verdict

ADR-0008 defines the accepted branch target. The Human-Equivalent UI-first Connector is **NOT IMPLEMENTED** and has no branch-specific build, install, load, Live, canary or qualification evidence.

The inherited Connector V3 implementation remains the executable baseline and comparison path. Preview.11/Preview.12 evidence retains only its recorded scope and does not prove Human-Equivalent behavior.

## Target Architecture

```text
Native STS2 UI
-> Human-Reachable Observation
-> Current UI Affordance Catalog
-> State/Frame-Bound Input Executor
-> Delivery Ledger
-> Successor Observation Stream
-> Re-SpireAgent
```

Exact business source, per-source operation authority and business Outcome are optional hints or assurance, not universal prerequisites for a current real UI input.

## Product Policy

Inside a run, the Connector does not protect strategy or run quality. Bad choices, irreversible choices, skipping rewards, losing and abandoning the run are permitted when the current human UI permits them.

Main-menu and persistent management form a separate governance boundary. Quit application, destructive profile/save operations and Mod/global configuration changes require explicit policy and are not automatically allowed.

## Inherited Baseline

At the fork point:

- protocol `3.0-preview.12`;
- 94 explicit operation contracts and zero fallback authority;
- exact state/interaction/entity/control binding;
- one-controller lease and request ledger;
- strict Re V3 consumer;
- Preview.12 completed journeys and Royal Stamp source-gap evidence;
- optional default-off `native_pages.v1` evidence profile.

These are reusable assets and comparison evidence, not the new target's completion state.

## Completed On This Branch

- remote branch creation;
- Human-Equivalent critical architecture audit;
- ADR-0008;
- current-truth, plan, roadmap and component-target documentation alignment.

## Not Implemented

- rendered-frame observation;
- complete structured UI tree;
- hover/focus/tooltip/scroll reveal tools;
- normal Agent native-page navigation;
- generic current-affordance execution;
- frame-bound pointer fallback;
- delivery-only receipt model;
- Human-Equivalent Re loop;
- main-menu governance runtime;
- exact-runtime A/B holdouts.

## Allowed And Forbidden Claims

Allowed: the branch has a coherent architecture target and migration plan.

Not allowed:

- Human-Equivalent protocol exists;
- source-unresolved UI can currently be executed;
- native pages are in normal Agent flow;
- UI-first has passed tests, build, install, load or Live;
- arbitrary versions or Mods are supported;
- existing V3 qualification transfers to this branch.