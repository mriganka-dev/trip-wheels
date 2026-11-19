import fs from "fs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { env, googleEnabled } from "../config/env.js";
import { ACCOUNT_STATUS, ROLES } from "../constants.js";
import { EmailOtp } from "../models/emailOtp.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { normalizePhone } from "../utils/phone.js";
import { createSession } from "./auth.service.js";
import { getCurrentUser } from "./user.service.js";

export const STATE_COOKIE_NAME = "google_oauth_state";

export const getStateCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/v1/auth/google",
  maxAge: 10 * 60 * 1000,
});

export const getClearStateCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/v1/auth/google",
});

export const sanitizeNextPath = (path) => {
  if (!path || typeof path !== "string") {
    return null;
  }
  const trimmed = path.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.includes("\\") &&
    !trimmed.includes("://")
  ) {
    return trimmed;
  }
  return null;
};

export const signStateToken = (payload) => {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", env.GOOGLE_STATE_SECRET || "fallback_state_secret")
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
};

export const verifyStateToken = (token) => {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }
  const [data, signature] = token.split(".");
  if (!data || !signature) {
    return null;
  }

  const expectedSig = crypto
    .createHmac("sha256", env.GOOGLE_STATE_SECRET || "fallback_state_secret")
    .update(data)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(data, "base64url").toString("utf8");
    const payload = JSON.parse(jsonStr);

    if (payload.createdAt && Date.now() - payload.createdAt > 10 * 60 * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

let mockOAuthClient = null;

export const setMockOAuthClient = (client) => {
  mockOAuthClient = client;
};

export const getOAuthClient = (appType) => {
  if (mockOAuthClient) {
    return typeof mockOAuthClient === "function"
      ? mockOAuthClient(appType)
      : mockOAuthClient;
  }

  const redirectUri =
    appType === "agent"
      ? env.GOOGLE_REDIRECT_URI_AGENT
      : env.GOOGLE_REDIRECT_URI_CUSTOMER;

  return new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

export const generateGoogleAuthUrl = ({ app, mode = "login", type, next }) => {
  if (!googleEnabled()) {
    return { unavailable: true };
  }

  const client = getOAuthClient(app);

  const state = crypto.randomBytes(32).toString("base64url");
  const nonce = crypto.randomBytes(32).toString("base64url");
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const safeNext = sanitizeNextPath(next);

  const statePayload = {
    state,
    nonce,
    codeVerifier,
    app,
    mode,
    type: app === "agent" && mode === "register" ? type : null,
    next: safeNext,
    createdAt: Date.now(),
  };

  const stateToken = signStateToken(statePayload);

  const authUrlString = client.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    prompt: "select_account",
    nonce,
  });

  const parsedUrl = new URL(authUrlString);
  if (!parsedUrl.searchParams.has("nonce")) {
    parsedUrl.searchParams.set("nonce", nonce);
  }

  return {
    authUrl: parsedUrl.toString(),
    stateToken,
  };
};

