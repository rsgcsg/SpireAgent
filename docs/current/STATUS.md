# Current Status - Human Environment Contract

Baseline date: 2026-08-10

Branch: `human_equivalent_connector`

Current source protocol is `1.0-preview.4`.

## Verdict

Human-Equivalent C is the only default product path. The canonical architecture
is one fair-player Human Environment semantic core implemented by Host profiles,
then consumed through purpose-specific projections. Live and a future Headless
host share `observe/read/interact/receipt` semantics; lifecycle, branching,
scenario mutation, acceleration, rewards and tensors are separate ports.

The verdict is **conditional freeze**. The execution core is retained, but the
public contract remains preview until a second Host and conformance fixtures
test host neutrality. Preview.4 corrects a real Preview.3 information defect:
visible enemies and other facts could exist only in `surface.content`, while
affordances exposed one ambiguous target. The public model now separates one
current `interaction`, observable `referents`, and affordance `subject_ref` plus
role-labelled arguments.

## Source And Automated Truth

Preview.4 implements:

- capabilities-owned Host/game/Modset/runtime identity;
- compact snapshot/session identity and one current interaction;
- persistent visible state plus revisioned interaction content;
- referents discovered from visible facts before action projection;
- opaque affordances with exact public subject/argument referents while native
  operands stay Host-local;
- one advertised, snapshot-bound `/api/he/reads/{read_id}` path;
- stale rejection, one controller, execute-time revalidation, idempotent
  requests, `applied/not_applied/unknown`, and unknown-no-retry;
- strict Re decoding, visible combat-context projection and finite opaque
  choice projection without V2/V3 wire or action-ID lookup.

Gateway, Re, schema, MCP and boundary tests cover these source claims. They do
not prove a Preview.4 artifact is loaded or Live-exercised.

## Latest Exact Live Evidence

The latest exact loaded artifact is historical Preview.3 source
`d650b5dc6b2104c61ee9ec16377d424d21396971`, SHA
`3a49b93c83d6a13bbd91db7fe6fbf8f5eebf6c3e435bb26dab5b977c0ff5d8eb`,
MVID `40b80c24-bc6b-4fa5-901c-7d608b2c6033`, runtime
`a0511ed3023545afb29feacc1725e4a7`, game `v0.110.1/db5d3552`, Modset status
`additional_loaded_mods`, fingerprint
`827732dae8bae2ab8f639fa956aae1da5f8ffc207f4159c9593e61870811b665`.

- `run-20260810075847-w6wvn3`: `he_pure`, 139 decisions, 98 settled, 7
  checkpoint-pending, 33 non-actionable polls, one safe stale refusal; stopped
  by repeated selector transitions.
- `run-20260810080417-5y3to9`: `he_pure`, 7 settled selector decisions;
  reproduced the repeated select/deselect supervision stop.
- `run-20260810080457-fr1fog`: `he_pure`, 22 decisions, 11 settled, 2
  checkpoint-pending and 9 transition polls; reached the completed-run
  `main_menu` boundary.

These runs prove Preview.3 observation, affordance delivery, receipts,
successors, stale refusal and a resumed bounded journey on that exact runtime.
They also prove the Preview.3 combat projection dropped visible enemy context
and could not represent card subject versus enemy target. They do not prove
Preview.4, a from-menu full journey, Organic evidence, conformance, durable
qualification or another environment.

## Remaining Limits

- Preview.4 requires per-machine build/install verification, cold-load and
  exact-runtime mutation tests. Repository truth does not imply a particular
  machine has installed or loaded the artifact; local deployment records are
  authoritative for those two evidence levels.
- The Live Host still reuses five checked V3-owned adapter-library functions.
  They are internal implementation debt, not public wire or authority.
- `interaction.content` is revisioned JSON rather than generated tagged SDK
  types; Re currently projects complete combat facts but not every context kind.
- hover, focus, tooltip, scroll and native-page open/read/return parity remains
  incomplete.
- no Headless Host, Live/Headless conformance suite, Training adapter, Search
  adapter, clone/fork port or qualification exists.

Source, test, build, installed, loaded, Live mutation, journey, conformance and
qualification remain separate evidence levels.

## Per-machine Deployment Truth

The loaded tuple above belongs only to its recorded machine and historical
runtime. Every checkout must run `npm run doctor`, `npm run deploy`, cold-start
STS2 and run `npm run verify:loaded`; build or install never proves load.
