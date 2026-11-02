import crypto from "crypto";
import app from "../src/app.js";
import { User } from "../src/models/user.model.js";
import { anonymizeUser } from "../src/services/user.service.js";
import { ApiError } from "../src/utils/ApiError.js";
import {
  assertBookingParticipant,
  assertOwnership,
  isOwner,
} from "../src/utils/ownership.js";

const run = async () => {
  console.log("Running Plan 9 Hardening & Deployment Verification Tests...\n");
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Health Liveness Probe
    const healthRes = await fetch(`${baseUrl}/api/v1/health`);
    const healthJson = await healthRes.json();
    if (healthRes.status !== 200 || healthJson.data?.uptime === undefined) {
      throw new Error("GET /api/v1/health failed to return healthy response");
    }
    console.log("PASS: GET /api/v1/health returned 200 with uptime.");

    // 2. Readiness Probe (returns 200 or 503 based on DB connection state)
    const readyRes = await fetch(`${baseUrl}/api/v1/ready`);
    if (readyRes.status !== 200 && readyRes.status !== 503) {
      throw new Error(
        `GET /api/v1/ready returned unexpected status: ${readyRes.status}`
      );
    }
    console.log(
      `PASS: GET /api/v1/ready returned valid probe status (${readyRes.status}).`
    );

    // 3. Request ID Middleware
    // Custom trace header
    const customTraceId = "trace-test-uuid-999";
    const traceRes = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { "x-request-id": customTraceId },
    });
    if (traceRes.headers.get("x-request-id") !== customTraceId) {
      throw new Error("X-Request-Id was not echoed from request header");
    }
    console.log("PASS: Custom X-Request-Id header correctly propagated.");

    // Generated trace header
    const autoTraceRes = await fetch(`${baseUrl}/api/v1/health`);
    const genTrace = autoTraceRes.headers.get("x-request-id");
    if (!genTrace || genTrace.length < 10) {
      throw new Error(
        "X-Request-Id was not auto-generated when header was omitted"
      );
    }
    console.log("PASS: Auto-generated X-Request-Id header validated.");

    // Request ID in error responses
    const errorRes = await fetch(
      `${baseUrl}/api/v1/unknown-route-for-testing`,
      {
        headers: { "x-request-id": "error-trace-xyz" },
      }
    );
    const errorJson = await errorRes.json();
    if (errorJson.requestId !== "error-trace-xyz") {
      throw new Error(
        "Error response did not include requestId field matching header"
      );
    }
    console.log("PASS: Request ID included in standardized error response.");

    // 4. OpenAPI Documentation Endpoints
    const docsJsonRes = await fetch(`${baseUrl}/api/v1/docs.json`);
    const docsJson = await docsJsonRes.json();
    if (docsJsonRes.status !== 200 || !docsJson.openapi?.startsWith("3.0")) {
      throw new Error(
        "GET /api/v1/docs.json failed to return valid OpenAPI 3.0 spec"
      );
    }
    console.log("PASS: GET /api/v1/docs.json serves valid OpenAPI 3 spec.");

    const docsHtmlRes = await fetch(`${baseUrl}/api/v1/docs`);
    const docsHtml = await docsHtmlRes.text();
    if (
      docsHtmlRes.status !== 200 ||
      !docsHtml.includes("swagger-ui") ||
      !docsHtml.includes("/api/v1/docs.json")
    ) {
      throw new Error("GET /api/v1/docs failed to return Swagger UI HTML page");
    }
    console.log(
      "PASS: GET /api/v1/docs serves interactive Swagger UI documentation."
    );

    // 5. Centralized Ownership Assertion Helpers
    const userA = { _id: "650000000000000000000001", role: "customer" };
    const userB = { _id: "650000000000000000000002", role: "customer" };
    const adminUser = { _id: "650000000000000000000099", role: "admin" };
    const resourceOwnedByA = { user: "650000000000000000000001", data: "test" };

    if (!isOwner(resourceOwnedByA, userA)) {
      throw new Error("isOwner should be true for owner");
    }
    if (isOwner(resourceOwnedByA, userB)) {
      throw new Error("isOwner should be false for non-owner");
    }
    if (!isOwner(resourceOwnedByA, adminUser)) {
      throw new Error("isOwner should be true for admin");
    }

    // assertOwnership throwing
    let threwOwnershipError = false;
    try {
      assertOwnership(resourceOwnedByA, userB);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 403) {
        threwOwnershipError = true;
      }
    }
    if (!threwOwnershipError) {
      throw new Error(
        "assertOwnership did not throw 403 ApiError for unauthorized user"
      );
    }
    console.log("PASS: Centralized ownership assertion helpers verified.");

    // Booking Participant Assertion
    const sampleBooking = {
      customer: "650000000000000000000001",
      publisher: "650000000000000000000002",
    };
    const participantResCustomer = assertBookingParticipant(
      sampleBooking,
      userA
    );
    if (
      !participantResCustomer.isCustomer ||
      participantResCustomer.isPublisher
    ) {
      throw new Error("assertBookingParticipant failed to identify customer");
    }
    const participantResPublisher = assertBookingParticipant(
      sampleBooking,
      userB
    );
    if (
      !participantResPublisher.isPublisher ||
      participantResPublisher.isCustomer
    ) {
      throw new Error("assertBookingParticipant failed to identify publisher");
    }
    const participantResAdmin = assertBookingParticipant(
      sampleBooking,
      adminUser
    );
    if (!participantResAdmin.isAdmin) {
      throw new Error("assertBookingParticipant failed to identify admin");
    }

    let threwParticipantError = false;
    const outsider = { _id: "650000000000000000000003", role: "customer" };
    try {
      assertBookingParticipant(sampleBooking, outsider);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 403) {
        threwParticipantError = true;
      }
    }
    if (!threwParticipantError) {
      throw new Error("assertBookingParticipant failed to block outsider");
    }
    console.log("PASS: Booking participant assertions verified.");

    // 6. User Anonymization Service Logic
    const testUserId = "650000000000000000000777";
    const fakeUserDoc = {
      _id: testUserId,
      fullName: "Real Person",
      email: "realperson@example.com",
      phone: "+919876543210",
      password: "somehashedpassword",
      refreshToken: "active-token",
      accountStatus: "active",
      isEmailVerified: true,
      avatar: { url: "https://cloudinary.com/avatar.jpg", publicId: "avatar1" },
      save: async function () {
        return this;
      },
    };

    const originalFindById = User.findById;
    User.findById = () => fakeUserDoc;

    const originalBookingFindOne =
      app.locals?.Booking?.findOne ||
      (await import("mongoose")).default.models.Booking?.findOne;
    const mongoose = (await import("mongoose")).default;
    if (mongoose.models.Booking) {
      mongoose.models.Booking.findOne = () => Promise.resolve(null);
    }
    if (mongoose.models.PublisherProfile) {
      mongoose.models.PublisherProfile.findOneAndUpdate = () =>
        Promise.resolve(null);
    }

    try {
      const anonResult = await anonymizeUser(testUserId);
      if (!anonResult.anonymized) {
        throw new Error("anonymizeUser did not report success");
      }
      if (fakeUserDoc.fullName !== "Anonymous User") {
        throw new Error("anonymizeUser did not scrub full name");
      }
      if (!fakeUserDoc.email.endsWith("@deleted.local")) {
        throw new Error(
          "anonymizeUser did not pseudonymize email to @deleted.local"
        );
      }
      if (fakeUserDoc.refreshToken !== null) {
        throw new Error("anonymizeUser did not revoke refresh token");
      }
      if (fakeUserDoc.accountStatus !== "suspended") {
        throw new Error("anonymizeUser did not suspend account");
      }
      console.log("PASS: User anonymization service logic verified.");
    } finally {
      User.findById = originalFindById;
      if (mongoose.models.Booking && originalBookingFindOne) {
        mongoose.models.Booking.findOne = originalBookingFindOne;
      }
    }

    console.log(
      "\nAll Plan 9 hardening and deployment verification tests passed!"
    );
  } finally {
    server.close();
  }
};

run().catch((err) => {
  console.error("Hardening test failed:", err);
  process.exit(1);
});
