# Human Environment Contract Reaudit - 2026-08-10

Baseline: `aa68544c2d75e03233c0c7ecc50e1c194958b82a`

## Verdict

The Human-Equivalent execution model is the correct macro architecture, but
`preview.2` was not a clean long-term environment contract. Its behavior had
strong Live evidence; its public ownership and ontology still encoded migration
history. The accepted correction is `preview.3`, not V4 and not a return to
business commands.

## Findings

1. Public HE records imported BridgeV2/ConnectorV3 identity, visibility,
   controller, inspection and attribution types. A future host would have had
   to know obsolete implementation history.
2. `entities[]` and synthetic `controls[]` represented the same target twice,
   while affordances referenced a third target field. This was easy for an LLM
   projection but poor as a host-neutral action/reference ontology.
3. Inspection and linked-detail catalogs represented the same read-only
   capability through separate observation concepts.
4. Full artifact/game/evidence diagnostics repeated on every hot observation.
5. `surface.facts` was unversioned weak JSON. Positive projection prevented
   source authority leaks, but schema evolution was not explicit.
6. Re strict decoding protected execution, yet its current HE surface repeated
   the same entity/control split and retained historical naming.

## Decision

- retain dynamic opaque affordances, not a fixed action index;
- replace state token terminology with host-neutral snapshot identity;
- use one `elements[]` reference ontology and require every action/read target
  to exist in the current snapshot;
- use one `reads[]` catalog and keep reads non-authorizing;
- give every Surface content object a revisioned schema identifier;
- schema-version persistent, element-property and read content as well;
- keep host/game/Modset identity in capabilities and a compact exact session
  reference in observations;
- keep implementation SHA/MVID optional and host-specific, while requiring all
  hosts to expose exact runtime and environment identity;
- give Re a native affordance projection instead of Bridge-shaped legal actions;
- keep reward/reset/seed/clone/fork/terminated/truncated outside C.

## Evidence And Non-Claims

The final `preview.2` journey completed 286 decisions with no unknown delivery.
That evidence supports the retained execution semantics only. `preview.3`
currently has automated schema, boundary, Gateway and Re evidence. It does not
yet have mutation or journey evidence. It now has one exact loaded identity and
strictly decoded read-only `main_menu` snapshot; this does not prove Headless
parity, Organic evidence or qualification.

## External Checks

[W3C WebDriver](https://w3c.github.io/webdriver/) supports a language-neutral
remote environment interface with element identity and stale/interactability
semantics. [WAI-ARIA](https://www.w3.org/TR/wai-aria/) separates role and state
from strategy. [Gymnasium](https://gymnasium.farama.org/v0.28.1/api/env/)
places reset, reward, termination and truncation in the training environment
API. These are useful separation tests, not designs to copy mechanically.
External STS2 projects such as [sts2-cli](https://github.com/wuhao21/sts2-cli)
and [sts2-rl-agent](https://github.com/zhiyue/sts2-rl-agent) show self-described
Headless/ML feasibility, but do not prove fair-player parity with the Live game.

## Follow-up

Move the five V3-owned adapter-library seams into neutral NativeUi ownership,
generate tagged Surface SDK schemas, complete information parity, and build a
Live-vs-Headless conformance suite only when a second host exists.
