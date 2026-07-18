# Preview.43 Fail-Closed Provider Contract

Date: 2026-07-18

## Problem

Five purpose-specific card-selection providers could fail their source binding
after the resolver had already selected their business Surface kind. They then
returned that business kind with `bridge_owned` ownership but no trustworthy
contract. Re correctly rejected the contradictory wire shape, but a provider
failure should not require a client crash or a business-specific decoder to
discover that no authority exists.

## Change

`BridgeFailClosedObservation` now provides one non-authorizing failure shape:

```text
context retained for diagnosis
+ surface.kind=unsupported
+ surface.status=unsupported
+ ownership=none_fail_closed
+ legal_actions=[]
+ typed diagnostic
```

It is used by the generated-choice, deck-removal, reward-claim, combat-hand,
and combat-pile selection providers when their exact source/binding contract
cannot be established. It grants no operation, source, Surface, fallback, or
permission. The helper centralizes only the wire invariant; each provider still
owns its business source binding and semantic completion.

## Runtime Evidence

On exact game identity `v0.109.0|c12f634d|-840572606`, a Colorless Potion
opened a shared choose-a-card screen before that source had a v2 semantic
contract. The loaded preview.43 module had:

- Release/installed SHA-256:
  `885c76aae8430cf86a209807975770be8d9c7324ca3a8c4925f7af0edb41da65`
- MVID: `0275b4d6-ee4c-46e3-895a-97342a233613`
- runtime instance: `d67fd2ab5f4a4a70be49259b3aa30344`
- Modset fingerprint:
  `7e3f525f43d613c88318873d0499300812915c31fa846b944b560edf750e037a`

Re run `run-20260718170451-ib26fw` first used the potion through an existing
opaque combat action. The child state then decoded as
`unsupported + none_fail_closed` with zero actions instead of crashing or
inventing generated-card authority. This is negative safety evidence, not
qualification of Colorless Potion.

## Architecture Decision

Choice **B**: extract a small internal helper with no authority. A universal
failure Surface, universal selector, or manifest-derived permission was
rejected. A provider that cannot prove its semantic contract must stop, but the
wire-level stop shape should be uniform and independently testable.

Preview.44 supersedes the loaded artifact and separately adds a bounded
Colorless Potion source contract. Preview.43 evidence remains scoped to its own
MVID and proves only fail-closed behavior.