export const handleGoogleCallback = async ({
  code,
  state,
  error,
  rawStateCookie,
}) => {
  if (error) {
    fs.appendFileSync("google_auth.log", `[GOOGLE_AUTH_ERROR] error received: ${error}\n`);
    return { redirectUrl: "/login?error=google_cancelled" };
  }

  const savedState = verifyStateToken(rawStateCookie);
  if (!savedState) {
    fs.appendFileSync("google_auth.log", `[GOOGLE_AUTH_ERROR] State cookie missing or invalid token. rawStateCookie: ${rawStateCookie}\n`);
    console.error("[GOOGLE_AUTH_ERROR] State cookie missing or invalid token. rawStateCookie:", rawStateCookie);
    return { redirectUrl: "/login?error=google_failed" };
  }
  if (!state || savedState.state !== state) {
    fs.appendFileSync("google_auth.log", `[GOOGLE_AUTH_ERROR] State mismatch. query state: ${state}, saved state: ${savedState?.state}\n`);
    console.error("[GOOGLE_AUTH_ERROR] State mismatch. query state:", state, "saved state:", savedState?.state);
    return { redirectUrl: "/login?error=google_failed" };
  }

  if (!code) {
    fs.appendFileSync("google_auth.log", `[GOOGLE_AUTH_ERROR] Code parameter missing from callback\n`);
    console.error("[GOOGLE_AUTH_ERROR] Code parameter missing from callback");
    return { redirectUrl: "/login?error=google_failed" };
  }

  let tokens;
  let payload;
  const client = getOAuthClient(savedState.app);

  try {
    const tokenResponse = await client.getToken({
      code,
      codeVerifier: savedState.codeVerifier,
    });
    tokens = tokenResponse.tokens;

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    fs.appendFileSync("google_auth.log", `[GOOGLE_AUTH_ERROR] Token exchange failure: ${err.message}\n`);
    console.error("Google token exchange failure:", err.message);
    return { redirectUrl: "/login?error=google_failed" };
  }

  if (!payload || payload.nonce !== savedState.nonce) {
    fs.appendFileSync("google_auth.log", `[GOOGLE_AUTH_ERROR] Nonce mismatch. token payload nonce: ${payload?.nonce}, saved nonce: ${savedState?.nonce}\n`);
    console.error("[GOOGLE_AUTH_ERROR] Nonce mismatch. token payload nonce:", payload?.nonce, "saved nonce:", savedState?.nonce);
    return { redirectUrl: "/login?error=google_failed" };
  }

  if (
    payload.iss !== "https://accounts.google.com" &&
    payload.iss !== "accounts.google.com"
  ) {
    fs.appendFileSync("google_auth.log", `[GOOGLE_AUTH_ERROR] Issuer mismatch. payload iss: ${payload?.iss}\n`);
    console.error("[GOOGLE_AUTH_ERROR] Issuer mismatch. payload iss:", payload?.iss);
    return { redirectUrl: "/login?error=google_failed" };
  }

  if (!payload.email_verified) {
    return { redirectUrl: "/login?error=google_email_unverified" };
  }

  const googleId = payload.sub;
  const email = payload.email.toLowerCase().trim();
  const name =
    payload.name?.trim() || email.split("@")[0].slice(0, 50);

  const checkRole = (userRole, targetApp) => {
    if (userRole === ROLES.ADMIN) {
      return false;
    }
    if (targetApp === "customer") {
      return userRole === ROLES.CUSTOMER;
    }
    if (targetApp === "agent") {
      return userRole === ROLES.AGENT || userRole === ROLES.INDIVIDUAL;
    }
    return false;
  };

  let user = await User.findOne({ googleId });

  if (user) {
    if (!checkRole(user.role, savedState.app)) {
      return { redirectUrl: "/login?error=wrong_app" };
    }
    if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
      return { redirectUrl: "/login?error=account_suspended" };
    }
  } else {
    user = await User.findOne({ email });

    if (user) {
      if (!checkRole(user.role, savedState.app)) {
        return { redirectUrl: "/login?error=wrong_app" };
      }
      if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
        return { redirectUrl: "/login?error=account_suspended" };
      }

      user.googleId = googleId;
      if (!user.authProviders?.includes("google")) {
        user.authProviders = [...(user.authProviders || []), "google"];
      }

      if (!user.isEmailVerified) {
        user.password = undefined;
        user.authProviders = ["google"];
        user.refreshToken = undefined;
        await EmailOtp.deleteMany({ email });
      }

      user.isEmailVerified = true;
      await user.save();
    } else {
      if (savedState.app === "agent" && savedState.mode === "login") {
        return { redirectUrl: "/register?error=no_account" };
      }

      let assignedRole = ROLES.CUSTOMER;
      if (savedState.app === "agent") {
        assignedRole =
          savedState.type === "agent" ? ROLES.AGENT : ROLES.INDIVIDUAL;
      }

      try {
        user = await User.create({
          fullName: name,
          email,
          googleId,
          role: assignedRole,
          isEmailVerified: true,
          authProviders: ["google"],
          password: undefined,
          phone: undefined,
          profileComplete: false,
        });
      } catch (err) {
        if (err.code === 11000) {
          user =
            (await User.findOne({ googleId })) ||
            (await User.findOne({ email }));
          if (!user) {
            throw err;
          }
          if (!checkRole(user.role, savedState.app)) {
            return { redirectUrl: "/login?error=wrong_app" };
          }
          if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
            return { redirectUrl: "/login?error=account_suspended" };
          }
        } else {
          throw err;
        }
      }
    }
  }

  const { accessToken, refreshToken } = await createSession(user);

  let redirectUrl = "/";
  if (user.profileComplete === false) {
    redirectUrl = savedState.next
      ? `/complete-profile?next=${encodeURIComponent(savedState.next)}`
      : "/complete-profile";
  } else if (savedState.next) {
    redirectUrl = savedState.next;
  }

  return {
    user,
    accessToken,
    refreshToken,
    redirectUrl,
  };
};

export const completeProfile = async (userId, { phone, fullName }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.profileComplete === true) {
    throw new ApiError(400, "Your profile is already complete.");
  }

  const normalizedPhone = normalizePhone(phone);

  const existing = await User.findOne({
    phone: normalizedPhone,
    _id: { $ne: userId },
  });
  if (existing) {
    throw new ApiError(409, "Phone number is already in use");
  }

  if (fullName !== undefined && fullName.trim() !== "") {
    user.fullName = fullName.trim();
  }

  user.phone = normalizedPhone;
  user.profileComplete = true;
  user.phoneConfirmedByAdmin = false;
  user.phoneConfirmedAt = null;
  user.phoneConfirmedBy = null;

  await user.save();

  return await getCurrentUser(userId);
};
