# Re Player Environment Integration

Re consumes `@rsgcsg/sts2-connector-client@1.0.0-rc.1` and strictly accepts
protocol `1.0-rc.2`.

```text
Connector Snapshot
-> package strict decode
-> Re current-state projection
-> complete finite model choices
-> model selects one local choice
-> Re resolves one bound_action_id
-> package REST client submits Snapshot + action + controller lease
-> Connector revalidates and delivers native input
-> Receipt + successor
-> Re supervises progress
```

The only Connector-specific Re production files are the thin adapter,
untrusted raw-state wrapper and combat presentation parser under
`src/integrations/sts2Connector/`. Wire schemas, visible-state validators, REST,
controller coordination and coherent Read aggregation come from the package.

A truncated or unavailable action projection authorizes nothing. `delivered`
proves native input delivery only, `not_delivered` requires a fresh Snapshot,
and `unknown` stops without retry. If the submit response itself is lost, Re
queries the Connector ledger once with the same `request_id`; it never submits
the action again. Re never opens the optional native-page evidence profile in
its normal decision loop.
