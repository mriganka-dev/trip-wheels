import { ADMIN_TASK_TYPES } from "../constants.js";
import { AdminTask } from "../models/adminTask.model.js";
import { PublisherProfile } from "../models/publisherProfile.model.js";
import { User } from "../models/user.model.js";

export const PUBLISHER_PENALTIES = Object.freeze({
  MISSED_CONFIRMATION: 3, // Low penalty
  LATE_DISCLOSURE: 6, // Medium penalty
  CANCELLED_AFTER_CONFIRM: 8, // Medium penalty
  ISSUE_UPHELD: 12, // High penalty
  UNDISCLOSED_UNAVAILABILITY: 25, // Highest penalty
});

export const CUSTOMER_PENALTIES = Object.freeze({
  CANCELLATION: 2, // Light penalty
  NO_SHOW: 15, // High penalty
  ISSUE_UPHELD: 20, // High penalty
});

export const PUBLISHER_RELIABILITY_WARNING_THRESHOLD = 70;
export const CUSTOMER_RELIABILITY_WARNING_THRESHOLD = 70;

export const calculatePublisherScore = (reliability = {}) => {
  const {
    requestsReceived = 0,
    accepted = 0,
    rejected = 0,
    expired = 0,
    completed = 0,
    cancelledAfterConfirm = 0,
    issuesUpheld = 0,
    lateDisclosures = 0,
    undisclosedUnavailability = 0,
    missedConfirmations = 0,
    avgResponseMinutes = 0,
  } = reliability;

  // New publisher default
  if (requestsReceived === 0 && completed === 0) {
    return 100;
  }

  let score = 100;

  // Acceptance rate penalty if below 80% with >= 3 requests
  const totalDecided = accepted + rejected + expired;
  if (totalDecided >= 3) {
    const acceptanceRate = accepted / totalDecided;
    if (acceptanceRate < 0.8) {
      score -= Math.round((0.8 - acceptanceRate) * 20);
    }
  }

  // Response time penalty if avg response > 120 mins
  if (avgResponseMinutes > 120) {
    score -= Math.min(10, Math.round((avgResponseMinutes - 120) / 30));
  }

  // Deductions by severity
  const totalDeductions =
    missedConfirmations * PUBLISHER_PENALTIES.MISSED_CONFIRMATION +
    lateDisclosures * PUBLISHER_PENALTIES.LATE_DISCLOSURE +
    cancelledAfterConfirm * PUBLISHER_PENALTIES.CANCELLED_AFTER_CONFIRM +
    issuesUpheld * PUBLISHER_PENALTIES.ISSUE_UPHELD +
    undisclosedUnavailability * PUBLISHER_PENALTIES.UNDISCLOSED_UNAVAILABILITY;

  score -= totalDeductions;

  // Completion track record bonus
  if (completed >= 5) {
    const confirmedTotal = completed + cancelledAfterConfirm;
    const completionRate = confirmedTotal > 0 ? completed / confirmedTotal : 1;
    if (completionRate >= 0.95) {
      score += 5;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

export const calculateCustomerScore = (reliability = {}) => {
  const {
    cancellations = 0,
    noShows = 0,
    issuesUpheld = 0,
    completedBookings = 0,
  } = reliability;

  if (
    cancellations === 0 &&
    noShows === 0 &&
    issuesUpheld === 0 &&
    completedBookings === 0
  ) {
    return 100;
  }

  let score = 100;
  score -= cancellations * CUSTOMER_PENALTIES.CANCELLATION;
  score -= noShows * CUSTOMER_PENALTIES.NO_SHOW;
  score -= issuesUpheld * CUSTOMER_PENALTIES.ISSUE_UPHELD;

  if (completedBookings >= 5 && noShows === 0 && issuesUpheld === 0) {
    score += 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

export const recomputePublisherReliability = async (publisherUserId) => {
  const profile = await PublisherProfile.findOne({ user: publisherUserId });
  if (!profile) return null;

  const newScore = calculatePublisherScore(profile.reliability);
  profile.reliability.score = newScore;
  await profile.save();

  // Create Admin review task if score drops below threshold
  if (newScore < PUBLISHER_RELIABILITY_WARNING_THRESHOLD) {
    const existingTask = await AdminTask.findOne({
      publisher: publisherUserId,
      type: ADMIN_TASK_TYPES.REVIEW_FLAG,
    });

    if (!existingTask) {
      await AdminTask.create({
        type: ADMIN_TASK_TYPES.REVIEW_FLAG,
        publisher: publisherUserId,
        details: {
          reason: `Publisher reliability score dropped below threshold (${newScore})`,
          score: newScore,
        },
      });
    }
  }

  return newScore;
};

export const recomputeCustomerReliability = async (customerUserId) => {
  const user = await User.findById(customerUserId);
  if (!user) return null;

  const newScore = calculateCustomerScore(user.reliability);
  if (!user.reliability) {
    user.reliability = {};
  }
  user.reliability.score = newScore;
  await user.save();

  return newScore;
};

export const recomputeAllScoresJob = async () => {
  // 1. Recompute all publisher scores
  const profiles = await PublisherProfile.find({});
  for (const profile of profiles) {
    const newScore = calculatePublisherScore(profile.reliability);
    if (profile.reliability.score !== newScore) {
      profile.reliability.score = newScore;
      await profile.save();
    }
  }

  // 2. Recompute all customer scores
  const users = await User.find({ "reliability.score": { $exists: true } });
  for (const user of users) {
    const newScore = calculateCustomerScore(user.reliability);
    if (user.reliability.score !== newScore) {
      user.reliability.score = newScore;
      await user.save();
    }
  }
};

