#!/usr/bin/env node
/**
 * Release health gate — polls Sentry for the health of a release and emits a
 * verdict for the release-sentinel workflow (.eas/workflows/release-sentinel.yml).
 *
 * Zero dependencies (Node 18+ global fetch). All configuration via env vars so
 * the script is portable to any app/org — defaults are Medley's:
 *
 *   SENTRY_AUTH_TOKEN        (required) org auth token, scopes: org:read, project:read, event:read
 *   SENTRY_ORG               default "schroeder-nathan"
 *   SENTRY_PROJECT           default "react-native"
 *   RELEASE                  optional explicit release (e.g. com.app@1.2.0+42); default: latest release
 *   STATS_PERIOD             session window, default "24h"
 *   MIN_CRASH_FREE_SESSIONS  percent, default 99.5
 *   MIN_CRASH_FREE_USERS     percent, default 99.0
 *   MAX_NEW_ISSUES           default 0  (unresolved issues first seen in this release)
 *   MAX_REGRESSED_ISSUES     default 0  (resolved issues that came back in this release)
 *   SPIKE_DROP_PP            percentage-point drop of the last hour vs the period, default 0.5
 *   MIN_SESSIONS             below this many sessions the verdict is "insufficient data" (healthy), default 50
 *   GATE_OUTPUT_FILE         KEY=VALUE lines written here for the workflow step, default "health-outputs.env"
 *
 * Exit code contract: 0 = gate ran (verdict is in the outputs, healthy OR unhealthy);
 * non-zero = the gate itself failed (bad token, API error) so the job fails loudly
 * instead of silently reporting a healthy release.
 */

import { writeFileSync } from "node:fs";

const env = (name, fallback) => {
  const v = process.env[name];
  return v === undefined || v === "" ? fallback : v;
};

const ORG = env("SENTRY_ORG", "schroeder-nathan");
const PROJECT = env("SENTRY_PROJECT", "react-native");
const TOKEN = env("SENTRY_AUTH_TOKEN");
const STATS_PERIOD = env("STATS_PERIOD", "24h");
const MIN_CRASH_FREE_SESSIONS = Number(env("MIN_CRASH_FREE_SESSIONS", "99.5"));
const MIN_CRASH_FREE_USERS = Number(env("MIN_CRASH_FREE_USERS", "99.0"));
const MAX_NEW_ISSUES = Number(env("MAX_NEW_ISSUES", "0"));
const MAX_REGRESSED_ISSUES = Number(env("MAX_REGRESSED_ISSUES", "0"));
const SPIKE_DROP_PP = Number(env("SPIKE_DROP_PP", "0.5"));
const MIN_SESSIONS = Number(env("MIN_SESSIONS", "50"));
const OUTPUT_FILE = env("GATE_OUTPUT_FILE", "health-outputs.env");

if (!TOKEN) {
  console.error("SENTRY_AUTH_TOKEN is required");
  process.exit(1);
}

// Point at a self-hosted Sentry with SENTRY_URL (e.g. https://sentry.mycorp.com).
const API = `${env("SENTRY_URL", "https://sentry.io").replace(/\/$/, "")}/api/0`;

