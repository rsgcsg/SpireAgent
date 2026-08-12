# Human-Equivalent Completion And Responsibility Reaudit

Status: superseded for current ownership and Live evidence by
[Human-Equivalent post-cutover decoupling and Live failure closeout](HUMAN_EQUIVALENT_POST_CUTOVER_DECOUPLING_AND_LIVE_FAILURE_CLOSEOUT_2026-08-09.md).
This report remains the pre-Live source audit of baseline `cd224872`.

Date: 2026-08-09

Source baseline audited: `cd224872b623665f51d33c8dcc9e28b61524e85c` on
`human_equivalent_connector`. This report records source boundaries; mutable
build/install/load identity remains a per-machine CLI fact.

## Verdict

The default product path is genuinely Human-Equivalent at the wire and
authority boundaries, but it is not full Human information parity.

```text
Native visible UI
-> /api/player-environment observation and finite affordances
-> exact state/frame/owner/entity/control validation
-> one native UI input delivery
-> applied/not_applied/unknown receipt
-> successor
-> direct Re HE decoder and opaque choice
```

Re does not look up V2/V3 action IDs, decode V3 controller payloads or silently
fall back to `/api/v3/*`. HE admission is `human_ui`; SourceContract,
permission, qualification and business Outcome do not authorize it.

The remaining architectural debt is internal: HE is implemented as a partial
of `ConnectorV3Runtime` and reuses bounded V3 providers/native adapters. This
does not create two executors or two authority resolvers, but the naming and
private dispatcher coupling obscure ownership. Move those adapters behind a
narrow native-UI library only after exact-runtime HE evidence, rather than
risk a pre-Live mechanical rewrite.

## Closed Source Gaps

- HE owns its controller wire DTOs and transport handlers.
- Request validation no longer records an empty request identity.
- `NChooseACardSelectionScreen` is source-free.
- `NDeckCardSelectScreen` is source-free for visible select, deselect, preview,
  return, native cancel and confirm controls.
- The HE path no longer special-cases `EventDeckRemovalSelection` or requires
  Luminous Choir business semantics to operate that selector.
- A repository check fails if default Re regains V3 wire/adapter dependencies,
  HE transport delegates controller routes to V3, or source-specific event
  removal publication returns to HE.

## Responsibility Map

| Component | Current responsibility | Explicit non-responsibility |
|---|---|---|
| STS2 | UI state, legality callbacks, rules, RNG and effects | Connector policy |
| C/HE Gateway | visible facts, owner/identity, affordance publication, exact target revalidation, input delivery, receipt and successor | strategy and business-effect proof |
| Re/A | strict decode, opaque choice, submit-once, successor supervision, flow interpretation and strategy | native legality or retrying unknown delivery |
| D annotation | optional source/purpose/phase explanation | publication, authority or execution |
| REST/MCP | bounded transport | rules, authority or completion |
| operator/P | build, install, identity diagnosis and rollback | claiming load or Live without runtime evidence |

## Evidence Audit

The newest local run artifacts inspected were:

- `run-20260804010048-qvbder`
- `run-20260804010126-n2yet1`
- `run-20260804010305-b8puek`
- `run-20260804010349-mlqg6i`

Each negotiated adapter `sts2-connector-v3`, protocol `3.0-preview.12`, loaded
MVID `fd3177e5-bc0c-4acd-8097-ea237957a152`, and runtime
`867402a815084c54b6d9eb0d9973aa80`. They are inherited V3 evidence only. Their
unknown-source/source-contract failures motivate HE, but do not prove HE load,
delivery, selectors, assisted/pure journeys or qualification.

At audit time the game was closed and `/api/player-environment/capabilities` was unreachable.
Therefore loaded HE identity, HE Live execution, Organic evidence and durable
qualification are all non-claims.

## Remaining Closure

Exact-runtime evidence must still cover:

1. matching loaded source/build/install SHA and MVID;
2. one ordinary `he_assisted` journey and bounded `he_pure` journey;
3. source-unclassified one-of-N and deck-card selector execution;
4. stale replacement, duplicate request and unknown-delivery negatives;
5. normal-flow Inspection/page transitions and remaining hover/scroll facts;
6. explicit policy for abandon, return-menu and destructive persistent UI.

Full Human parity, arbitrary Mod/version compatibility, visual pointer fallback
and HE qualification remain non-claims. A mapped structured surface may be
complete for that exact UI; the Connector does not claim every human-reachable
fact or custom-drawn control is mapped.
