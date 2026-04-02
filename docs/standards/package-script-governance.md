# Package Script Governance

F4 requires every workspace package to expose `lint`, `typecheck`, `test`, and `build`.
The only accepted exception is a formal `N/A` approved by platform governance and registered in `scripts/ci/script-compliance-policy.json`.

## Approved N/A criteria

- `types-only`: package exports only types or schemas and is validated by downstream typechecks.
- `template-only`: package contains templates rendered in-place and does not publish a standalone build artifact.
- `shared-source-only`: package exposes shared source modules consumed directly from repository code.
- `runtime-overlay`: package only owns a tsx worker shim and reuses guarantees from validated shared packages.

## Approval flow

1. Keep the script in `package.json` and make the command explicit about `N/A`.
2. Register the package, owner, deadline, reviewer, approval date, and justification in `scripts/ci/script-compliance-policy.json`.
3. Run `pnpm workspace:audit` to regenerate the compliance report and confirm there are no missing scripts.
4. Link the updated report in the PR and keep the PR checklist item checked only after approval.

## Operational rules

- Critical packages (`auth`, `queue`, `security`, `llm-client`, `integrations`, `utils`) stay at `P1`.
- New workspaces must ship the four scripts on creation day; retroactive exceptions are not allowed.
- CI uploads the generated compliance report from `artifacts/script-compliance/`.
