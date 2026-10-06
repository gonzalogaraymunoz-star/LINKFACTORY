# REA inside LINK Factory

REA is an investigation instrument owned by GÉNESIS. It is not a standalone LINK application.

## Runtime boundary
REA 4.0.1 performs analysis locally. Vercel cannot inspect a user's local binaries, apps, Chrome CDP endpoint or Hopper/Ghidra session. Therefore:

Factory UI → /api/rea → authenticated REA Runner → rea-agents@4.0.1 → target

The API never reports REA as operational when the runner is absent.

## Modes
- DISCOVER: obtain an evidence-backed overview.
- DIAGNOSE: inspect a target to explain a problem or mechanism.
- VERIFY: inspect the reconstruction/target and return evidence for GÉNESIS certification.

## Environment
Factory:
- REA_RUNNER_URL
- REA_RUNNER_TOKEN

Runner:
- REA_RUNNER_TOKEN
- Node >=22.19
- local access to the target and optional Hopper/Ghidra/browser prerequisites.

Start: `node scripts/rea-runner.mjs`

For remote Factory access, expose the runner only through an authenticated private tunnel/reverse proxy; do not bind this sample runner publicly. The sample binds to 127.0.0.1 intentionally.
