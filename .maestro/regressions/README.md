# Regression flows

One Maestro flow per production bug, named after its Sentry short ID
(for example `medley-123.yaml`). Flows are written by the triage agent
(`.eas/workflows/agent-triage.yml`) from Sentry breadcrumbs and session
replays, then verified red → green by `.eas/workflows/agent-fix-verify.yml`.

The whole directory runs against every push to main and nightly
(`.eas/workflows/post-release-regression.yml`), so every fixed bug
permanently guards against its own recurrence.

Conventions:

- `appId: com.schroedernathan.medley`
- Header comment: Sentry issue URL, one-line bug description, user path
- Assert on user-facing text or `testID` props, not implementation details
