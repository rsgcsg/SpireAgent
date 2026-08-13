# Program Plan

1. Publish the standalone Connector source and client package.
2. Replace the explicit sibling SDK dependency with the exact package release.
3. Run one ordinary same-artifact Journey and record exact cross-repository
   versions without transferring authority.
4. Build product install/update/rollback UX around releases, not branches.

No step may recreate STS2 legality or the wire contract in SpireAgent.
