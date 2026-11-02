import cron from "node-cron";
import { env } from "../config/env.js";
import {
  expireRequestsJob,
  noShowSuggestionJob,
  overdueAndAutoCompleteJob,
  prePickupRemindersJob,
  requestRemindersJob,
  vehicleConfirmationRemindersJob,
} from "./booking.jobs.js";
import { insuranceExpiryJob, staleCleanupJob } from "./admin.jobs.js";
import { recomputeAllScoresJob } from "../services/reliability.service.js";

const scheduledTasks = [];

export const startJobs = () => {
  if (!env.JOBS_ENABLED) {
    console.log(
      "Background jobs disabled by configuration (JOBS_ENABLED=false)"
    );
    return;
  }

  console.log("Starting scheduled background jobs...");

  // Expire requests: every minute
  scheduledTasks.push(
    cron.schedule("* * * * *", async () => {
      try {
        await expireRequestsJob();
      } catch (err) {
        console.error("Error in expireRequestsJob:", err);
      }
    })
  );

  // Request reminders (halfway / final): every minute
  scheduledTasks.push(
    cron.schedule("* * * * *", async () => {
      try {
        await requestRemindersJob();
      } catch (err) {
        console.error("Error in requestRemindersJob:", err);
      }
    })
  );

  // Vehicle confirmation reminders: every 5 minutes
  scheduledTasks.push(
    cron.schedule("*/5 * * * *", async () => {
      try {
        await vehicleConfirmationRemindersJob();
      } catch (err) {
        console.error("Error in vehicleConfirmationRemindersJob:", err);
      }
    })
  );

  // Pre-pickup reminders: every 5 minutes
  scheduledTasks.push(
    cron.schedule("*/5 * * * *", async () => {
      try {
        await prePickupRemindersJob();
      } catch (err) {
        console.error("Error in prePickupRemindersJob:", err);
      }
    })
  );

  // Overdue and auto-complete: every 10 minutes
  scheduledTasks.push(
    cron.schedule("*/10 * * * *", async () => {
      try {
        await overdueAndAutoCompleteJob();
      } catch (err) {
        console.error("Error in overdueAndAutoCompleteJob:", err);
      }
    })
  );

  // No-show suggestions: every 10 minutes
  scheduledTasks.push(
    cron.schedule("*/10 * * * *", async () => {
      try {
        await noShowSuggestionJob();
      } catch (err) {
        console.error("Error in noShowSuggestionJob:", err);
      }
    })
  );

  // Nightly job: recompute reliability scores from counters to correct drift (at 02:00 AM)
  scheduledTasks.push(
    cron.schedule("0 2 * * *", async () => {
      try {
        await recomputeAllScoresJob();
      } catch (err) {
        console.error("Error in recomputeAllScoresJob:", err);
      }
    })
  );

  // Daily job: insurance expiry warning and auto-pausing (at 01:00 AM)
  scheduledTasks.push(
    cron.schedule("0 1 * * *", async () => {
      try {
        await insuranceExpiryJob();
      } catch (err) {
        console.error("Error in insuranceExpiryJob:", err);
      }
    })
  );

  // Daily job: stale temp file and expired OTP cleanup (at 03:00 AM)
  scheduledTasks.push(
    cron.schedule("0 3 * * *", async () => {
      try {
        await staleCleanupJob();
      } catch (err) {
        console.error("Error in staleCleanupJob:", err);
      }
    })
  );

  console.log(`Started ${scheduledTasks.length} background cron jobs.`);
};

export const stopJobs = () => {
  for (const task of scheduledTasks) {
    task.stop();
  }
  scheduledTasks.length = 0;
};
