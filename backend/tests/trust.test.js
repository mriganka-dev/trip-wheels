import assert from "node:assert/strict";
import http from "node:http";
import app from "../src/app.js";
import {
  BOOKING_STATUS,
  ISSUE_RESOLUTION_OUTCOMES,
  ISSUE_SEVERITY,
  ISSUE_TYPES,
  REVIEW_DIRECTIONS,
} from "../src/constants.js";
import {
  calculateCustomerScore,
  calculatePublisherScore,
  CUSTOMER_PENALTIES,
  PUBLISHER_PENALTIES,
} from "../src/services/reliability.service.js";
import {
  createIssueSchema,
  resolveAdminIssueSchema,
  respondIssueSchema,
} from "../src/validators/issue.validator.js";
import {
  createReviewSchema,
  hideReviewSchema,
} from "../src/validators/review.validator.js";

const runTests = async () => {
  console.log("Running Plan 7 — Trust Layer Tests...");

  // 1. Reliability service weighting tests
  // An upheld 'undisclosed unavailability' issue lowers the publisher's score more than a late disclosure
  const basePublisher = {
    requestsReceived: 10,
    accepted: 10,
    completed: 10,
  };

  const scoreWithLateDisclosure = calculatePublisherScore({
    ...basePublisher,
    lateDisclosures: 1,
  });

  const scoreWithUndisclosedUnavailability = calculatePublisherScore({
    ...basePublisher,
    undisclosedUnavailability: 1,
  });

  assert.ok(
    scoreWithUndisclosedUnavailability < scoreWithLateDisclosure,
    "Undisclosed unavailability must lower publisher score more than late disclosure"
  );

  // Verify penalty scaling: missed confirmation (low) < late disclosure (medium) <= cancellation after confirmation < upheld issue < undisclosed unavailability (highest)
  assert.ok(
    PUBLISHER_PENALTIES.MISSED_CONFIRMATION <
      PUBLISHER_PENALTIES.LATE_DISCLOSURE,
    "Missed confirmation penalty must be lower than late disclosure"
  );
  assert.ok(
    PUBLISHER_PENALTIES.LATE_DISCLOSURE <=
      PUBLISHER_PENALTIES.CANCELLED_AFTER_CONFIRM,
    "Late disclosure penalty must be <= cancelled after confirmation"
  );
  assert.ok(
    PUBLISHER_PENALTIES.CANCELLED_AFTER_CONFIRM <
      PUBLISHER_PENALTIES.ISSUE_UPHELD,
    "Cancelled after confirmation penalty must be lower than issue upheld"
  );
  assert.ok(
    PUBLISHER_PENALTIES.ISSUE_UPHELD <
      PUBLISHER_PENALTIES.UNDISCLOSED_UNAVAILABILITY,
    "Issue upheld penalty must be lower than undisclosed unavailability"
  );

  // Score clamping between 0 and 100
  const veryLowScore = calculatePublisherScore({
    ...basePublisher,
    undisclosedUnavailability: 10,
  });
  assert.equal(veryLowScore, 0, "Score cannot drop below 0");

  const perfectScore = calculatePublisherScore({
    requestsReceived: 0,
    completed: 0,
  });
  assert.equal(perfectScore, 100, "New publisher must default to 100");

  // Customer score calculations
  const normalCustomerScore = calculateCustomerScore({
    cancellations: 1,
    noShows: 0,
    issuesUpheld: 0,
  });
  const noShowCustomerScore = calculateCustomerScore({
    cancellations: 0,
    noShows: 1,
    issuesUpheld: 0,
  });
  assert.ok(
    noShowCustomerScore < normalCustomerScore,
    "Customer no-show must penalize score more than a cancellation"
  );
  console.log(
    "Reliability score formulas and penalty weightings verified cleanly"
  );

  // 2. Validation schemas verification
  // Review schema
  const validReview = createReviewSchema.safeParse({
    rating: 5,
    comment: "Excellent vehicle and smooth handover!",
    tags: ["clean", "punctual"],
  });
  assert.equal(validReview.success, true);

  const invalidReviewRating = createReviewSchema.safeParse({
    rating: 6,
    comment: "Too high rating",
  });
  assert.equal(invalidReviewRating.success, false);

  const hideReviewValid = hideReviewSchema.safeParse({ isHidden: true });
  assert.equal(hideReviewValid.success, true);

  // Issue schema
  const validIssue = createIssueSchema.safeParse({
    type: ISSUE_TYPES.VEHICLE_MISMATCH,
    description: "Received a different vehicle model than booked",
    severity: ISSUE_SEVERITY.HIGH,
  });
  assert.equal(validIssue.success, true);

  const invalidIssueType = createIssueSchema.safeParse({
    type: "random_unknown_type",
    description: "Invalid type",
  });
  assert.equal(invalidIssueType.success, false);

  const validResponse = respondIssueSchema.safeParse({
    text: "We provided an upgrade vehicle with customer agreement.",
  });
  assert.equal(validResponse.success, true);

  const validResolution = resolveAdminIssueSchema.safeParse({
    outcome: ISSUE_RESOLUTION_OUTCOMES.UPHELD,
    adminNote: "Confirmed mismatch with uploaded photos. Applied penalty.",
    penaltyApplied: true,
  });
  assert.equal(validResolution.success, true);
  console.log("Review and Issue validation schemas verified cleanly");

  // 3. Route guards & public endpoints verification via HTTP
  const { Review } = await import("../src/models/review.model.js");
  Review.countDocuments = () => Promise.resolve(0);
  Review.find = () => ({
    populate: () => ({
      populate: () => ({
        sort: () => ({
          skip: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      }),
      sort: () => ({
        skip: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    }),
  });

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

  // A. Public endpoint: GET /api/v1/vehicles/:id/reviews
  const resVehicleReviews = await request(
    "/api/v1/vehicles/65f000000000000000000001/reviews",
    { method: "GET" }
  );
  assert.equal(resVehicleReviews.status, 200);
  console.log("Public vehicle reviews endpoint passed: 200 OK without auth");

  // B. Public endpoint: GET /api/v1/publishers/:id/reviews
  const resPublisherReviews = await request(
    "/api/v1/publishers/65f000000000000000000001/reviews",
    { method: "GET" }
  );
  assert.equal(resPublisherReviews.status, 200);
  console.log("Public publisher reviews endpoint passed: 200 OK without auth");

  // C. Unauthenticated review submission guard: POST /api/v1/bookings/:id/reviews
  const resReviewUnauth = await request(
    "/api/v1/bookings/65f000000000000000000001/reviews",
    { method: "POST", body: { rating: 5 } }
  );
  assert.equal(resReviewUnauth.status, 401);
  console.log(
    "Unauthenticated review submission guard passed: 401 Unauthorized"
  );

  // D. Unauthenticated issue creation guard: POST /api/v1/bookings/:id/issues
  const resIssueUnauth = await request(
    "/api/v1/bookings/65f000000000000000000001/issues",
    { method: "POST", body: { type: ISSUE_TYPES.OTHER, description: "Test" } }
  );
  assert.equal(resIssueUnauth.status, 401);
  console.log(
    "Unauthenticated issue submission guard passed: 401 Unauthorized"
  );

  // E. Unauthenticated issue list guard: GET /api/v1/issues/mine
  const resMyIssuesUnauth = await request("/api/v1/issues/mine", {
    method: "GET",
  });
  assert.equal(resMyIssuesUnauth.status, 401);
  console.log("Unauthenticated my issues route guard passed: 401 Unauthorized");

  // F. Unauthenticated admin issues guard: GET /api/v1/admin/issues
  const resAdminIssuesUnauth = await request("/api/v1/admin/issues", {
    method: "GET",
  });
  assert.equal(resAdminIssuesUnauth.status, 401);
  console.log(
    "Unauthenticated admin issues route guard passed: 401 Unauthorized"
  );

  await new Promise((resolve) => server.close(resolve));

  console.log("All Plan 7 — Trust Layer tests passed successfully.");
};

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
