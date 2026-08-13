# Development And Evaluation

Re tests use contract fixtures and the installed Connector SDK. They prove
consumer decoding, normalization, selection, supervision and recording; they
do not prove real STS2 behavior.

```bash
npm --prefix Re-SpireAgent run check
npm run check:connector-requirements
npm run check:run-identity
```

Run data under `Re-SpireAgent/data/runs/` is local and untracked. Baseline and
identity tools are read-only evaluation. They may classify failures as
Connector, Agent/provider, environment or declared unsupported, but cannot
create Connector authority or qualification.

When reporting a run, include its evidence provenance and exact loaded Host,
game and Modset identity. Historical V2/V3 fields are decoded only by the
evaluation tool for predecessor comparison, never by production gameplay.
