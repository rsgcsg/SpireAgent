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

`BridgeSurfacePermission` is now the single Surface permission interpreter.
Only a kind explicitly present in the current build's qualified or canary list
may publish v2 actions. Empty lists mean no v2 Surface authority. Capabilities
and active-provider selection use the same helper, preventing publication and
permission reporting from drifting.

The exact v0.109 matrix remains five qualified, twelve canaries, and three
disabled. Historical v0.108 identity remains recognizable for explicit legacy
handoff, but it grants no current v2 Surface action authority.

## Evidence Boundary

This is safety hardening, not new semantic coverage. Unit tests prove empty
scope fail-closed behavior and preserve qualified/canary distinctions. Release
build, installed-module identity, and current-build read-only capabilities must
be verified before closeout. No historical or fixture result qualifies a new
Surface, and no prior Organic Journey is reassigned to preview.31.

## Abstraction Decision

**B: internal no-authority helper.** The helper centralizes permission
interpretation only. It does not resolve Surface purpose, create actions, or
weaken purpose-specific Provider contracts.
