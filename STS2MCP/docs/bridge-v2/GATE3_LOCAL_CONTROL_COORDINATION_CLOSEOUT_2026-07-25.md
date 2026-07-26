# Gate 3 Local Control Coordination Alpha

Status: **source implemented and mechanically closed; loaded two-client
coordination conflict verified inside Preview.65. A game-command attribution
canary is blocked because the newly updated `v0.109.1` identity is correctly
diagnostic-only.**

## Decision

Gate 3 is not a local account-security system. It is a small correctness and
diagnostic boundary for a game mod with several possible loopback clients:

```text
read-only clients
  -> open capabilities/state/Inspection/command polling

mutation client
  -> register descriptive process identity
  -> acquire one runtime-bound controller lease
  -> submit opaque action with lease id + generation
  -> Gateway admission
  -> existing operation permission, legality, commit and completion pipeline
```

The implementation intentionally does **not** add passwords, OAuth, TLS,
certificates, RBAC, user accounts, encrypted local tokens or a general session
framework. Client metadata is attribution, not proof of identity. Loopback
binding and browser Origin filtering remain transport hygiene, not a claim
that a malicious local process is contained.

This is the minimum useful mechanism because state binding alone cannot tell
which of two external processes is the intended writer. The public
`wuhao21/sts2-cli` project uses a simpler single stdin/stdout controller and
therefore does not need this live multi-client coordination contract. The
upstream-style `Gennadiyev/STS2MCP` API is useful evidence that a simpler API
can work, but its historical index-action model does not solve stale,
multi-client live writes. OS-authenticated named pipes or Unix sockets remain
a future product option, not a Gate 3 prerequisite.

References:

- <https://github.com/wuhao21/sts2-cli>
- <https://github.com/Gennadiyev/STS2MCP/releases>
- <https://learn.microsoft.com/en-us/dotnet/standard/io/how-to-use-named-pipes-for-network-interprocess-communication>

## Ownership And Overlap

| Existing mechanism | Gate 3 decision |
|---|---|
| Gateway `runtime_instance_id` | Reused as the only restart epoch. No second epoch exists. |
| D3 `PermissionManager` | Remains operation/environment permission. It does not select the active client. |
| Command Ledger request-id idempotency | Remains command identity and unknown-no-retry. Gate 3 admission runs only for a new request. |
| State-bound opaque action | Remains game-state freshness and exact action identity. Lease does not make an action legal. |
| Re runtime lock | Retained as process-local duplicate-run hygiene. It cannot replace Gateway coordination across Re, MCP and tools. |
| Future Companion | May manage lifecycle, secrets and UX, but cannot become the sole lease enforcer; every write path converges in Gateway. |

The resulting order is:

```text
controller admission
  -> current advertised action lookup
  -> D3 operation permission
  -> execute-time game identity and legality
  -> native commit
  -> semantic completion
```

Coordination rejection occurs before a command enters the Ledger and therefore
cannot quarantine a D3 operation grant. A command already admitted to the
Ledger continues to completion or unknown outcome even if the lease later
expires. It is never cancelled or retried by Gate 3.

## Contract

Protocol `2.0-preview.64` adds:

- `POST /api/v2/clients/register`;
- `GET /api/v2/clients`;
- `GET /api/v2/controller`;
- `POST /api/v2/controller/acquire`;
- `POST /api/v2/controller/renew`;
- `POST /api/v2/controller/release`;
- `control_coordination` capability metadata;
- command fields `client_session_id`, `controller_lease_id` and
  `controller_generation`;
- immutable command attribution containing runtime, client product and lease
  generation.

Only mutation submission requires registration and the current lease.
Capabilities, state, coherent observation bundles, Inspection and command poll
remain open read-only operations.

The lease is in-memory, lasts 30 seconds and recommends renewal every 10
seconds. New ownership increments a runtime-local generation. Gateway restart
creates a new `runtime_instance_id`, empty registry and generation space, so
old sessions fail closed without a persistent revocation database.

## Consumers

Re-SpireAgent registers lazily before its first mutation, acquires and renews
automatically, includes exact credentials in each command, validates returned
command attribution, and best-effort releases on runtime shutdown. Read-only
`agent:inspect` does not take mutation control.

The optional Python MCP adapter uses the same endpoints immediately before a
mutation. It does not reproduce lease validity or command legality.

Direct REST writers must use the same sequence. Preview.63 writers are
intentionally incompatible with Preview.64 mutation submission; there is no
silent bypass.

## Verification

Mechanical evidence obtained:

- Gateway tests: 142 passed;
- Re tests: 175 passed;
- Re typecheck and production build: passed;
- Python MCP syntax compile: passed;
- Gateway Release build: passed with 0 warnings and 0 errors;
- `git diff --check`: passed before documentation closeout.

Covered cases include:

- one holder blocks a second writer;
- release and expiry permit takeover only with a higher generation;
- stale generation is rejected;
- duplicate client-instance registration is idempotent but metadata drift is
  rejected;
- command attribution binds runtime, client and generation;
- rejected admission does not enter the Ledger or invoke native action start;
- duplicate request-id lookup precedes lease admission;
- an admitted command remains pollable and completable after lease loss;
- Re registers, acquires, submits attributed command and releases.

## Runtime Evidence Boundary

The original build-time boundary was Preview.63:

```text
protocol 2.0-preview.63
SHA      d05b0580917c5b60acc908ec2575d2d0f8e59778da8c2379cebc0d5e72c90aa0
MVID     4836b3df-fffc-498a-b9c9-ac666adb5a5b
runtime  8aec74c19fed4a09984dc56a7e0c36ac
```

The Preview.64 Release DLL was built as SHA
`84d812ac7fba2a7e0169a7afb800b8d69e967580a941a43c037e38a3c3cec494`
but not installed over a running game. The installed and loaded Preview.63 DLL
remain SHA
`d05b0580917c5b60acc908ec2575d2d0f8e59778da8c2379cebc0d5e72c90aa0`.
That standalone Preview.64 artifact was never installed. Its behavior is now
loaded as part of Preview.65:

```text
protocol 2.0-preview.65
SHA      599a126d03e314ce6f8bd58ae47fb7af24e208ab02e008f8b593e33d5b842341
MVID     c0bfde51-1f4b-44af-a1b1-2a884cdc34ce
runtime  0b42511dd71f4c40883830de8ef3a89c
game     v0.109.1|c8c577f6|-820620422
Modset   57d2e880e45244fbd55422096ba3f218de84e79596d9097a08637a3cbbd54a88
```

A bounded wire test registered two clients, let A acquire controller
generation 2, rejected B with HTTP `409 controller_lease_held`, released A,
and observed no active controller afterward. This proves loaded coordination,
not action authority or Organic command completion. The new game identity has
no reviewed exact policy, so a game-command attribution canary would require
an unjustified permission expansion and was not run.

## Remaining Gate 3 Work

The remaining Gate 3 evidence is one Re advertised-action journey that verifies
command attribution, completion, successor state, and release. It must wait
for `v0.109.1` to receive a reviewed exact-environment policy; coordination
must not be used as a reason to bypass the version gate.

Product authentication, secret storage, plugin isolation and IPC transport are
separate product decisions. They should be implemented only when an actual
untrusted-client or distribution requirement exists.
