# Development Model

SpireAgent and STS2 Connector have independent source histories, versions and
release cycles. SpireAgent declares a protocol range, required capabilities,
an exact client package and a recommended Connector release. It does not pin a
Connector Git branch or embed Connector source.

## Change Ownership

- Change visible game facts, Reads, BoundActions, native delivery, controller
  or wire schema in `STS2-Connector`.
- Change normalization, prompts, providers, strategy, supervision or recording
  in `SpireAgent`.
- Change both only when a versioned contract change genuinely crosses the
  boundary. Release the Connector package first, then update the machine
  requirements and consumer.

For coordinated source development, sibling checkouts are explicit and may be
dirty independently. Fetching remotes is safe; automation must not merge,
rebase, reset or overwrite either worktree.

## Evidence

Always distinguish source, tests, build, install, loaded runtime, targeted Live
exercise, ordinary Journey and release. A run records the exact loaded
Connector identity it observed; it cannot transfer evidence to another
artifact or Modset.
