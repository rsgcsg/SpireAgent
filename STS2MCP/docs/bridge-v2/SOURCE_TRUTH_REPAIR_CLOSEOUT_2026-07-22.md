# Source-Truth Repair Closeout - 2026-07-22

## Verdict

The C#/Re protocol-version blocker is closed for the local exact environment.
Both sides now negotiate `2.0-preview.55`; this is not a new permission or
Organic Qualification claim.

## Repair

- C# now derives explicit `surface_kind + operation + tier` permission scopes
  from the exact-build contract manifest.
- Surface capabilities advertise only operations in those scopes, and runtime
  publication suppresses a surface if any emitted operation falls outside its
  current scope.
- `BridgeServerIdentity` now includes a path-free loaded-assembly SHA-256.
  When the digest is unavailable, mutation and Inspection authority fail closed.
- Strict-v2 no longer advertises `legacy_fallback_allowed`; a source-resolved,
  unscoped Surface returns `none_fail_closed` with no actions.
- Re and C# use `2.0-preview.55`. The unverified `.56` Discovery literal was
  removed from Re because no current C# source binding proves it.

## Evidence

| Check | Result |
|---|---|
| C# contract/runtime tests | 100 passed |
| Re typecheck and tests | passed; 153 tests passed |
| Release build | passed |
| Release SHA = installed DLL SHA = loaded Gateway SHA | `aec077054eb3da6a12c74672ca7545687206e443d75d83a527f7fd6a4a995492` |
| Loaded Gateway protocol | `2.0-preview.55` |
| Loaded Gateway MVID | `97ae1aa0-b330-4772-a5c1-9fc5afb2c743` |
| Exact game identity | `v0.109.0|c12f634d|-840572606` |
| Loaded Modset | `exact_bridge_only` |
| Re strict `agent:inspect` | negotiated and normalized the Gateway state successfully |

The verification performed a capabilities read and a read-only Re inspection
at the main menu. It submitted no command, so it does not renew any action or
completion qualification.

## Remaining Gate

Do not broaden a Surface, add an operation, or reinterpret historical evidence.
The next bounded task is one already scoped low-risk action/completion canary on
this exact loaded artifact, followed by an immediate Re replay of the resulting
state. Failure or identity drift must restore the prior DLL from the local
temporary backup and leave the affected permission scope closed.
