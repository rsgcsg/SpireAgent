# Original SpireAgent Archive

## Archived On

2026-07-22 during repository consolidation from
`develop@55384931e1dbd2952b84e27513a02315d44ecf0d`.

## Contents

This directory retains the former root TypeScript runtime, P8/P8.5/P9--P15
plans, guarded-learning artifacts, source data, runbook material, handoffs,
and old documentation hierarchy. The original relative layout is mostly
preserved so historical references remain interpretable.

## Why It Is Archived

The active implementation is now `../../Re-SpireAgent/` plus `../../STS2MCP/`.
The archived runtime has no current Re or Gateway runtime dependency and must
not be mistaken for the current Agent, connector, permission model, or product
roadmap.

## Preservation And Extraction

- No historical evidence, license, or tracked source asset was deleted in the
  consolidation.
- Root-local ignored run data, memory, `node_modules`, and `.env.local` files
  were deliberately left outside this archive and were not inspected or moved.
- Extract an asset only through a focused current-mainline change that names an
  owner, adds tests, and does not silently revive old runtime behavior.
