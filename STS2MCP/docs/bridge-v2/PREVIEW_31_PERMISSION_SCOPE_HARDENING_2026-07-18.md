# Preview.31 Permission-Scope Hardening

Date: 2026-07-18  
Protocol: `2.0-preview.31`

## Finding

Preview.30 had two separate permission representations:

- explicit build-qualified and action-canary Surface lists;
- an older empty-list branch that meant every registered Provider.

The second interpretation was unsafe. The Provider registry now includes
v0.109-only contracts, so recognizing historical v0.108 identity could have
implicitly exposed providers that were never qualified on that build.

## Fix

`BridgeSurfacePermission` is now the single Surface and Inspection permission
interpreter. Only a kind explicitly present in the current build's qualified or
canary list may publish v2 actions or answer a fixed Inspection request. Empty
lists mean no v2 authority. Capabilities, active-provider selection, and
Inspection capability/request filtering use the same helper, preventing
publication and permission reporting from drifting.

The exact v0.109 matrix remains five qualified, twelve canaries, and three
disabled. Historical v0.108 identity remains recognizable for explicit legacy
handoff, but it grants no current v2 Surface action authority.

## Evidence Boundary

This is safety hardening, not new semantic coverage. Unit tests prove empty
Surface and Inspection scopes fail closed and preserve qualified/canary
distinctions. The Release build, installed DLL SHA-256, loaded MVID, and
runtime instance were verified on 2026-07-18:

- SHA-256: `6d9db06e2d3c19fbacf2a8fb5a613bff5839f0dd0074f838f89fcd19c4f7cc6f`;
- loaded MVID: `07589587-06a0-437d-9ed8-b39441aecf21`;
- runtime instance: `d8f3256c63434f618caa1c2f28ddff51`.

The locally installed game reported
`v0.109.0|c12f634d|1833084275`, not the source-qualified
`v0.109.0|c12f634d|-840572606`. Capabilities correctly reported `untested`,
an empty action/Inspection scope, and no legal actions. This verifies the
hardening and loaded-module identity, but is neither a canary nor Organic
qualification for the changed game build. No historical or fixture result
qualifies a new Surface, and no prior Organic Journey is reassigned to this
MVID.

## Abstraction Decision

**B: internal no-authority helper.** The helper centralizes permission
interpretation only. It does not resolve Surface purpose, create actions, or
weaken purpose-specific Provider contracts.
