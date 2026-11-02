import webpush from "web-push";
import { env } from "../../config/env.js";
import { PushSubscription } from "../../models/pushSubscription.model.js";

let isVapidConfigured = false;

if (
  env.VAPID_PUBLIC_KEY &&
  env.VAPID_PRIVATE_KEY &&
  env.VAPID_SUBJECT &&
  !env.VAPID_PUBLIC_KEY.startsWith("dev_")
) {
  try {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );
    isVapidConfigured = true;
  } catch (err) {
    console.error("VAPID initialization error:", err.message);
  }
}

export const sendPush = async ({ userId, title, body, data }) => {
  const subscriptions = await PushSubscription.find({
    user: userId,
    isActive: true,
  });

  if (subscriptions.length === 0) {
    return {
      success: true,
      skipped: true,
      reason: "No active push subscriptions",
    };
  }

  if (!isVapidConfigured) {
    console.log(
      `[DEV PUSH SIMULATION] To User: ${userId} | Title: ${title} | Body: ${body}`
    );
    return {
      success: true,
      simulated: true,
    };
  }

  const payload = JSON.stringify({
    title,
    body,
    data: {
      ...data,
      url: data?.deepLink
        ? `${env.APP_BASE_URL}${data.deepLink}`
        : env.APP_BASE_URL,
    },
  });

  let deliveredCount = 0;
  let lastError = null;

  for (const sub of subscriptions) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSub, payload);
      sub.lastSuccessAt = new Date();
      sub.failedCount = 0;
      await sub.save();
      deliveredCount++;
    } catch (error) {
      lastError = error;
      const statusCode = error.statusCode;

      // 404 or 410 Gone indicates expired or revoked subscription
      if (statusCode === 404 || statusCode === 410) {
        sub.isActive = false;
        await sub.save();
      } else {
        sub.failedCount += 1;
        if (sub.failedCount >= 5) {
          sub.isActive = false;
        }
        await sub.save();
      }
    }
  }

  if (deliveredCount === 0 && lastError) {
    return {
      success: false,
      error: lastError.message,
    };
  }

  return {
    success: true,
    sentAt: new Date(),
    deliveredCount,
  };
};
