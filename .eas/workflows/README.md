# Medley CI — Release Captain + Regression Sentinel

Agentic release pipeline built on [EAS Workflows](https://docs.expo.dev/eas/workflows/get-started/),
[Sentry](https://docs.sentry.io/) release health, and [Argent](https://github.com/software-mansion/argent)
(agentic simulator control via MCP). Designed to be portable: every
repo-specific value is an env var, a workflow input, or a single obvious line.

## The loop

```
git tag v1.2.0 ──► release-captain ──► store + Sentry release
                        ▲                      │
                        │            release-sentinel (hourly)
                  human approves               │ unhealthy?
                        ▲                      ▼
   agent-fix-verify ◄── PR ◄── agent-triage ◄──┤──► agentic repro (evidence)
   (red → green)                               └──► Slack alert
```

## Workflows

| File | Trigger | What it does |
| --- | --- | --- |
| `release-captain.yml` | tag `v*`, manual | Build (store + simulator) → **Maestro regression gate** + **agentic QA gate** (headless Claude Code driving Argent on a macOS worker) → changelog + report doc → `require-approval` (human) → store submit → Sentry release (commits, finalize, deploy). |
| `release-sentinel.yml` | cron hourly, manual | Polls Sentry release health (`scripts/release-health-gate.mjs`): crash-free session/user rates, new issues (`firstRelease`), regressions (`is:regressed`), last-hour spike. Unhealthy → Slack alert + dispatches `agent-triage.yml` + agentic on-device repro. **Dedup:** skips everything if an open `agent-fix` PR/issue/branch for the top Sentry issue already exists — each issue fires the response once, not hourly. |
| `agent-triage.yml` | cron weekdays, dispatched by sentinel | Headless Claude Code: Sentry issue → root cause (incl. best-effort Seer consult) → minimal fix → Maestro regression flow → PR labeled `agent-fix`. |
| `agent-fix-verify.yml` | PR labeled `agent-fix` | Red→green: regression flow must FAIL on the pre-fix build and PASS on the PR build. |
| `deploy.yml` | push to main | OTA update to production channel + keep a fingerprint-compatible preview build ("surfboard") available. |
| `preview.yml` / `cleanup-preview.yml` | PR / branch delete | Per-PR channel + QR preview, teardown. |
| `post-release-regression.yml` | push to main, nightly | Deterministic Maestro sweep of all known-bug flows. |

## Agent prompts (`.agents/`)

- `release-qa-prompt.md` — captain's QA gate. Contract: writes `qa-artifacts/verdict.json`
  (`{status, checks[], notes}`); the workflow fails the gate on `fail`/missing verdict.
- `repro-prompt.md` — sentinel's evidence gatherer. Contract: writes `repro-artifacts/report.md`
  (reproduced?, exact steps, suspect, confidence). Never edits code.
- `triage-prompt.md` — fix author. Contract: branch `agent/<sentry-short-id>`, PR labeled
  `agent-fix`, Maestro flow at `.maestro/regressions/<short-id>.yaml`.

## Required EAS env vars (production environment)

| Var | Purpose |
| --- | --- |
| `SENTRY_AUTH_TOKEN` | org token, scopes `org:read`, `project:read`, `event:read`, `project:releases` — health gate, release creation, triage/repro agents, build-time source maps |
| `CLAUDE_CODE_OAUTH_TOKEN` | headless Claude Code (`claude setup-token`); do not also set `ANTHROPIC_API_KEY` |
| `SLACK_WEBHOOK_URL` | alerts and release notifications |
| `GITHUB_TOKEN` | repo-scoped: triage PRs + sentinel dedup lookups |
| `EXPO_TOKEN` | lets the sentinel dispatch `agent-triage.yml` via `eas workflow:run` |
| `SENTRY_ORG`, `SENTRY_PROJECT` | optional — default to `schroeder-nathan` / `react-native` |

## Tunables

All read by `scripts/release-health-gate.mjs` (set them on the sentinel's
`health` job env, or per-run via dispatch inputs):

| Env var | Default | Meaning |
| --- | --- | --- |
| `MIN_CRASH_FREE_SESSIONS` | `99.5` | % floor before the release is unhealthy |
| `MIN_CRASH_FREE_USERS` | `99.0` | % floor for crash-free users |
| `MAX_NEW_ISSUES` | `0` | unresolved issues first seen in this release |
| `MAX_REGRESSED_ISSUES` | `0` | resolved issues that resurfaced |
| `SPIKE_DROP_PP` | `0.5` | last-hour crash-free drop (percentage points) vs period |
| `MIN_SESSIONS` | `50` | below this, verdict is "insufficient data" (healthy) |
| `STATS_PERIOD` | `24h` | health window |

Other knobs: sentinel cadence (`schedule` in `release-sentinel.yml`), QA agent
scope (`release-qa-prompt.md` checklist), approval placement
(`release-captain.yml` `approval` job), gate hardness (QA gates currently
report into the human approval via `after:`; change `approval` to
`needs: [agentic_qa, regression_gate]` to make them hard-blocking).

## Adopting this in another app

1. Copy `.eas/workflows/{release-captain,release-sentinel,agent-triage,agent-fix-verify}.yml`,
   `.agents/`, and `scripts/release-health-gate.mjs`.
2. Set the env vars above in your EAS production environment.
3. Replace repo specifics: `SENTRY_ORG`/`SENTRY_PROJECT` env vars (or the
   defaults in `release-health-gate.mjs`), the repo slug fallback in the
   sentinel dedup step, org/repo/bundle-id references inside the three
   `.agents/*.md` prompts, and the app-specific checklist in
   `release-qa-prompt.md`.
4. Ensure `eas.json` has a `simulator` build profile (iOS `simulator: true`)
   and a `production` profile with a store submit profile.
5. Sentry: use the `@sentry/react-native` Expo plugin so release names follow
   `bundleId@version+buildNumber` — that exact string is what the captain
   registers and the sentinel queries.
6. Notes: pin `@anthropic-ai/claude-code` / `@swmansion/argent` versions in
   the workflows for reproducibility; Android jobs ship as commented blocks in
   `release-captain.yml` — enable when your Android path is live.
