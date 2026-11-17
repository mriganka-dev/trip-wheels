import fs from "fs";
import * as googleService from "../services/google.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { attachSessionCookies } from "../utils/session.js";
import { googleAuthQuerySchema } from "../validators/auth.validator.js";

const logGoogleAuth = (event, data) => {
  const line = `[${new Date().toISOString()}] [${event}] ${JSON.stringify(data)}\n`;
  try {
    fs.appendFileSync("google_auth.log", line);
  } catch (e) {
    console.error("Failed to write to google_auth.log", e);
  }
};

export const startGoogleAuth = (req, res) => {
  logGoogleAuth("START_REQUEST", { query: req.query, headers: { host: req.headers.host, origin: req.headers.origin, referer: req.headers.referer } });
  const parsed = googleAuthQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    logGoogleAuth("START_VALIDATION_FAILED", { errors: parsed.error.issues });
    return res.redirect("/login?error=google_failed");
  }

  const result = googleService.generateGoogleAuthUrl(parsed.data);
  if (result.unavailable) {
    logGoogleAuth("START_UNAVAILABLE", {});
    return res.redirect("/login?error=google_unavailable");
  }

  res.cookie(
    googleService.STATE_COOKIE_NAME,
    result.stateToken,
    googleService.getStateCookieOptions()
  );

  logGoogleAuth("START_REDIRECT", { authUrl: result.authUrl });
  return res.redirect(result.authUrl);
};

export const handleGoogleCallback = async (req, res) => {
  const rawStateCookie = req.cookies?.[googleService.STATE_COOKIE_NAME];
  logGoogleAuth("CALLBACK_RECEIVED", {
    query: req.query,
    cookies: req.cookies,
    hasStateCookie: Boolean(rawStateCookie),
    headers: { host: req.headers.host, origin: req.headers.origin, referer: req.headers.referer }
  });

  // State cookie must always be cleared on any outcome
  res.clearCookie(
    googleService.STATE_COOKIE_NAME,
    googleService.getClearStateCookieOptions()
  );

  try {
    const { code, state, error } = req.query;

    const result = await googleService.handleGoogleCallback({
      code,
      state,
      error,
      rawStateCookie,
    });

    logGoogleAuth("CALLBACK_RESULT", { redirectUrl: result.redirectUrl, hasTokens: Boolean(result.accessToken) });

    if (result.accessToken && result.refreshToken) {
      attachSessionCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    }

    return res.redirect(result.redirectUrl || "/login?error=google_failed");
  } catch (err) {
    logGoogleAuth("CALLBACK_EXCEPTION", { message: err.message, stack: err.stack });
    console.error("Google callback execution error:", err.message);
    return res.redirect("/login?error=google_failed");
  }
};

export const completeProfile = asyncHandler(async (req, res) => {
  const user = await googleService.completeProfile(req.user._id, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, user, "Profile completed successfully"));
});
