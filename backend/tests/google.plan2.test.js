import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../src/app.js";
import { env, isGoogleEnabled } from "../src/config/env.js";
import { ACCOUNT_STATUS, AUTH_PROVIDERS, ROLES } from "../src/constants.js";
import { EmailOtp } from "../src/models/emailOtp.model.js";
import { User } from "../src/models/user.model.js";
import * as authService from "../src/services/auth.service.js";
import * as googleService from "../src/services/google.service.js";

const run = async () => {
  console.log("Running Google Login Plan 2 Unit and Route Tests...\n");

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  // Preserve originals
  const originalFindById = User.findById;
  const originalFindOne = User.findOne;
  const originalCreate = User.create;
  const originalDeleteMany = EmailOtp.deleteMany;
  const originalPublisherFindOne = mongoose.models.PublisherProfile?.findOne;
  if (mongoose.models.PublisherProfile) {
    mongoose.models.PublisherProfile.findOne = () => Promise.resolve(null);
  }

  try {
    // 1. Safe next path sanitizer
    if (googleService.sanitizeNextPath("/safe/path") !== "/safe/path") {
      throw new Error("sanitizeNextPath should allow safe relative path");
    }
    if (googleService.sanitizeNextPath("//evil.com") !== null) {
      throw new Error("sanitizeNextPath should reject double slash protocol-relative URLs");
    }
    if (googleService.sanitizeNextPath("https://evil.com") !== null) {
      throw new Error("sanitizeNextPath should reject absolute URLs with scheme");
    }
    if (googleService.sanitizeNextPath("/safe\\evil") !== null) {
      throw new Error("sanitizeNextPath should reject backslashes");
    }
    console.log("PASS: Redirect path sanitizer verified.");

    // 2. State token signing and verification
    const testPayload = {
      state: "state_123",
      nonce: "nonce_456",
      codeVerifier: "verifier_789",
      app: "customer",
      mode: "login",
      type: null,
      next: "/bookings",
      createdAt: Date.now(),
    };
    const signed = googleService.signStateToken(testPayload);
    const verified = googleService.verifyStateToken(signed);
    if (!verified || verified.state !== testPayload.state || verified.app !== "customer") {
      throw new Error("State token verification failed on valid signed token");
    }

    // Tampered token
    const [dataPart, sigPart] = signed.split(".");
    const tampered = `${dataPart.slice(0, -2)}AA.${sigPart}`;
    if (googleService.verifyStateToken(tampered) !== null) {
      throw new Error("Tampered state token should fail verification");
    }

    // Expired token (> 10 minutes)
    const expiredPayload = { ...testPayload, createdAt: Date.now() - 11 * 60 * 1000 };
    const expiredToken = googleService.signStateToken(expiredPayload);
    if (googleService.verifyStateToken(expiredToken) !== null) {
      throw new Error("Expired state token should fail verification");
    }
    console.log("PASS: State token cryptographic signing, verification, tampering, and expiry verified.");

    // 3. Start route tests: GET /api/v1/auth/google
    // Missing / invalid query params -> redirect to /login?error=google_failed
    const badQueryRes = await fetch(`${baseUrl}/api/v1/auth/google?app=invalid`, {
      redirect: "manual",
    });
    if (
      badQueryRes.status !== 302 ||
      !badQueryRes.headers.get("location")?.includes("/login?error=google_failed")
    ) {
      throw new Error("Invalid query should redirect to /login?error=google_failed");
    }

    // Agent register without valid type -> redirect to /login?error=google_failed
    const badAgentRes = await fetch(
      `${baseUrl}/api/v1/auth/google?app=agent&mode=register&type=invalid`,
      { redirect: "manual" }
    );
    if (
      badAgentRes.status !== 302 ||
      !badAgentRes.headers.get("location")?.includes("/login?error=google_failed")
    ) {
      throw new Error("Agent register without valid type should redirect with google_failed");
    }

    // Valid customer start -> redirect to Google authorization URL and set state cookie
    const validStartRes = await fetch(
      `${baseUrl}/api/v1/auth/google?app=customer&mode=login&next=/bookings/123`,
      { redirect: "manual" }
    );
    if (validStartRes.status !== 302) {
      throw new Error(`Valid start request should redirect with 302, got ${validStartRes.status}`);
    }
    const location = validStartRes.headers.get("location") || "";
    if (
      !location.startsWith("https://accounts.google.com") ||
      !location.includes("scope=openid") ||
      !location.includes("prompt=select_account") ||
      !location.includes("code_challenge=")
    ) {
      throw new Error(`Invalid Google authorization URL: ${location}`);
    }

    const setCookie = validStartRes.headers.get("set-cookie") || "";
    if (
      !setCookie.includes("google_oauth_state=") ||
      !setCookie.includes("Path=/api/v1/auth/google") ||
      !setCookie.includes("HttpOnly")
    ) {
      throw new Error(`State cookie not set correctly: ${setCookie}`);
    }
    console.log("PASS: GET /auth/google start route generates valid PKCE authorization URL and signed state cookie.");

    // 4. Callback route tests: GET /api/v1/auth/google/callback
    // A. Missing state cookie -> /login?error=google_failed
    const noStateRes = await fetch(
      `${baseUrl}/api/v1/auth/google/callback?code=some_code&state=some_state`,
      { redirect: "manual" }
    );
    if (
      noStateRes.status !== 302 ||
      !noStateRes.headers.get("location")?.includes("/login?error=google_failed")
    ) {
      throw new Error("Missing state cookie should redirect with google_failed");
    }

    // B. User cancelled on Google (?error=access_denied) -> /login?error=google_cancelled
    const cancelRes = await fetch(
      `${baseUrl}/api/v1/auth/google/callback?error=access_denied`,
      {
        redirect: "manual",
        headers: { Cookie: `google_oauth_state=${signed}` },
      }
    );
    if (
      cancelRes.status !== 302 ||
      !cancelRes.headers.get("location")?.includes("/login?error=google_cancelled")
    ) {
      throw new Error("Cancelled Google login should redirect with google_cancelled");
    }
    // Verify state cookie was cleared
    const cancelClearCookie = cancelRes.headers.get("set-cookie") || "";
    if (
      !cancelClearCookie.includes("google_oauth_state=") ||
      (!cancelClearCookie.includes("1970") && !cancelClearCookie.includes("Max-Age=0"))
    ) {
      throw new Error("State cookie must be cleared on cancellation");
    }
    console.log("PASS: Cancellation and missing state handled with proper redirects and cleared cookies.");

    // Helper for mocking OAuth2Client in callback tests
    const mockGoogleClient = (mockPayload, tokenError = null) => {
      googleService.setMockOAuthClient({
        getToken: () => {
          if (tokenError) {
            return Promise.reject(tokenError);
          }
          return Promise.resolve({ tokens: { id_token: "mock_id_token" } });
        },
        verifyIdToken: () => {
          return Promise.resolve({
            getPayload: () => mockPayload,
          });
        },
      });
    };

    // C. Nonce mismatch -> /login?error=google_failed
    const validCookiePayload = {
      state: "match_state",
      nonce: "correct_nonce",
      codeVerifier: "valid_verifier",
      app: "customer",
      mode: "login",
      type: null,
      next: "/dashboard",
      createdAt: Date.now(),
    };
    const validCookieToken = googleService.signStateToken(validCookiePayload);

    mockGoogleClient({
      sub: "google_123",
      email: "test@example.com",
      email_verified: true,
      nonce: "wrong_nonce",
      iss: "https://accounts.google.com",
    });

    const wrongNonceRes = await fetch(
      `${baseUrl}/api/v1/auth/google/callback?code=mock_code&state=match_state`,
      {
        redirect: "manual",
        headers: { Cookie: `google_oauth_state=${validCookieToken}` },
      }
    );
    if (
      wrongNonceRes.status !== 302 ||
      !wrongNonceRes.headers.get("location")?.includes("/login?error=google_failed")
    ) {
      throw new Error("Wrong nonce should redirect with google_failed");
    }

    // D. Unverified email -> /login?error=google_email_unverified
    mockGoogleClient({
      sub: "google_123",
      email: "unverified@example.com",
      email_verified: false,
      nonce: "correct_nonce",
      iss: "https://accounts.google.com",
    });

    const unverifiedEmailRes = await fetch(
      `${baseUrl}/api/v1/auth/google/callback?code=mock_code&state=match_state`,
      {
        redirect: "manual",
        headers: { Cookie: `google_oauth_state=${validCookieToken}` },
      }
    );
    if (
      unverifiedEmailRes.status !== 302 ||
      !unverifiedEmailRes.headers.get("location")?.includes("/login?error=google_email_unverified")
    ) {
      throw new Error("Unverified email should redirect with google_email_unverified");
    }
    console.log("PASS: Nonce mismatch and unverified email checks passed.");

    // E. New Customer Account creation flow
    mockGoogleClient({
      sub: "google_sub_cust_1",
      email: "neha.patel@example.com",
      name: "Neha Patel",
      email_verified: true,
      nonce: "correct_nonce",
      iss: "https://accounts.google.com",
    });

    let createdUserDoc = null;
    User.findOne = () => Promise.resolve(null);
    User.create = (doc) => {
      createdUserDoc = new User({
        _id: new mongoose.Types.ObjectId(),
        ...doc,
      });
      createdUserDoc.save = () => Promise.resolve(createdUserDoc);
      return Promise.resolve(createdUserDoc);
    };

    const newCustRes = await fetch(
      `${baseUrl}/api/v1/auth/google/callback?code=mock_code&state=match_state`,
      {
        redirect: "manual",
        headers: { Cookie: `google_oauth_state=${validCookieToken}` },
      }
    );

    if (newCustRes.status !== 302) {
      throw new Error(`New customer callback failed with status ${newCustRes.status}`);
    }
    const newCustLoc = newCustRes.headers.get("location") || "";
    if (!newCustLoc.startsWith("/complete-profile?next=%2Fdashboard")) {
      throw new Error(`New customer should redirect to /complete-profile with next query param, got: ${newCustLoc}`);
    }
    if (
      createdUserDoc.role !== ROLES.CUSTOMER ||
      createdUserDoc.profileComplete !== false ||
      !createdUserDoc.authProviders.includes("google") ||
      createdUserDoc.googleId !== "google_sub_cust_1"
    ) {
      throw new Error("New customer user document created with incorrect fields");
    }

    const newCustCookies = newCustRes.headers.get("set-cookie") || "";
    if (!newCustCookies.includes("accessToken=") || !newCustCookies.includes("refreshToken=")) {
      throw new Error("Session cookies should be attached on successful Google sign-in");
    }
    console.log("PASS: New customer account creation with session cookies and /complete-profile redirect verified.");

    // F. Agent app, login mode, no account -> /register?error=no_account, creates nothing
    const agentLoginPayload = {
      state: "agent_login_state",
      nonce: "correct_nonce",
      codeVerifier: "valid_verifier",
      app: "agent",
      mode: "login",
      type: null,
      next: null,
      createdAt: Date.now(),
    };
    const agentLoginCookieToken = googleService.signStateToken(agentLoginPayload);

    let createdCount = 0;
    User.create = () => {
      createdCount++;
      return Promise.resolve({});
    };

    const agentNoAccRes = await fetch(
      `${baseUrl}/api/v1/auth/google/callback?code=mock_code&state=agent_login_state`,
      {
        redirect: "manual",
        headers: { Cookie: `google_oauth_state=${agentLoginCookieToken}` },
      }
    );
    if (
      agentNoAccRes.status !== 302 ||
      !agentNoAccRes.headers.get("location")?.includes("/register?error=no_account")
    ) {
      throw new Error(`Agent login with no account should redirect to /register?error=no_account, got: ${agentNoAccRes.headers.get("location")}`);
    }
    if (createdCount !== 0) {
      throw new Error("No account should be created when agent logs in without an existing account");
    }
    console.log("PASS: Agent login mode with no partner account redirects to /register?error=no_account with zero records created.");

    // G. New Agent registration flow
    const agentRegPayload = {
      state: "agent_reg_state",
      nonce: "correct_nonce",
      codeVerifier: "valid_verifier",
      app: "agent",
      mode: "register",
      type: "agent",
      next: null,
      createdAt: Date.now(),
    };
    const agentRegCookieToken = googleService.signStateToken(agentRegPayload);

    mockGoogleClient({
      sub: "google_sub_agent_1",
      email: "agent.raj@example.com",
      name: "Raj Travels",
      email_verified: true,
      nonce: "correct_nonce",
      iss: "https://accounts.google.com",
    });

    let agentDoc = null;
    User.create = (doc) => {
      agentDoc = new User({ _id: new mongoose.Types.ObjectId(), ...doc });
      agentDoc.save = () => Promise.resolve(agentDoc);
      return Promise.resolve(agentDoc);
    };

    const agentRegRes = await fetch(
      `${baseUrl}/api/v1/auth/google/callback?code=mock_code&state=agent_reg_state`,
      {
        redirect: "manual",
        headers: { Cookie: `google_oauth_state=${agentRegCookieToken}` },
      }
    );
    if (agentRegRes.status !== 302 || !agentRegRes.headers.get("location")?.startsWith("/complete-profile")) {
      throw new Error(`Agent register should redirect to /complete-profile, got: ${agentRegRes.headers.get("location")}`);
    }
    if (agentDoc.role !== ROLES.AGENT) {
      throw new Error(`Expected role 'agent', got: ${agentDoc.role}`);
    }
    console.log("PASS: Agent registration creates partner account with correct role.");

    // H. Account Linking: linking existing verified email and password account
    const existingVerifiedUser = new User({
      _id: new mongoose.Types.ObjectId(),
      fullName: "Ananya Roy",
      email: "ananya.roy@example.com",
      phone: "919876543210",
      password: "existingHashedPassword",
      role: ROLES.CUSTOMER,
      isEmailVerified: true,
      authProviders: [AUTH_PROVIDERS.PASSWORD],
      profileComplete: true,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    });
    existingVerifiedUser.save = () => Promise.resolve(existingVerifiedUser);

    mockGoogleClient({
      sub: "google_sub_ananya",
      email: "ananya.roy@example.com",
      name: "Ananya Roy",
      email_verified: true,
      nonce: "correct_nonce",
      iss: "https://accounts.google.com",
    });

    User.findOne = (q) => {
      if (q.email === "ananya.roy@example.com") {
        return Promise.resolve(existingVerifiedUser);
      }
      return Promise.resolve(null);
    };

    const linkVerifiedRes = await fetch(
      `${baseUrl}/api/v1/auth/google/callback?code=mock_code&state=match_state`,
      {
        redirect: "manual",
        headers: { Cookie: `google_oauth_state=${validCookieToken}` },
      }
    );

    if (linkVerifiedRes.status !== 302 || linkVerifiedRes.headers.get("location") !== "/dashboard") {
      throw new Error(`Linking verified user should redirect to /dashboard, got: ${linkVerifiedRes.headers.get("location")}`);
    }
    if (
      existingVerifiedUser.googleId !== "google_sub_ananya" ||
      !existingVerifiedUser.authProviders.includes("google") ||
      !existingVerifiedUser.authProviders.includes("password") ||
      !existingVerifiedUser.password
    ) {
      throw new Error("Linking verified account should retain password and add google provider");
    }
    console.log("PASS: Linking verified email and password account retains password and updates providers.");

    // I. Account Linking: linking unverified email and password account removes password
    const existingUnverifiedUser = new User({
      _id: new mongoose.Types.ObjectId(),
      fullName: "Karan Singh",
      email: "karan.singh@example.com",
      phone: "919876543211",
      password: "unverifiedPasswordHash",
      role: ROLES.CUSTOMER,
      isEmailVerified: false,
      authProviders: [AUTH_PROVIDERS.PASSWORD],
      profileComplete: true,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    });
    existingUnverifiedUser.save = () => Promise.resolve(existingUnverifiedUser);

    mockGoogleClient({
      sub: "google_sub_karan",
      email: "karan.singh@example.com",
      name: "Karan Singh",
      email_verified: true,
      nonce: "correct_nonce",
      iss: "https://accounts.google.com",
    });

    User.findOne = (q) => {
      if (q.email === "karan.singh@example.com") {
        return Promise.resolve(existingUnverifiedUser);
      }
      return Promise.resolve(null);
    };

    let otpsDeleted = false;
    EmailOtp.deleteMany = () => {
      otpsDeleted = true;
      return Promise.resolve({ deletedCount: 1 });
    };

    const linkUnverifiedRes = await fetch(
      `${baseUrl}/api/v1/auth/google/callback?code=mock_code&state=match_state`,
      {
        redirect: "manual",
        headers: { Cookie: `google_oauth_state=${validCookieToken}` },
      }
    );

    if (linkUnverifiedRes.status !== 302) {
      throw new Error(`Linking unverified user should succeed with 302`);
    }
    if (
      existingUnverifiedUser.password !== undefined ||
      existingUnverifiedUser.authProviders.length !== 1 ||
      existingUnverifiedUser.authProviders[0] !== "google" ||
      existingUnverifiedUser.isEmailVerified !== true ||
      !otpsDeleted
    ) {
      throw new Error("Linking unverified user must remove password, clear OTPs, and set authProviders to google only");
    }
    console.log("PASS: Linking unverified account removes password, purges pending OTPs, and verifies email.");

    // J. Role Mismatch / wrong_app checks
    // Customer email on agent app -> wrong_app
    mockGoogleClient({
      sub: "google_cust_cross",
      email: "customer@example.com",
      email_verified: true,
      nonce: "correct_nonce",
      iss: "https://accounts.google.com",
    });

    User.findOne = () =>
      Promise.resolve(
        new User({
          _id: new mongoose.Types.ObjectId(),
          email: "customer@example.com",
          role: ROLES.CUSTOMER,
          accountStatus: ACCOUNT_STATUS.ACTIVE,
        })
      );

    const crossAppRes = await fetch(
      `${baseUrl}/api/v1/auth/google/callback?code=mock_code&state=agent_login_state`,
      {
        redirect: "manual",
        headers: { Cookie: `google_oauth_state=${agentLoginCookieToken}` },
      }
    );
    if (
      crossAppRes.status !== 302 ||
      !crossAppRes.headers.get("location")?.includes("/login?error=wrong_app")
    ) {
      throw new Error(`Customer email on agent app should redirect to /login?error=wrong_app, got: ${crossAppRes.headers.get("location")}`);
    }

    // Admin role attempt -> wrong_app
    User.findOne = () =>
      Promise.resolve(
        new User({
          _id: new mongoose.Types.ObjectId(),
          email: "admin@example.com",
          role: ROLES.ADMIN,
          accountStatus: ACCOUNT_STATUS.ACTIVE,
        })
      );

    const adminGoogleRes = await fetch(
      `${baseUrl}/api/v1/auth/google/callback?code=mock_code&state=match_state`,
      {
        redirect: "manual",
        headers: { Cookie: `google_oauth_state=${validCookieToken}` },
      }
    );
    if (
      adminGoogleRes.status !== 302 ||
      !adminGoogleRes.headers.get("location")?.includes("/login?error=wrong_app")
    ) {
      throw new Error(`Admin role should redirect to /login?error=wrong_app, got: ${adminGoogleRes.headers.get("location")}`);
    }
    console.log("PASS: Cross-app role restrictions and admin access blocks verified (wrong_app).");

    // K. Suspended Account check
    User.findOne = () =>
      Promise.resolve(
        new User({
          _id: new mongoose.Types.ObjectId(),
          email: "suspended@example.com",
          role: ROLES.CUSTOMER,
          accountStatus: ACCOUNT_STATUS.SUSPENDED,
        })
      );

    const suspendedRes = await fetch(
      `${baseUrl}/api/v1/auth/google/callback?code=mock_code&state=match_state`,
      {
        redirect: "manual",
        headers: { Cookie: `google_oauth_state=${validCookieToken}` },
      }
    );
    if (
      suspendedRes.status !== 302 ||
      !suspendedRes.headers.get("location")?.includes("/login?error=account_suspended")
    ) {
      throw new Error(`Suspended account should redirect to /login?error=account_suspended, got: ${suspendedRes.headers.get("location")}`);
    }
    console.log("PASS: Suspended accounts receive account_suspended redirect.");

    // 5. Complete Profile endpoint: POST /api/v1/auth/complete-profile
    const incompleteUserId = new mongoose.Types.ObjectId();
    const incompleteUserToken = jwt.sign(
      {
        _id: incompleteUserId.toString(),
        email: "incomplete@example.com",
        role: ROLES.CUSTOMER,
      },
      env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    const testIncompleteUser = new User({
      _id: incompleteUserId,
      email: "incomplete@example.com",
      fullName: "Incomplete User",
      role: ROLES.CUSTOMER,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      profileComplete: false,
      phone: undefined,
    });
    testIncompleteUser.save = () => Promise.resolve(testIncompleteUser);

    User.findById = (id) => {
      if (id.toString() === incompleteUserId.toString()) {
        return {
          select: () => Promise.resolve(testIncompleteUser),
          then: (resolve) => resolve(testIncompleteUser),
        };
      }
      return Promise.resolve(null);
    };

    // Duplicate phone check
    User.findOne = (q) => {
      if (q.phone === "919988776655") {
        return Promise.resolve({ _id: new mongoose.Types.ObjectId() });
      }
      return Promise.resolve(null);
    };

    const dupPhoneRes = await fetch(`${baseUrl}/api/v1/auth/complete-profile`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${incompleteUserToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone: "9988776655" }),
    });
    const dupPhoneJson = await dupPhoneRes.json();
    if (dupPhoneRes.status !== 409 || !dupPhoneJson.message.includes("already in use")) {
      throw new Error("Duplicate phone on complete profile should return 409");
    }

    // Success case
    User.findOne = () => Promise.resolve(null);

    const completeSuccessRes = await fetch(`${baseUrl}/api/v1/auth/complete-profile`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${incompleteUserToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone: "9876543210", fullName: "Complete Name" }),
    });
    const completeSuccessJson = await completeSuccessRes.json();
    if (completeSuccessRes.status !== 200 || !completeSuccessJson.success) {
      throw new Error(`Complete profile should succeed with 200, got: ${completeSuccessRes.status}`);
    }
    if (
      testIncompleteUser.profileComplete !== true ||
      testIncompleteUser.phone !== "919876543210" ||
      testIncompleteUser.fullName !== "Complete Name"
    ) {
      throw new Error("User document was not updated correctly after complete profile");
    }

    // Calling again when already complete -> 400
    const alreadyCompleteRes = await fetch(`${baseUrl}/api/v1/auth/complete-profile`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${incompleteUserToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone: "9876543210" }),
    });
    const alreadyCompleteJson = await alreadyCompleteRes.json();
    if (alreadyCompleteRes.status !== 400 || !alreadyCompleteJson.message.includes("already complete")) {
      throw new Error("Calling complete-profile when already complete should return 400");
    }
    console.log("PASS: POST /auth/complete-profile validation, duplicate phone, and idempotency verified.");
  } finally {
    server.close();
    User.findById = originalFindById;
    User.findOne = originalFindOne;
    User.create = originalCreate;
    EmailOtp.deleteMany = originalDeleteMany;
    googleService.setMockOAuthClient(null);
    if (mongoose.models.PublisherProfile && originalPublisherFindOne) {
      mongoose.models.PublisherProfile.findOne = originalPublisherFindOne;
    }
  }

  console.log("\nAll Google Login Plan 2 tests passed successfully!");
};

run().catch((err) => {
  console.error("Google Plan 2 test failed:", err);
  process.exit(1);
});