async function sentry(path, params = {}) {
  const url = new URL(`${API}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const v of value) url.searchParams.append(key, v);
    } else if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    const hint =
      res.status === 403
        ? " (403: SENTRY_AUTH_TOKEN is likely missing scopes — the sentinel needs org:read, project:read, and event:read)"
        : "";
    throw new Error(`Sentry API ${res.status} for ${url.pathname}${hint}: ${await res.text()}`);
  }
  return res.json();
}

function writeOutputs(outputs) {
  const lines = Object.entries(outputs)
    // set-output values must be single-line
    .map(([k, v]) => `${k}=${String(v).replaceAll(/\s+/g, " ").trim()}`)
    .join("\n");
  writeFileSync(OUTPUT_FILE, `${lines}\n`);
  console.log(`\n--- outputs (${OUTPUT_FILE}) ---\n${lines}`);
}

function pct(fraction) {
  return fraction === null || fraction === undefined ? null : fraction * 100;
}

function fmt(value) {
  return value === null ? "n/a" : `${value.toFixed(3)}%`;
}

async function main() {
  // 1. Resolve the release under watch AND the numeric project id in one call.
  // The org releases list spans every project in the org, so filter to ours —
  // each entry carries the numeric project id the sessions/issues APIs want.
  // (Only needs the releases scope, unlike /projects/<org>/<slug>/.)
  const releases = await sentry(`/organizations/${ORG}/releases/`, { per_page: "100" });
  const ours = releases.filter((r) => r.projects?.some((p) => p.slug === PROJECT));
  const projectId = ours[0]?.projects.find((p) => p.slug === PROJECT)?.id;

  let release = env("RELEASE");
  if (!release) {
    release = ours[0]?.version; // list is newest-first
  } else if (!ours.some((r) => r.version === release)) {
    console.log(`Note: explicit RELEASE ${release} not in the newest 100 ${PROJECT} releases.`);
  }

  if (!release || !projectId) {
    console.log("No releases found for project — nothing to watch yet.");
    writeOutputs({
      healthy: true,
      release: "none",
      reason: "no releases exist yet",
      crash_free_sessions: "",
      crash_free_users: "",
      total_sessions: 0,
      new_issues: 0,
      regressed_issues: 0,
      top_issue_short_id: "",
      top_issue_url: "",
      summary: "No Sentry releases exist yet; sentinel idle.",
    });
    return;
  }

  console.log(`Watching release: ${release} (org ${ORG}, project ${PROJECT}, window ${STATS_PERIOD})`);
  const releaseQuery = `release:"${release}"`;

  // 3. Release health: crash-free rates + volume, with an hourly series for spike detection.
  const sessions = await sentry(`/organizations/${ORG}/sessions/`, {
    project: projectId,
    statsPeriod: STATS_PERIOD,
    interval: "1h",
    query: releaseQuery,
    field: ["crash_free_rate(session)", "crash_free_rate(user)", "sum(session)"],
  });

  const groupFor = (field) => sessions.groups.find((g) => g.totals[field] !== undefined);
  const totalSessions = groupFor("sum(session)")?.totals["sum(session)"] ?? 0;
  const crashFreeSessions = pct(groupFor("crash_free_rate(session)")?.totals["crash_free_rate(session)"] ?? null);
  const crashFreeUsers = pct(groupFor("crash_free_rate(user)")?.totals["crash_free_rate(user)"] ?? null);

  // Spike check: most recent completed hour vs the whole-period rate.
  let spike = false;
  let lastHourRate = null;
  const rateSeries = groupFor("crash_free_rate(session)")?.series["crash_free_rate(session)"] ?? [];
  const sessionSeries = groupFor("sum(session)")?.series["sum(session)"] ?? [];
  for (let i = rateSeries.length - 1; i >= 0; i--) {
    // Walk back to the newest interval that actually has sessions.
    if (rateSeries[i] !== null && (sessionSeries[i] ?? 0) >= 20) {
      lastHourRate = pct(rateSeries[i]);
      break;
    }
  }
  if (lastHourRate !== null && crashFreeSessions !== null) {
    spike = crashFreeSessions - lastHourRate > SPIKE_DROP_PP;
  }

  // 4. Issues: new in this release + regressions that resurfaced in it.
  const newIssues = await sentry(`/organizations/${ORG}/issues/`, {
    project: projectId,
    statsPeriod: STATS_PERIOD,
    query: `firstRelease:"${release}" is:unresolved`,
    sort: "freq",
  });
  const regressedIssues = await sentry(`/organizations/${ORG}/issues/`, {
    project: projectId,
    statsPeriod: STATS_PERIOD,
    query: `is:regressed ${releaseQuery}`,
    sort: "freq",
  });
  const topIssue = newIssues[0] ?? regressedIssues[0] ?? null;

  // 5. Verdict.
  const failures = [];
  const insufficientData = totalSessions < MIN_SESSIONS;
  if (insufficientData) {
    console.log(`Only ${totalSessions} sessions in window (< ${MIN_SESSIONS}); not enough adoption to judge.`);
  } else {
    if (crashFreeSessions !== null && crashFreeSessions < MIN_CRASH_FREE_SESSIONS) {
      failures.push(`crash-free sessions ${fmt(crashFreeSessions)} < ${MIN_CRASH_FREE_SESSIONS}%`);
    }
    if (crashFreeUsers !== null && crashFreeUsers < MIN_CRASH_FREE_USERS) {
      failures.push(`crash-free users ${fmt(crashFreeUsers)} < ${MIN_CRASH_FREE_USERS}%`);
    }
    if (spike) {
      failures.push(`spike: last-hour crash-free ${fmt(lastHourRate)} vs period ${fmt(crashFreeSessions)}`);
    }
    if (newIssues.length > MAX_NEW_ISSUES) {
      failures.push(`${newIssues.length} new unresolved issue(s) first seen in this release`);
    }
    if (regressedIssues.length > MAX_REGRESSED_ISSUES) {
      failures.push(`${regressedIssues.length} regressed issue(s) in this release`);
    }
  }

  const healthy = failures.length === 0;
  const summary = healthy
    ? insufficientData
      ? `Release ${release}: insufficient data (${totalSessions} sessions), treating as healthy.`
      : `Release ${release} healthy: sessions ${fmt(crashFreeSessions)}, users ${fmt(crashFreeUsers)}, 0 new/regressed issues over thresholds.`
    : `Release ${release} UNHEALTHY: ${failures.join("; ")}.`;

  console.log(`\ncrash-free sessions: ${fmt(crashFreeSessions)} (last hour: ${fmt(lastHourRate)})`);
  console.log(`crash-free users:    ${fmt(crashFreeUsers)}`);
  console.log(`sessions in window:  ${totalSessions}`);
  console.log(`new issues:          ${newIssues.length}${newIssues[0] ? ` (top: ${newIssues[0].shortId})` : ""}`);
  console.log(`regressed issues:    ${regressedIssues.length}${regressedIssues[0] ? ` (top: ${regressedIssues[0].shortId})` : ""}`);
  console.log(`\n${summary}`);

  writeOutputs({
    healthy,
    release,
    reason: healthy ? (insufficientData ? "insufficient data" : "all thresholds met") : failures.join("; "),
    crash_free_sessions: crashFreeSessions === null ? "" : crashFreeSessions.toFixed(3),
    crash_free_users: crashFreeUsers === null ? "" : crashFreeUsers.toFixed(3),
    total_sessions: totalSessions,
    new_issues: newIssues.length,
    regressed_issues: regressedIssues.length,
    top_issue_short_id: topIssue?.shortId ?? "",
    top_issue_url: topIssue?.permalink ?? "",
    summary,
  });
}

main().catch((err) => {
  console.error(`Health gate failed to run: ${err.message}`);
  process.exit(1);
});
