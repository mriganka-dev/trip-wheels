import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { env } from "../src/config/env.js";
import {
  CRITICAL_NOTIFICATION_EVENTS,
  NOTIFICATION_EVENTS,
  ROLES,
} from "../src/constants.js";
import { User } from "../src/models/user.model.js";
import { sendWhatsApp } from "../src/notifications/channels/whatsapp.channel.js";
import {
  renderNotification,
  templates,
} from "../src/notifications/templates.js";
import {
  removePushSubscriptionSchema,
  savePushSubscriptionSchema,
} from "../src/validators/notification.validator.js";

const run = async () => {
  console.log("Running Notification Unit and Integration Tests...");

  // 1. Template catalog check
  const requiredEvents = [
    NOTIFICATION_EVENTS.BOOKING_REQUESTED,
    NOTIFICATION_EVENTS.BOOKING_CONFIRMED,
    NOTIFICATION_EVENTS.BOOKING_REJECTED,
    NOTIFICATION_EVENTS.BOOKING_EXPIRED,
    NOTIFICATION_EVENTS.BOOKING_CANCELLED,
    NOTIFICATION_EVENTS.BOOKING_VEHICLE_CONFIRMATION_DUE,
    NOTIFICATION_EVENTS.BOOKING_VEHICLE_CONFIRMATION_MISSED,
    NOTIFICATION_EVENTS.BOOKING_VEHICLE_UNAVAILABLE,
    NOTIFICATION_EVENTS.BOOKING_PICKUP_REMINDER,
    NOTIFICATION_EVENTS.BOOKING_COMPLETED,
    NOTIFICATION_EVENTS.ISSUE_RAISED,
    NOTIFICATION_EVENTS.ISSUE_RESOLVED,
    NOTIFICATION_EVENTS.VERIFICATION_APPROVED,
    NOTIFICATION_EVENTS.VERIFICATION_REJECTED,
    NOTIFICATION_EVENTS.VEHICLE_APPROVED,
    NOTIFICATION_EVENTS.VEHICLE_REJECTED,
    NOTIFICATION_EVENTS.ACCOUNT_SUSPENDED,
    NOTIFICATION_EVENTS.NOTIFICATIONS_TEST,
  ];

  for (const event of requiredEvents) {
    if (!templates[event]) {
      throw new Error(`Template missing for catalog event: ${event}`);
    }
    const rendered = renderNotification(event, {
      bookingCode: "TW-1001",
      bookingId: "60d0fe4f5311236168a109ca",
      vehicleName: "Classic 350",
    });
    if (!rendered.title || !rendered.body || !rendered.deepLink) {
      throw new Error(`Incomplete template rendering for: ${event}`);
    }
  }
  console.log(
    "Template catalog verified: all required events render title, body, and deepLink"
  );

  // 2. Critical events check
  const expectedCritical = [
    NOTIFICATION_EVENTS.BOOKING_REQUESTED,
    NOTIFICATION_EVENTS.BOOKING_VEHICLE_CONFIRMATION_DUE,
    NOTIFICATION_EVENTS.BOOKING_VEHICLE_CONFIRMATION_MISSED,
    NOTIFICATION_EVENTS.BOOKING_VEHICLE_UNAVAILABLE,
    NOTIFICATION_EVENTS.BOOKING_CONFIRMED,
    NOTIFICATION_EVENTS.BOOKING_PICKUP_REMINDER,
  ];

  for (const crit of expectedCritical) {
    if (!CRITICAL_NOTIFICATION_EVENTS.includes(crit)) {
      throw new Error(`Expected critical event missing: ${crit}`);
    }
  }
  console.log(
    "Critical events list verified: all 6 priority events identified"
  );

  // 3. WhatsApp channel disabled when WHATSAPP_ENABLED=false
  const waResult = await sendWhatsApp({
    phone: "919876543210",
    title: "Test",
    body: "Test",
    event: "notifications.test",
  });
  if (!waResult.skipped || waResult.reason?.indexOf("disabled") === -1) {
    throw new Error(
      "WhatsApp dispatch should be skipped when WHATSAPP_ENABLED is false"
    );
  }
  console.log("WhatsApp channel verified: disabled and skips safely");

  // 4. Push subscription validator checks
  const validPush = savePushSubscriptionSchema.safeParse({
    endpoint: "https://fcm.googleapis.com/fcm/send/sample-token",
    keys: {
      p256dh: "BMV5w7P4...",
      auth: "x0Z4...",
    },
  });
  if (!validPush.success) {
    throw new Error(
      "Valid push subscription payload was rejected by validator"
    );
  }

  const invalidPush = savePushSubscriptionSchema.safeParse({
    endpoint: "not-a-url",
    keys: { p256dh: "" },
  });
  if (invalidPush.success) {
    throw new Error("Invalid push subscription was accepted by validator");
  }

  // 5. HTTP route guards and endpoints
  User.findById = (id) =>
    Promise.resolve({
      _id: id,
      email: "subscriber@example.com",
      role: ROLES.CUSTOMER,
      accountStatus: "active",
      notificationPreferences: { email: true, push: true, inApp: true },
    });

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Unauthenticated access to /notifications -> 401
    const noAuthRes = await fetch(`${baseUrl}/api/v1/notifications`);
    const noAuthJson = await noAuthRes.json();
    if (noAuthRes.status !== 401 || noAuthJson.success !== false) {
      throw new Error(
        "Unauthenticated /notifications access should return 401"
      );
    }
    console.log(
      "Unauthenticated notifications access blocked: 401 Unauthorized"
    );

    // Authenticated access with customer token
    const customerToken = jwt.sign(
      {
        _id: "60d0fe4f5311236168a109ca",
        email: "cust@example.com",
        role: ROLES.CUSTOMER,
      },
      env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    // VAPID public key endpoint
    const vapidRes = await fetch(
      `${baseUrl}/api/v1/notifications/vapid-public-key`,
      {
        headers: { Authorization: `Bearer ${customerToken}` },
      }
    );
    const vapidJson = await vapidRes.json();
    if (vapidRes.status !== 200 || !vapidJson.success) {
      throw new Error("Failed to retrieve VAPID public key");
    }
    console.log("VAPID public key endpoint passed: 200 OK");

    // Admin tasks endpoint guard: customer role -> 403
    const adminTasksRes = await fetch(`${baseUrl}/api/v1/admin/tasks`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const adminTasksJson = await adminTasksRes.json();
    if (adminTasksRes.status !== 403 || adminTasksJson.success !== false) {
      throw new Error("Non-admin accessing /admin/tasks should receive 403");
    }
    console.log(
      "Admin tasks endpoint guard passed: 403 Forbidden for non-admin"
    );

    console.log("All Notification tests passed successfully.");
  } finally {
    server.close();
  }
};

run().catch((err) => {
  console.error("Notification test failed:", err);
  process.exit(1);
});
