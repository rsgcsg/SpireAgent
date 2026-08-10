# Human Environment Core And Projection Reaudit

Date: 2026-08-11

Starting source: `a808c21767eaae04f7830c9d2c40f2ac1bc0c2b6`

## Verdict

Keep the Human Environment macro architecture and revise its internal
contract. The old Preview.4 wire correctly retained one Host execution
authority, but it still let one finite LLM action projection define referent
`actionable` state, observation status and snapshot identity. Its Cartesian
expansion silently stopped at 512 combinations without declaring loss.

The long-term boundary is:

```text
canonical fair-player frame
  persistent visible summary
  current interaction content
  visible referents and state-bound reads
  current strategy-free interaction capabilities

one Host-local binding/execution authority
  exact native operands + execute-time revalidation

consumer projections
  finite bound actions (current Re)
  future typed intent resolver, tensors/masks or search edges
```

Consumer projections do not add legality. Every executable projection must
resolve to the same C-local binding table and receipt path. A typed-intent
projection is not required for the current LLM and was deliberately not added.

## Evidence

Preview.4 exact runtime `458866c580fd447d9e70e980608783b7`, artifact SHA
`a74a6452...`, MVID `f7962056-bede-4793-b925-312f62e787e3`, game
`v0.110.1/db5d3552`, completed two bounded journeys:

- `run-20260810090428-4i8i9a`: 152 decisions and a completed run boundary;
- `run-20260810105732-l1zl09`: 213 decisions and a completed run boundary.

The first run contains an exact card-subject/enemy-target delivery receipt and
successor. `run-20260810090056-n0qf8t` stopped before mutation on provider
`fetch failed`; that is A/provider evidence, not C execution evidence.

Source inspection found four concrete defects:

1. `CollectHumanReferents` recognized `*_entity_id` but not the common exact
   key `entity_id`, so visible enemies/options could depend on action bindings
   for discovery.
2. referent `actionable` was back-filled from materialized tuples rather than
   observed UI state.
3. observation `actionable` status depended on the finite menu count.
4. `ExpandParameters` silently applied `Take(512)` and exposed no projection
   completeness contract.

## Contract Decision

Preview.5 makes the canonical frame independently meaningful:

- `interaction.capabilities` describes current strategy-free verbs and roles;
- referents expose visible and optional observed `enabled/selected/focused`;
- `bound_actions` is an explicitly versioned finite projection with
  `complete/truncated/unavailable`, counts, limit and ordering;
- only a complete projection gives current Re mutation authority;
- request/receipt use `bound_action_id`;
- snapshot identity includes canonical Host binding authority but excludes
  consumer labels and finite projection ordering.

`affordance` remains a useful generic English concept, but it is no longer a
wire object that ambiguously means both HE actionability and a fully bound LLM
choice. Current interaction capabilities are HE semantics; bound actions are a
finite execution projection.

## Live And Headless

Live and a future Headless Host should share fair-player meanings for frame,
interaction, referent, read, bound action, stale behavior and receipt. They do
not need identical implementation provenance or lifecycle APIs. Reset, seed,
save/load, clone/fork, scenario mutation and acceleration are privileged Host
ports outside C. Training owns tensors, masks, rewards and termination;
Search owns branching policy/value; Replay/Test owns deterministic recording
and conformance.

This agrees with the useful separation in
[Gymnasium's environment API](https://gymnasium.farama.org/api/env/) while
rejecting reward/reset as universal C semantics. It also follows
[WebDriver's](https://www.w3.org/TR/webdriver2/) separation between element
references, command delivery and stale elements, without accepting coordinate
or arbitrary-reflection authority. Existing
[sts2-cli](https://github.com/wuhao21/sts2-cli),
[STS2MCP](https://github.com/Gennadiyev/STS2MCP) and
[CommunicationMod/spirecomm](https://github.com/ForgottenArbiter/spirecomm)
demonstrate that multiple transports can drive a Slay the Spire environment;
they do not prove one compact state/action format is HE-complete for STS2.

## Non-Claims

Preview.5 automated evidence does not prove loaded identity, Live mutation,
cross-Host conformance, Headless parity, arbitrary Mod compatibility or
qualification. Preview.4 Live evidence does not transfer across this breaking
wire revision.
