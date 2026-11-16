import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../src/app.js";
import { env, googleEnabled, isGoogleEnabled } from "../src/config/env.js";
import { AUTH_PROVIDERS, ROLES } from "../src/constants.js";
import { requireProfileComplete } from "../src/middlewares/auth.middleware.js";
import { EmailOtp } from "../src/models/emailOtp.model.js";
import { User } from "../src/models/user.model.js";
import * as authService from "../src/services/auth.service.js";
import * as userService from "../src/services/user.service.js";

const run = async () => {
  console.log("Running Google Login Plan 1 Unit and Route Tests...\n");

  // 1. Env validation and googleEnabled helper tests
  const emptyGoogleEnv = {
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
    GOOGLE_REDIRECT_URI_CUSTOMER: "",
    GOOGLE_REDIRECT_URI_AGENT: "",
    GOOGLE_STATE_SECRET: "",
  };
  if (isGoogleEnabled(emptyGoogleEnv) !== false || googleEnabled(emptyGoogleEnv) !== false) {
    throw new Error("googleEnabled should return false when Google variables are empty");
  }

  const partialGoogleEnv = {
    GOOGLE_CLIENT_ID: "client_id_123",
    GOOGLE_CLIENT_SECRET: "",
    GOOGLE_REDIRECT_URI_CUSTOMER: "http://localhost:3000/api/v1/auth/google/callback",
    GOOGLE_REDIRECT_URI_AGENT: "",
    GOOGLE_STATE_SECRET: "secret",
  };
  if (isGoogleEnabled(partialGoogleEnv) !== false) {
    throw new Error("googleEnabled should return false when any Google variable is missing");
  }

  const fullGoogleEnv = {
    GOOGLE_CLIENT_ID: "client_id_123",
    GOOGLE_CLIENT_SECRET: "client_secret_xyz",
    GOOGLE_REDIRECT_URI_CUSTOMER: "http://localhost:3000/api/v1/auth/google/callback",
    GOOGLE_REDIRECT_URI_AGENT: "http://127.0.0.1:3001/api/v1/auth/google/callback",
    GOOGLE_STATE_SECRET: "a_long_random_state_secret_value",
  };
  if (isGoogleEnabled(fullGoogleEnv) !== true || googleEnabled(fullGoogleEnv) !== true) {
    throw new Error("googleEnabled should return true when all 5 variables are present");
  }
  console.log("PASS: Environment validation and googleEnabled helper verified.");

  // 2. User Schema definition and sparse phone checks
  const phonePath = User.schema.path("phone");
  if (phonePath.isRequired) {
    throw new Error("User model phone field should not be required at schema level");
  }

  const passwordPath = User.schema.path("password");
  if (passwordPath.isRequired) {
    throw new Error("User model password field should not be required at schema level");
  }

  const googleIdPath = User.schema.path("googleId");
  if (!googleIdPath || !googleIdPath.options.sparse || !googleIdPath.options.unique) {
    throw new Error("googleId field must be unique and sparse");
  }
  if (googleIdPath.options.select !== false) {
    throw new Error("googleId must be unselected by default (select: false)");
  }

  const authProvidersPath = User.schema.path("authProviders");
  if (!authProvidersPath) {
    throw new Error("authProviders field is missing on User schema");
  }

  const profileCompletePath = User.schema.path("profileComplete");
  if (!profileCompletePath || profileCompletePath.defaultValue !== true) {
    throw new Error("profileComplete must default to true on User schema");
  }

  // Verify setter sanitizes empty string or null to undefined
  const dummyDoc = new User({ email: "test.sparse@example.com", fullName: "Test User", phone: "" });
  if (dummyDoc.phone !== undefined) {
    throw new Error(`Empty phone string should be converted to undefined. Got: ${dummyDoc.phone}`);
  }
  console.log("PASS: User schema fields (googleId, authProviders, profileComplete, phone, password) verified.");

  // 3. Google-only account without password
  const googleUser = new User({
    fullName: "Aarav Mehta",
    email: "aarav.mehta@example.com",
    role: ROLES.CUSTOMER,
    authProviders: [AUTH_PROVIDERS.GOOGLE],
    profileComplete: false,
  });

  const checkPasswordResult = await googleUser.isPasswordCorrect("AnyPassword123");
  if (checkPasswordResult !== false) {
    throw new Error("isPasswordCorrect must return false for an account without a password");
  }

  // 4. Change password on passwordless account
  const originalFindById = User.findById;
  User.findById = (id) => ({
    select: (fields) => {
      if (fields === "+password") {
        return Promise.resolve({
          _id: id,
          email: "aarav.mehta@example.com",
          password: null,
          isPasswordCorrect: () => Promise.resolve(false),
        });
      }
      return Promise.resolve(googleUser);
    },
  });

  let changePasswordFailed = false;
  try {
    await authService.changePassword({
      userId: "user_123",
      currentPassword: "OldPassword123",
      newPassword: "NewPassword123",
    });
  } catch (error) {
    changePasswordFailed = true;
    if (!error.message.includes("reset password")) {
      throw new Error(`Expected error telling user to use reset password, got: ${error.message}`);
    }
  }
  if (!changePasswordFailed) {
    throw new Error("changePassword on passwordless account should fail");
  }
  console.log("PASS: Change password on passwordless account rejected with reset password advice.");

  // 5. Password reset for Google account adds 'password' to authProviders
  const originalFindOne = User.findOne;
  let savedUser = null;
  User.findOne = (query) => {
    return {
      select: () => {
        const u = {
          _id: "google_user_id",
          email: "aarav.mehta@example.com",
          authProviders: ["google"],
          password: null,
          save: async function () {
            savedUser = this;
            return this;
          },
        };
        return Promise.resolve(u);
      },
    };
  };

  // Mock EmailOtp.findOne to provide a valid OTP record
  const originalEmailOtpFindOne = EmailOtp.findOne;
  EmailOtp.findOne = () => ({
    sort: () =>
      Promise.resolve({
        expiresAt: new Date(Date.now() + 600000),
        attempts: 0,
        codeHash: crypto.createHash("sha256").update("123456").digest("hex"),
        save: () => Promise.resolve(),
      }),
  });

  await authService.resetPassword({
    email: "aarav.mehta@example.com",
    otp: "123456",
    newPassword: "NewSecurePassword123",
  });

  if (!savedUser.authProviders.includes("password")) {
    throw new Error("resetPassword should add 'password' to authProviders");
  }
  if (savedUser.password !== "NewSecurePassword123") {
    throw new Error("resetPassword should set the new password");
  }
  console.log("PASS: Password reset adds password provider to Google-only account.");

  // 6. Registration check for existing Google account
  User.findOne = (query) => {
    if (query.email === "aarav.mehta@example.com") {
      return Promise.resolve({
        email: "aarav.mehta@example.com",
        authProviders: ["google"],
      });
    }
    return Promise.resolve(null);
  };

  let regFailed = false;
  try {
    await authService.register({
      fullName: "Aarav Mehta",
      email: "aarav.mehta@example.com",
      phone: "9876543210",
      password: "Password123",
    });
  } catch (error) {
    regFailed = true;
    if (!error.message.includes("Google") || !error.message.includes("reset your password")) {
      throw new Error(`Unexpected registration error message: ${error.message}`);
    }
  }
  if (!regFailed) {
    throw new Error("Email registration should fail when email belongs to a Google account");
  }
  console.log("PASS: Email registration rejects existing Google account with helpful message.");

  // 7. GET /users/me returns profileComplete, authProviders, and hasPassword, and never googleId or hashes
  User.findById = (id) => ({
    select: () => {
      const u = new User({
        _id: id,
        fullName: "Vikram Sen",
        email: "vikram@example.com",
        phone: "919876543210",
        role: ROLES.CUSTOMER,
        googleId: "google_sub_12345",
        password: "hashedpassword123",
        refreshToken: "refresh_token_abc",
        authProviders: [AUTH_PROVIDERS.GOOGLE, AUTH_PROVIDERS.PASSWORD],
        profileComplete: true,
      });
      return Promise.resolve(u);
    },
  });

  // Mock PublisherProfile.findOne if registered to avoid buffering when offline
  const originalPublisherFindOne = mongoose.models.PublisherProfile?.findOne;
  if (mongoose.models.PublisherProfile) {
    mongoose.models.PublisherProfile.findOne = () => Promise.resolve(null);
  }

  const meData = await userService.getCurrentUser("60d0fe4f5311236168a109cc");
  if (meData.hasPassword !== true) {
    throw new Error("hasPassword should be true when password exists");
  }
  if (meData.profileComplete !== true) {
    throw new Error("profileComplete should be returned on user object");
  }
  if (!meData.authProviders || !meData.authProviders.includes("google")) {
    throw new Error("authProviders should be returned on user object");
  }
  if (meData.googleId !== undefined) {
    throw new Error("googleId must never be returned in /users/me response");
  }
  if (meData.password !== undefined) {
    throw new Error("password hash must never be returned in /users/me response");
  }
  if (meData.refreshToken !== undefined) {
    throw new Error("refreshToken must never be returned in /users/me response");
  }
  console.log("PASS: GET /users/me returns profileComplete, authProviders, hasPassword without sensitive fields.");

  // 8. requireProfileComplete middleware
  let nextCalled = false;
  let errorCaught = null;
  const mockReqIncomplete = {
    user: {
      _id: "user_1",
      email: "incomplete@example.com",
      profileComplete: false,
      phone: undefined,
    },
  };
  requireProfileComplete(
    mockReqIncomplete,
    {},
    (err) => {
      if (err) {
        errorCaught = err;
      } else {
        nextCalled = true;
      }
    }
  );

  if (!errorCaught || errorCaught.statusCode !== 403 || !errorCaught.message.includes("PROFILE_INCOMPLETE")) {
    throw new Error("requireProfileComplete should block incomplete profiles with status 403 and PROFILE_INCOMPLETE error");
  }

  nextCalled = false;
  errorCaught = null;
  const mockReqComplete = {
    user: {
      _id: "user_2",
      email: "complete@example.com",
      profileComplete: true,
      phone: "919876543210",
    },
  };
  requireProfileComplete(
    mockReqComplete,
    {},
    (err) => {
      if (err) {
        errorCaught = err;
      } else {
        nextCalled = true;
      }
    }
  );

  if (!nextCalled || errorCaught) {
    throw new Error("requireProfileComplete should pass when profile is complete and phone is present");
  }
  console.log("PASS: requireProfileComplete middleware correctly blocks incomplete profiles.");

  // 9. Route gate integration tests over HTTP
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const incompleteUserToken = jwt.sign(
      {
        _id: "60d0fe4f5311236168a109aa",
        email: "incomplete.publisher@example.com",
        role: ROLES.AGENT,
      },
      env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    User.findById = (id) =>
      Promise.resolve({
        _id: id,
        email: "incomplete.publisher@example.com",
        role: ROLES.AGENT,
        accountStatus: "active",
        profileComplete: false,
        phone: undefined,
      });

    // Write endpoint on /publishers should be blocked by requireProfileComplete
    const pubWriteRes = await fetch(`${baseUrl}/api/v1/publishers/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${incompleteUserToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ businessName: "Blocked Agent" }),
    });
    const pubWriteJson = await pubWriteRes.json();
    if (pubWriteRes.status !== 403 || !pubWriteJson.message.includes("PROFILE_INCOMPLETE")) {
      throw new Error(`Expected 403 PROFILE_INCOMPLETE on publisher write route, got: ${pubWriteRes.status} ${pubWriteJson.message}`);
    }
    console.log("PASS: Publisher write route protected by requireProfileComplete: 403 PROFILE_INCOMPLETE.");

    // Customer write endpoint on /bookings should be blocked by requireProfileComplete
    const incompleteCustomerToken = jwt.sign(
      {
        _id: "60d0fe4f5311236168a109bb",
        email: "incomplete.customer@example.com",
        role: ROLES.CUSTOMER,
      },
      env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    User.findById = (id) =>
      Promise.resolve({
        _id: id,
        email: "incomplete.customer@example.com",
        role: ROLES.CUSTOMER,
        accountStatus: "active",
        isEmailVerified: true,
        profileComplete: false,
        phone: undefined,
      });

    const bookingRes = await fetch(`${baseUrl}/api/v1/bookings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${incompleteCustomerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const bookingJson = await bookingRes.json();
    if (bookingRes.status !== 403 || !bookingJson.message.includes("PROFILE_INCOMPLETE")) {
      throw new Error(`Expected 403 PROFILE_INCOMPLETE on POST /bookings, got: ${bookingRes.status} ${bookingJson.message}`);
    }
    console.log("PASS: POST /bookings protected by requireProfileComplete: 403 PROFILE_INCOMPLETE.");
  } finally {
    server.close();
    User.findById = originalFindById;
    User.findOne = originalFindOne;
    EmailOtp.findOne = originalEmailOtpFindOne;
    if (mongoose.models.PublisherProfile && originalPublisherFindOne) {
      mongoose.models.PublisherProfile.findOne = originalPublisherFindOne;
    }
  }

  console.log("\nAll Google Login Plan 1 tests passed successfully!");
};

run().catch((err) => {
  console.error("Google Plan 1 test failed:", err);
  process.exit(1);
});
