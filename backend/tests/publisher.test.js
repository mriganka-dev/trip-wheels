import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { env } from "../src/config/env.js";
import { ROLES } from "../src/constants.js";
import { User } from "../src/models/user.model.js";
import { generateSignedCloudinaryUrl } from "../src/utils/cloudinary.js";
import {
  adminRejectionSchema,
  updatePublisherProfileSchema,
  uploadDocumentSchema,
} from "../src/validators/publisher.validator.js";

const run = async () => {
  console.log("Running Publisher & Verification Tests...");

  // Mock User.findById for offline unit testing of route guards
  const originalFindById = User.findById;
  User.findById = (id) => {
    return Promise.resolve({
      _id: id,
      email: "test.customer@example.com",
      role: ROLES.CUSTOMER,
      accountStatus: "active",
    });
  };

  // 1. Validator tests
  const validAgentUpdate = updatePublisherProfileSchema.safeParse({
    businessName: "Himalayan Bike Rentals",
    businessAddress: "Mall Road, Manali",
    agentPickup: {
      address: "Shop 12, Mall Road",
      location: {
        type: "Point",
        coordinates: [77.1892, 32.2396],
      },
    },
  });
  if (!validAgentUpdate.success) {
    throw new Error("Valid agent profile update was rejected");
  }

  // Reject out-of-range coordinates
  const invalidCoords = updatePublisherProfileSchema.safeParse({
    agentPickup: {
      location: {
        type: "Point",
        coordinates: [200, 95],
      },
    },
  });
  if (invalidCoords.success) {
    throw new Error("Invalid coordinates were accepted by validator");
  }

  // Document upload validation
  const validDoc = uploadDocumentSchema.safeParse({
    type: "aadhar",
    documentNumber: "123456789012",
  });
  if (!validDoc.success) {
    throw new Error("Valid KYC document payload was rejected");
  }

  // Admin rejection reason validation
  const invalidRejection = adminRejectionSchema.safeParse({ reason: " " });
  if (invalidRejection.success) {
    throw new Error("Empty admin rejection reason was accepted");
  }

  // 2. Signed URL helper test
  const signedUrl = generateSignedCloudinaryUrl(
    "trip_wheels/kyc/test_doc",
    300
  );
  if (!signedUrl || !signedUrl.includes("test_doc")) {
    throw new Error("Signed URL generation failed");
  }
  console.log("Signed URL generated cleanly for private documents");

  // 3. HTTP route guards and access control tests
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Publisher route without auth token -> 401
    const noAuthRes = await fetch(`${baseUrl}/api/v1/publishers/profile/me`);
    const noAuthJson = await noAuthRes.json();
    if (noAuthRes.status !== 401 || noAuthJson.success !== false) {
      throw new Error(
        "Publisher route should reject unauthenticated request with 401"
      );
    }
    console.log(
      "Unauthenticated publisher route guard passed: 401 Unauthorized"
    );

    // Admin route without auth token -> 401
    const noAdminAuthRes = await fetch(`${baseUrl}/api/v1/admin/verifications`);
    const noAdminAuthJson = await noAdminAuthRes.json();
    if (noAdminAuthRes.status !== 401 || noAdminAuthJson.success !== false) {
      throw new Error(
        "Admin route should reject unauthenticated request with 401"
      );
    }
    console.log("Unauthenticated admin route guard passed: 401 Unauthorized");

    // Generate token for a customer role user to test publisher role guard
    const customerToken = jwt.sign(
      {
        _id: "60d0fe4f5311236168a109ca",
        email: "customer@example.com",
        role: ROLES.CUSTOMER,
      },
      env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    // Customer accessing publisher-only endpoint -> 403 Forbidden
    const customerOnPubRes = await fetch(
      `${baseUrl}/api/v1/publishers/profile/me`,
      {
        headers: { Authorization: `Bearer ${customerToken}` },
      }
    );
    const customerOnPubJson = await customerOnPubRes.json();
    if (
      customerOnPubRes.status !== 403 ||
      customerOnPubJson.success !== false
    ) {
      throw new Error(
        "Customer accessing publisher endpoint should receive 403"
      );
    }
    console.log(
      "Customer role blocked from publisher endpoints: 403 Forbidden"
    );

    // Customer accessing admin endpoint -> 403 Forbidden
    const customerOnAdminRes = await fetch(
      `${baseUrl}/api/v1/admin/verifications`,
      {
        headers: { Authorization: `Bearer ${customerToken}` },
      }
    );
    const customerOnAdminJson = await customerOnAdminRes.json();
    if (
      customerOnAdminRes.status !== 403 ||
      customerOnAdminJson.success !== false
    ) {
      throw new Error("Non-admin accessing admin endpoint should receive 403");
    }
    console.log("Non-admin role blocked from admin endpoints: 403 Forbidden");

    console.log("All Publisher & Verification tests passed successfully.");
  } finally {
    server.close();
  }
};

run().catch((err) => {
  console.error("Publisher test failed:", err);
  process.exit(1);
});
