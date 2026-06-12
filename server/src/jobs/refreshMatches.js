"use strict";

const cron = require("node-cron");
const {
  fetchAndStoreMatches,
  hasLiveMatches,
  hasSoonMatches,
} = require("../services/footballData");

const BASELINE_SCHEDULE = "*/30 * * * *"; // every 30 min on quiet days
const LIVE_SCHEDULE = "*/2  * * * *"; // every 2 min during live/imminent matches

let activeTask = null;

function startRefreshJob(db) {
  schedule(BASELINE_SCHEDULE, db);
  console.log("Match refresh job started (baseline: every 30 min)");

  // Run one fetch immediately on startup so the DB is populated before the first cron tick
  runRefresh(db).catch((err) =>
    console.error("Initial fetch failed:", err.message),
  );
}

function schedule(cronExpr, db) {
  if (activeTask) activeTask.stop();

  activeTask = cron.schedule(cronExpr, async () => {
    await runRefresh(db);

    // After each run, check if we need to switch schedule
    const needsFast = hasLiveMatches(db) || hasSoonMatches(db);
    const isAlreadyFast = cronExpr === LIVE_SCHEDULE;

    if (needsFast && !isAlreadyFast) {
      console.log(
        "Live/upcoming matches detected — switching to 2-min refresh",
      );
      schedule(LIVE_SCHEDULE, db);
    } else if (!needsFast && isAlreadyFast) {
      console.log("No live matches — reverting to 30-min refresh");
      schedule(BASELINE_SCHEDULE, db);
    }
  });
}

async function runRefresh(db) {
  try {
    const count = await fetchAndStoreMatches(db);
    console.log(`[${new Date().toISOString()}] Refreshed ${count} matches`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Refresh error:`, err.message);
  }
}

module.exports = { startRefreshJob };
