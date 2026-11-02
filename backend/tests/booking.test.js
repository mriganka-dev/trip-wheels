import assert from "node:assert/strict";
import http from "node:http";
import app from "../src/app.js";
import {
  BOOKING_STATUS,
  PICKUP_MODES,
  ROLES,
  TERMINAL_BOOKING_STATUSES,
} from "../src/constants.js";
import { serializeBooking } from "../src/services/booking.serializer.js";
import {
  canTransition,
  isTerminalStatus,
  transitionBookingStatus,
  validateTransition,
} from "../src/services/booking.stateMachine.js";
import {
  acceptBookingSchema,
  adminOverrideBookingStatusSchema,
  createBookingSchema,
  declineHandoverSchema,
  handoverSchema,
} from "../src/validators/booking.validator.js";

const runTests = async () => {
  console.log("Running Plan 6 — Booking Engine Tests...");

  // 1. State machine transition tests
  // Valid transitions
  assert.equal(
    canTransition(BOOKING_STATUS.REQUESTED, BOOKING_STATUS.CONFIRMED),
    true
  );
  assert.equal(
    canTransition(BOOKING_STATUS.REQUESTED, BOOKING_STATUS.REJECTED),
    true
  );
  assert.equal(
    canTransition(BOOKING_STATUS.REQUESTED, BOOKING_STATUS.EXPIRED),
    true
  );
  assert.equal(
    canTransition(
      BOOKING_STATUS.REQUESTED,
      BOOKING_STATUS.CANCELLED_BY_CUSTOMER
    ),
    true
  );

  assert.equal(
    canTransition(
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.CANCELLED_BY_CUSTOMER
    ),
    true
  );
  assert.equal(
    canTransition(
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.CANCELLED_BY_PUBLISHER
    ),
    true
  );
  assert.equal(
    canTransition(BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.VEHICLE_UNAVAILABLE),
    true
  );
  assert.equal(
    canTransition(BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.HANDOVER_DECLINED),
    true
  );
  assert.equal(
    canTransition(BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.NO_SHOW),
    true
  );
  assert.equal(
    canTransition(BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ONGOING),
    true
  );

  assert.equal(
    canTransition(BOOKING_STATUS.ONGOING, BOOKING_STATUS.COMPLETED),
    true
  );

  // Invalid transitions must be rejected
  assert.equal(
    canTransition(BOOKING_STATUS.REQUESTED, BOOKING_STATUS.COMPLETED),
    false
  );
  assert.equal(
    canTransition(BOOKING_STATUS.REQUESTED, BOOKING_STATUS.ONGOING),
    false
  );
  assert.equal(
    canTransition(BOOKING_STATUS.COMPLETED, BOOKING_STATUS.ONGOING),
    false
  );
  assert.equal(
    canTransition(BOOKING_STATUS.EXPIRED, BOOKING_STATUS.CONFIRMED),
    false
  );
  assert.equal(
    canTransition(BOOKING_STATUS.REJECTED, BOOKING_STATUS.CONFIRMED),
    false
  );

  assert.throws(
    () =>
      validateTransition(BOOKING_STATUS.REQUESTED, BOOKING_STATUS.COMPLETED),
    /Invalid booking status transition/
  );

  // Test transition mutation helper
  const mockBooking = {
    status: BOOKING_STATUS.REQUESTED,
    statusHistory: [],
  };
  transitionBookingStatus(
    mockBooking,
    BOOKING_STATUS.CONFIRMED,
    "user123",
    "Accepted"
  );
  assert.equal(mockBooking.status, BOOKING_STATUS.CONFIRMED);
  assert.equal(mockBooking.statusHistory.length, 1);
  assert.equal(mockBooking.statusHistory[0].status, BOOKING_STATUS.CONFIRMED);
  console.log(
    "State machine rules verified: valid transitions pass and invalid transitions reject cleanly"
  );

  // 2. Terminal statuses verification
  for (const status of TERMINAL_BOOKING_STATUSES) {
    assert.equal(isTerminalStatus(status), true);
    assert.equal(canTransition(status, BOOKING_STATUS.ONGOING), false);
  }
  console.log("Terminal booking statuses verified");

  // 3. Staged Information Reveal Serializer Tests
  const customerId = "65f000000000000000000001";
  const publisherId = "65f000000000000000000002";

  const rawBookingDoc = {
    _id: "65f000000000000000000010",
    bookingCode: "TW-000042",
    status: BOOKING_STATUS.REQUESTED,
    customer: {
      _id: customerId,
      fullName: "Alice Customer",
      phone: "919876543210",
      reliability: { score: 100, cancellations: 0 },
    },
    publisher: {
      _id: publisherId,
      fullName: "Bob Publisher",
      phone: "919123456789",
    },
    vehicle: {
      _id: "65f000000000000000000020",
      brand: "Honda",
      model: "Activa 6G",
      chassisNumber: "ME4JF123456789012",
      registrationNumber: "GA01AB1234",
    },
    pickup: {
      mode: PICKUP_MODES.FIXED,
      address: "123 Beach Road",
      landmark: "Near Lighthouse",
      location: { type: "Point", coordinates: [73.8, 15.4] },
    },
    vehicleConfirmation: {
      confirmedAt: null,
      chassisNumber: "ME4JF123456789012",
      registrationNumber: "GA01AB1234",
    },
  };

  const customerViewer = { _id: customerId, role: ROLES.CUSTOMER };
  const publisherViewer = { _id: publisherId, role: ROLES.AGENT };
  const adminViewer = { _id: "65f000000000000000000099", role: ROLES.ADMIN };

  // A. Customer view on REQUESTED booking:
  // - Publisher phone should be redacted
  // - Agent exact pickup address and pin should be redacted
  // - Chassis and registration number should be redacted
  const customerRequestedView = serializeBooking(rawBookingDoc, customerViewer);
  assert.equal(customerRequestedView.publisher.phone, undefined);
  assert.equal(customerRequestedView.pickup.address, undefined);
  assert.equal(customerRequestedView.pickup.location, undefined);
  assert.equal(
    customerRequestedView.vehicleConfirmation.chassisNumber,
    undefined
  );
  assert.equal(
    customerRequestedView.vehicleConfirmation.registrationNumber,
    undefined
  );
  assert.equal(customerRequestedView.publisher.fullName, "Bob Publisher");

  // B. Publisher view on REQUESTED booking:
  // - Customer phone should be redacted
  // - Customer name and reliability should be visible
  // - Publisher sees vehicle & pickup data
  const publisherRequestedView = serializeBooking(
    rawBookingDoc,
    publisherViewer
  );
  assert.equal(publisherRequestedView.customer.phone, undefined);
  assert.equal(publisherRequestedView.customer.fullName, "Alice Customer");
  assert.equal(publisherRequestedView.customer.reliability.score, 100);

  // C. Confirmed booking view:
  const confirmedDoc = {
    ...rawBookingDoc,
    status: BOOKING_STATUS.CONFIRMED,
    vehicleConfirmation: {
      confirmedAt: new Date(),
      chassisNumber: "ME4JF123456789012",
      registrationNumber: "GA01AB1234",
    },
  };

  const customerConfirmedView = serializeBooking(confirmedDoc, customerViewer);
  // Phone revealed
  assert.equal(customerConfirmedView.publisher.phone, "919123456789");
  // Agent pickup revealed
  assert.equal(customerConfirmedView.pickup.address, "123 Beach Road");
  // Vehicle identity revealed after vehicleConfirmation.confirmedAt is set
  assert.equal(
    customerConfirmedView.vehicleConfirmation.chassisNumber,
    "ME4JF123456789012"
  );
  assert.equal(
    customerConfirmedView.vehicleConfirmation.registrationNumber,
    "GA01AB1234"
  );

  const publisherConfirmedView = serializeBooking(
    confirmedDoc,
    publisherViewer
  );
  // Customer phone revealed after confirmation
  assert.equal(publisherConfirmedView.customer.phone, "919876543210");

  // D. Individual flexible pickup: hidden until finalizedAt
  const individualFlexibleDoc = {
    ...confirmedDoc,
    pickup: {
      mode: PICKUP_MODES.FLEXIBLE,
      address: "45 Hill Top Lane",
      landmark: "Opposite Cafe",
      location: { type: "Point", coordinates: [73.9, 15.5] },
      finalizedAt: null,
    },
  };
  const customerFlexibleUnfinalized = serializeBooking(
    individualFlexibleDoc,
    customerViewer
  );
  assert.equal(customerFlexibleUnfinalized.pickup.address, undefined);

  individualFlexibleDoc.pickup.finalizedAt = new Date();
  const customerFlexibleFinalized = serializeBooking(
    individualFlexibleDoc,
    customerViewer
  );
  assert.equal(customerFlexibleFinalized.pickup.address, "45 Hill Top Lane");

  // E. Admin sees all unredacted
  const adminView = serializeBooking(rawBookingDoc, adminViewer);
  assert.equal(adminView.publisher.phone, "919123456789");
  assert.equal(
    adminView.vehicleConfirmation.chassisNumber,
    "ME4JF123456789012"
  );
  console.log(
    "Staged information reveal serializer verified: phone, pickup point, and vehicle identity reveal rules enforced correctly"
  );

  // 4. Validator schemas verification
  // Handover validation
  const validHandover = handoverSchema.safeParse({
    customerIdVerified: true,
    licenseVerified: true,
  });
  assert.equal(validHandover.success, true);

  const invalidHandover = handoverSchema.safeParse({
    customerIdVerified: true,
    licenseVerified: false,
  });
  assert.equal(invalidHandover.success, false);

  // Decline handover validation
  const validDecline = declineHandoverSchema.safeParse({
    reason: "invalid_license",
    note: "Expired driving license",
  });
  assert.equal(validDecline.success, true);

  const invalidDecline = declineHandoverSchema.safeParse({
    reason: "unsupported_reason",
  });
  assert.equal(invalidDecline.success, false);

  // Admin override validation
  const validOverride = adminOverrideBookingStatusSchema.safeParse({
    status: BOOKING_STATUS.COMPLETED,
    note: "Customer confirmed return offline with agent",
  });
  assert.equal(validOverride.success, true);

  const shortNoteOverride = adminOverrideBookingStatusSchema.safeParse({
    status: BOOKING_STATUS.COMPLETED,
    note: "ok",
  });
  assert.equal(shortNoteOverride.success, false);
  console.log(
    "Validator schemas verified: handover checks, decline codes, and mandatory audit notes validated"
  );

  // 5. Booking route guards verification via HTTP requests
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

  // A. Unauthenticated request to /api/v1/bookings
  const resUnauth = await request("/api/v1/bookings", {
    method: "POST",
    body: {},
  });
  assert.equal(resUnauth.status, 401);
  console.log("Unauthenticated booking route guard passed: 401 Unauthorized");

  // B. Unauthenticated request to /api/v1/admin/bookings
  const resAdminUnauth = await request("/api/v1/admin/bookings", {
    method: "GET",
  });
  assert.equal(resAdminUnauth.status, 401);
  console.log(
    "Unauthenticated admin bookings route guard passed: 401 Unauthorized"
  );

  // C. Unauthenticated request to /api/v1/bookings/mine
  const resMineUnauth = await request("/api/v1/bookings/mine", {
    method: "GET",
  });
  assert.equal(resMineUnauth.status, 401);
  console.log(
    "Unauthenticated customer bookings route guard passed: 401 Unauthorized"
  );

  // D. Unauthenticated request to /api/v1/bookings/received
  const resReceivedUnauth = await request("/api/v1/bookings/received", {
    method: "GET",
  });
  assert.equal(resReceivedUnauth.status, 401);
  console.log(
    "Unauthenticated publisher bookings route guard passed: 401 Unauthorized"
  );

  await new Promise((resolve) => server.close(resolve));

  console.log("All Plan 6 — Booking Engine tests passed successfully.");
};

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
