# Headless STS2 Future Host

Status: documentation only; implementation deferred until after C1.

Headless is a separate Host implementation, not a mode inside LiveHost. It may
eventually implement the same fair-player Player Environment semantics, but it
owns separate lifecycle, build, runtime identity and conformance evidence.

It must not inherit Live native bindings, loaded evidence or controller state.
Reset, seed, clone/fork, fast-step and scenario mutation are privileged Host
control APIs outside Player Environment C. No Headless code or proprietary game
artifact is part of the current C1 freeze gate.

See [Target Architecture](TARGET_ARCHITECTURE.md) for the bounded future split.
