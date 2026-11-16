import * as googleService from "../services/google.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { attachSessionCookies } from "../utils/session.js";
import { googleAuthQuerySchema } from "../validators/auth.validator.js";

export const startGoogleAuth = (req, res) => {
  const parsed = googleAuthQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.redirect("/login?error=google_failed");
  }

  const result = googleService.generateGoogleAuthUrl(parsed.data);
  if (result.unavailable) {
    return res.redirect("/login?error=google_unavailable");
  }

  res.cookie(
    googleService.STATE_COOKIE_NAME,
    result.stateToken,
    googleService.getStateCookieOptions()
  );

  return res.redirect(result.authUrl);
};

export const handleGoogleCallback = async (req, res) => {
  const rawStateCookie = req.cookies?.[googleService.STATE_COOKIE_NAME];

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

    if (result.accessToken && result.refreshToken) {
      attachSessionCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    }

    return res.redirect(result.redirectUrl || "/login?error=google_failed");
  } catch (err) {
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
