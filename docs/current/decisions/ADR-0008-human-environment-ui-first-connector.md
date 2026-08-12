# ADR-0008: UI-First Connector Transition

Status: superseded by
[`ADR-0009`](ADR-0009-player-environment-core-boundaries.md)

Date: 2026-08-04

## Historical Decision

This decision moved the connector away from purpose-specific Bridge action
contracts toward the fair-player UI boundary. It established that a visible,
enabled native control may be exposed without reconstructing the game's rules
or proving its eventual business effect inside the connector.

The transition retained the safety shell that remains current:

- one input owner and one mutation controller;
- snapshot-bound opaque actions with Host-local native operands;
- execute-time native revalidation and game-owned Commit;
- idempotent requests and no automatic retry after unknown delivery;
- player-visible information only;
- attributed receipts and successor observation.

## Why It Was Superseded

The transition still described current behavior through Preview, Bridge,
Provider and protocol-generation history. Later revisions also mixed canonical
fair-player truth with one LLM finite-choice projection and placed generic
authority under inherited versioned directories.

ADR-0009 replaces that implementation framing with current ownership:

```text
LiveHost -> NativeUi + Identity/Control -> PlayerEnvironment -> Transport -> Consumer
```

The current protocol, implementation status and evidence boundary are defined
by the Player Environment protocol, current status and dated closeout. Nothing
in this superseded ADR freezes the current source, grants authority, or lets old
runtime evidence qualify a new artifact.

## Preserved History

The detailed transition arguments and evidence remain in dated audits and Git
history. They are useful for explaining why source-specific business witnesses,
native-page restrictions and a single LLM menu were rejected as universal C
requirements. They are not current implementation instructions.
