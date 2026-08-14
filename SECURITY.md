# Security Policy

## Scope

This repository handles provider credentials and controls a cooperative local
Connector client. Keep keys in `Re-SpireAgent/.env.local`, an OS secret store or
the process environment. Never include keys, run records, provider output or
game binaries in issues and commits.

The STS2 Connector loopback endpoint and controller leases are not an
authentication boundary against a malicious local process. Do not expose the
endpoint beyond localhost. Host security, hidden-information boundaries,
native action validation and Connector vulnerabilities are reported to the
standalone Connector project.

## Agent Safety Boundary

Re must strictly decode the supported package contract, select only an exact
current BoundAction, preserve stale/controller binding and never retry unknown
delivery. A package resolver, fixture, prompt or run-evaluation tool cannot
grant gameplay authority.

Use private vulnerability reporting when available for credential exposure,
unauthorized action delivery, hidden-state leakage or unknown-outcome retry.
