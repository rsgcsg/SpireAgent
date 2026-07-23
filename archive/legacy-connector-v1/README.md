# Legacy Connector v1 Archive

This directory preserves the retired v1 state reconstruction and index-based
mutation implementation for historical audit only.

The active `STS2MCP` build does not compile these files and exposes no v1
endpoint. The historical state builder was not reliably read-only: for
example, treasure and fake-merchant reads could call native `ForceClick`.
That discovery is why the whole v1 HTTP surface was removed instead of being
retained as "read-only diagnostics."

Current clients must use Bridge v2 capabilities, state, bounded Inspections,
opaque state-bound actions, and command polling. Nothing in this archive grants
runtime permission or serves as a compatibility fallback.
