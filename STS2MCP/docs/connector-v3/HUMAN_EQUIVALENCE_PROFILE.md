# Human-Equivalence: Inherited Profile And Branch Target

## Branch Status

On `human_euivalent_connector`, Human-Equivalent UI access is the target default Connector model, not merely an optional evidence profile.

The inherited `native_pages.v1` implementation remains exactly what Connector V3 built: default-off, fixed-page, read-oriented, operator-controlled and non-authorizing. No code change on this branch has yet promoted it into normal Agent flow.

## Target Meaning

Human-equivalent means the Agent may obtain information and perform actions that a normal human can currently reach through the real UI:

- direct rendered facts;
- hover, focus and tooltip reveals;
- scrolling, tabs, expansion and details;
- native page open/read/return;
- current real controls and selection affordances;
- successor states after ordinary UI actions.

Opening a native page or changing a reversible UI stage is a normal UI transition, not automatically a privileged evidence mode.

## Target Contracts

The future profile is expected to be replaced or expanded by:

```text
human-ui-observation
human-ui-reveal
human-ui-action
human-ui-receipt
menu-governance
```

Every transition binds exact state, frame, owner and control identity. Responses record delivery and successor state rather than requiring a source-specific business Outcome.

## In-Run Policy

The normal Agent may execute current human-operable in-run actions, including irreversible choices and abandon-run. The Connector does not protect run quality.

## Persistent Governance

Profile/save deletion, Mod/global settings and application exit remain separate managed operations. Quit application and destructive persistent operations are denied by default or require explicit operator policy.

## Evidence Boundary

Only the inherited disabled-profile behavior and its historical tests/Live records are currently implemented. The broader branch target has no build, load or Live evidence yet.