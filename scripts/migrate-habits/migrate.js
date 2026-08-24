#!/usr/bin/env node
/**
 * One-off migration: pushes each habit's pre-refactor entries (snapshotted
 * in ./snapshot/<slug>.json before `_data/habits/<slug>.json` was trimmed
 * down to schema-config-only) into that habit's new Google Sheet, via the
 * Worker's ingest endpoint - so the Sheet ends up with the exact same
 * history the site used to bake into HTML at build time.
 *
 * Run this once per habit, after:
 *   1. Its Google Sheet exists, is shared with the service account, and has
 *      a header row matching its entry fields (see worker/README.md).
 *   2. `_data/habits/<slug>.json`'s `sheetId` points at it.
 *   3. The Worker is deployed and WEBHOOK_SECRET is set.
 *
 * Usage:
 *   WORKER_URL=https://habits-api.sijobling.com \
 *   WEBHOOK_SECRET=... \
 *   node scripts/migrate-habits/migrate.js solitaire
 *
 *   node scripts/migrate-habits/migrate.js duolingo --dry-run
 */

const fs = require("fs");
const path = require("path");

const SNAPSHOT_DIR = path.join(__dirname, "snapshot");
const DELAY_MS = 150; // stay well under Google Sheets API's per-minute quota

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function migrateHabit(slug, { dryRun }) {
  const snapshotPath = path.join(SNAPSHOT_DIR, `${slug}.json`);
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`No snapshot found at ${snapshotPath}`);
  }
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf-8"));
  const entries = snapshot.entries || [];
  console.log(`${slug}: ${entries.length} entries to migrate`);

  if (dryRun) {
    console.log(JSON.stringify(entries.slice(0, 3), null, 2));
    console.log(`(dry run - showing first 3 of ${entries.length}, nothing sent)`);
    return;
  }

  const workerUrl = process.env.WORKER_URL;
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!workerUrl || !webhookSecret) {
    throw new Error("Set WORKER_URL and WEBHOOK_SECRET environment variables first.");
  }

  let migrated = 0;
  for (const entry of entries) {
    const response = await fetch(`${workerUrl}/habits/${slug}/entries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Habit-Webhook-Secret": webhookSecret,
      },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Failed on entry ${migrated + 1}/${entries.length} (${JSON.stringify(entry)}): ` +
          `${response.status} ${body}`
      );
    }
    migrated += 1;
    if (migrated % 50 === 0) console.log(`  ${migrated}/${entries.length}`);
    await sleep(DELAY_MS);
  }
  console.log(`${slug}: migrated ${migrated} entries`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const slug = args.find((a) => !a.startsWith("--"));

  if (!slug) {
    console.error("Usage: node scripts/migrate-habits/migrate.js <slug> [--dry-run]");
    console.error(
      `Known snapshots: ${fs
        .readdirSync(SNAPSHOT_DIR)
        .map((f) => f.replace(/\.json$/, ""))
        .join(", ")}`
    );
    process.exit(1);
  }

  await migrateHabit(slug, { dryRun });
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
