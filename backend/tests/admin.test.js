import assert from "node:assert/strict";
import http from "node:http";
import app from "../src/app.js";
import { BUSINESS_DEFAULTS } from "../src/constants.js";
import { AuditLog } from "../src/models/auditLog.model.js";
import { Setting } from "../src/models/setting.model.js";
import { exportResourceCsv } from "../src/services/admin.service.js";
import { logAudit } from "../src/services/audit.service.js";
import {
  getSetting,
  getSettings,
  invalidateConfigCache,
  updateSettings,
} from "../src/services/config.service.js";
import {
  analyticsQuerySchema,
  auditLogQuerySchema,
  updateSettingsSchema,
} from "../src/validators/setting.validator.js";

const runTests = async () => {
  console.log(
    "Running Plan 8 — Admin Module, Settings, Audit and Analytics Tests..."
  );

  // 1. Audit log tests & sensitive data sanitization
  let createdAuditEntry = null;
  AuditLog.create = async (doc) => {
    createdAuditEntry = doc;
    return doc;
  };

  const sensitiveBefore = {
    _id: "65f000000000000000000001",
    fullName: "John Doe",
    email: "john@example.com",
    password: "$2b$10$secretHash123",
    refreshToken: "secretRefreshTokenLongString",
    otpCode: "123456",
  };

  const sensitiveAfter = {
    ...sensitiveBefore,
    accountStatus: "suspended",
  };

  await logAudit({
    actorId: "65f000000000000000000099",
    action: "suspend_user",
    targetType: "User",
    targetId: "65f000000000000000000001",
    before: sensitiveBefore,
    after: sensitiveAfter,
    ip: "127.0.0.1",
    userAgent: "Mozilla/5.0",
  });

  assert.ok(createdAuditEntry, "Audit entry must be created");
  assert.equal(createdAuditEntry.action, "suspend_user");
  assert.equal(createdAuditEntry.before.password, undefined);
  assert.equal(createdAuditEntry.before.refreshToken, undefined);
  assert.equal(createdAuditEntry.before.otpCode, undefined);
  assert.equal(createdAuditEntry.before.email, "john@example.com");
  assert.equal(createdAuditEntry.after.accountStatus, "suspended");
  console.log("Audit log creation and PII/token sanitization verified cleanly");

  // 2. Settings cache and dynamic updates
  // Mock Setting model findOne and findOneAndUpdate for offline test
  let inMemorySettingsDoc = {
    key: "default_settings",
    RESPONSE_WINDOW_HOURS: 4,
    MIN_BOOKING_LEAD_HOURS: 3,
  };

  Setting.findOne = () => ({
    lean: () => Promise.resolve(inMemorySettingsDoc),
  });

  Setting.findOneAndUpdate = (query, update) => {
    inMemorySettingsDoc = { ...inMemorySettingsDoc, ...update.$set };
    return {
      lean: () => Promise.resolve(inMemorySettingsDoc),
    };
  };

  invalidateConfigCache();

  // Initial read
  const initialHours = await getSetting("RESPONSE_WINDOW_HOURS");
  assert.equal(initialHours, 4);

  // Update setting dynamically
  await updateSettings({ RESPONSE_WINDOW_HOURS: 6 });

  // Read immediately - should reflect updated value without restart
  const updatedHours = await getSetting("RESPONSE_WINDOW_HOURS");
  assert.equal(updatedHours, 6);
  console.log(
    "Cached config service and dynamic setting update verified: change takes effect without server restart"
  );

  // 3. Validation schemas
  const validUpdate = updateSettingsSchema.safeParse({
    RESPONSE_WINDOW_HOURS: 5,
    NO_SHOW_GRACE_MINUTES: 90,
  });
  assert.equal(validUpdate.success, true);

  const invalidSetting = updateSettingsSchema.safeParse({
    RESPONSE_WINDOW_HOURS: 100, // exceeds max 48
  });
  assert.equal(invalidSetting.success, false);

  const unknownSetting = updateSettingsSchema.safeParse({
    UNKNOWN_KEY: 123,
  });
  assert.equal(
    unknownSetting.success,
    false,
    "Strict schema must reject unknown settings"
  );

  const validAuditQuery = auditLogQuerySchema.safeParse({
    action: "approve_vehicle",
    page: 1,
    limit: 20,
  });
  assert.equal(validAuditQuery.success, true);
  console.log("Setting and audit query validation schemas verified");

  // 4. CSV Export allowlist
  await assert.rejects(async () => {
    await exportResourceCsv("passwords");
  }, /Invalid resource for export/);

  await assert.rejects(async () => {
    await exportResourceCsv("settings");
  }, /Invalid resource for export/);
  console.log(
    "CSV Export allowlist verified: unallowlisted resources strictly rejected"
  );

  // 5. Admin route guards via HTTP
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const request = (path, options = {}) =>
    new Promise((resolve, reject) => {
      const req = http.request(
        `http://localhost:${port}${path}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
          },
          ...options,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve({
                status: res.statusCode,
                body: data ? JSON.parse(data) : {},
              });
            } catch (err) {
              resolve({ status: res.statusCode, body: data });
            }
          });
        }
      );
      req.on("error", reject);
      if (options.body) {
        req.write(
          typeof options.body === "string"
            ? options.body
            : JSON.stringify(options.body)
        );
      }
      req.end();
    });

  // Test admin route guards (all must return 401 unauthenticated)
  const guardedEndpoints = [
    ["GET", "/api/v1/admin/dashboard"],
    ["GET", "/api/v1/admin/users"],
    ["GET", "/api/v1/admin/settings"],
    ["PATCH", "/api/v1/admin/settings"],
    ["GET", "/api/v1/admin/audit-logs"],
    ["GET", "/api/v1/admin/analytics/overview"],
    ["GET", "/api/v1/admin/analytics/destinations"],
    ["GET", "/api/v1/admin/flags/individual-misclassification"],
    ["GET", "/api/v1/admin/watchlists/insurance-expiry"],
    ["GET", "/api/v1/admin/export/users"],
  ];

  for (const [method, path] of guardedEndpoints) {
    const res = await request(path, {
      method,
      body: method === "PATCH" ? {} : undefined,
    });
    assert.equal(
      res.status,
      401,
      `Endpoint ${path} should be guarded with 401`
    );
  }
  console.log(
    "All 10 Admin Plan 8 endpoints verified with strict authentication guards: 401 Unauthorized"
  );

  await new Promise((resolve) => server.close(resolve));

  console.log("All Plan 8 — Admin Module tests passed successfully.");
};

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
