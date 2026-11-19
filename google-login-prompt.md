# Trip Wheels: Google Login Build Prompt (Plan-wise)

Use this file with an AI coding assistant (Antigravity, Claude Code, Cursor, etc.) to add **Google login** to the Trip Wheels backend, the customer website and the agent dashboard. It covers Google login only. Everything else (password login, email OTP, verification, bookings) already exists or is covered by other prompts, and must not be rebuilt or changed beyond what this file says.

## How to use this file

1. Complete the **Google Cloud setup checklist** (Part B) yourself first. The assistant cannot do it.
2. Give the assistant **Part A (Global Context)** once at the start, or save it as a workspace rule.
3. Then give it **one plan at a time** (Plan 1 to Plan 5). Each plan ends with acceptance criteria and a suggested commit message.
4. After each plan, run the app, check the acceptance list, then commit and tag the work yourself. The assistant never commits.

| Plan | Where | Scope |
|---|---|---|
| 1 | `backend/` | Data model changes, profile gate, env validation |
| 2 | `backend/` | Google flow: start, callback, account rules, complete profile |
| 3 | customer website folder | Button, error messages, complete profile page, guards |
| 4 | agent dashboard folder | Button on register and login, complete profile page, access rules |
| 5 | all apps | Tests, docs and the end-to-end check |

---

# Part A: Global Context (give this first)

## A1. What we are building

Customers and owners (agents and individuals) can sign up and sign in with **Continue with Google**, in addition to email and password.

| Situation | What happens |
|---|---|
| A customer signs in with Google for the first time | A customer account is created with the email already verified. The customer must add a phone number on a "Complete your profile" page before booking, because owners see it after they accept. |
| An agent or individual registers with Google | They choose Agent or Individual first. The account is created and they are signed in. They must still complete the **whole** verification procedure (profile, documents, submission, verification call, approval) before they can list vehicles or receive bookings. |
| A returning owner signs in with Google | They are found by their Google ID. If onboarding is not finished they land on the verification checklist. After approval, Google sign-in opens the full dashboard every time. |
| An existing email and password account has the same email | Google links to it automatically only when that account's email was already verified. |
| An agent clicks Google on the login page with no partner account | Nothing is created. They are sent to register with a plain message. |

Rules that always hold:
- **One email, one role.** An email cannot be used for both a traveler account and a partner account.
- **Admin accounts never use Google.** The super admin console stays password-only and is not touched.
- **The backend runs the whole flow.** The frontends only show a button that links to the backend. They never load a Google script, never see tokens and never hold the client secret.

## A2. Existing project and assumptions

The repository holds several apps:

```
trip-wheels/
  backend/       Express and MongoDB API
  frontend/      customer website (Next.js)
  admin/         agent dashboard app folder (the name may differ if renamed)
  super-admin/   admin console (do not touch)
```

Before changing anything, inspect what exists:
- **Backend:** the user model, the register, login, refresh and logout code, the cookie and token helpers, the middlewares (`verifyJWT`, role checks, `requireEmailVerified`, `requireActiveAccount`), the error utilities (`ApiError`, `ApiResponse`, `asyncHandler`), the rate limiters, the env validation and the test setup.
- **Customer website and agent dashboard:** the login and register pages, the `useAuth` hook, the API client, the route protection, the access rules helper (agent dashboard), the page title setup and the design tokens.
- Follow the existing file naming, folder structure, ES module or CommonJS style, and the installed versions of Next.js, React and Mongoose. In recent Next.js versions `params`, `searchParams`, `cookies()` and `headers()` are asynchronous, and the route-protection file may be called `middleware` or `proxy`.
- If a piece this file builds on does not exist yet, build the smallest version that works, keep the same style as the rest of the app, and list it in your report.

Each app proxies `/api/v1/...` to the backend with a rewrite, so the browser only talks to its own host, and session cookies are host-only. This is what lets the same backend serve both apps with separate sessions. Do not change that setup.

## A3. How the flow works

1. The user clicks "Continue with Google". This is a normal link to `GET /api/v1/auth/google` on the app's own host. The browser navigates to the backend (through the proxy).
2. The backend saves a short-lived signed state cookie and redirects to Google.
3. Google asks the user to choose an account and consent, then redirects to `/api/v1/auth/google/callback` on the same app host.
4. The backend checks everything, finds, links or creates the account, signs the user in with the normal session cookies, and redirects to a **relative** path (for example `/complete-profile`, `/verification` or `/`).
5. On failure the backend redirects to `/login?error=<code>` (or `/register?error=no_account`), and the app shows a plain message.

## A4. Contract

**Routes (backend)**

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/auth/google` | public | Start the flow. Query: `app` (`customer` or `agent`), `mode` (`login` or `register`), `type` (`agent` or `individual`, only for `app=agent` with `mode=register`), `next` (safe relative path). |
| GET | `/auth/google/callback` | public | Google returns here. Completes the sign-in and redirects. |
| POST | `/auth/complete-profile` | signed in | Saves the phone number (and optionally the name) for a Google account. |
| GET | `/users/me` | signed in | Existing route. Now also returns `profileComplete`, `authProviders` and `hasPassword`. |

**Error codes (appear as `?error=<code>` on the redirect)**

| Code | Meaning | Customer site message | Agent dashboard message |
|---|---|---|---|
| `google_cancelled` | The person cancelled on Google | Google sign-in was cancelled. You can try again or use your email and password. | same |
| `google_failed` | State, code or token check failed | We could not sign you in with Google. Please try again. | same |
| `google_email_unverified` | Google says the email is not verified | The email on that Google account is not verified, so it cannot be used here. | same |
| `account_suspended` | The account is suspended | This account is suspended. Please contact support. | same |
| `wrong_app` | The email belongs to the other kind of account | This email belongs to an agent or owner account, so it cannot sign in here. | This email belongs to a traveler account, so it cannot sign in here. Use a different email for your partner account. |
| `no_account` | Agent app, login mode, no partner account | not used | There is no partner account for this Google account yet. Choose Agent or Individual and create one. |
| `google_unavailable` | Google variables are missing on the server | Google sign-in is not available right now. Use your email and password. | same |

## A5. Environment (strict)

- **Values live in `.env` files only.** Add the new variables to the backend `.env`. If the backend already has an `.env.example`, add the same names there with empty values. Never write a key, secret, id or URL value in source code, tests, README or comments.
- **The frontends need no new variables.** Do not add any `NEXT_PUBLIC_` variable for Google. The button is a relative link.
- Backend variables:

| Name | Use |
|---|---|
| `GOOGLE_CLIENT_ID` | the OAuth client id |
| `GOOGLE_CLIENT_SECRET` | the OAuth client secret |
| `GOOGLE_REDIRECT_URI_CUSTOMER` | the callback URL registered for the customer site |
| `GOOGLE_REDIRECT_URI_AGENT` | the callback URL registered for the agent dashboard |
| `GOOGLE_STATE_SECRET` | signs the short-lived sign-in state cookie |

- Validate these with the existing env validation. They are optional as a group: when any is missing, Google login is switched off, the Google routes redirect with `google_unavailable`, and the server still starts.
- Never log the client secret, authorization codes, tokens, ID tokens or cookie values.

## A6. Security rules

- Use the server-side authorization code flow with **PKCE**, a `state` and a `nonce`. Scopes: `openid`, `email` and `profile` only. Do not request offline access or any other scope.
- Match accounts by Google's stable user id (`sub`), never by email alone. Use email only to find an existing account to link, and only when Google says `email_verified` is true.
- Verify the ID token: signature, audience equal to the client id, issuer, expiry and `nonce`.
- Redirect targets are always relative paths. `next` must start with a single `/` and must not contain `//`, a scheme or a backslash. Otherwise ignore it.
- Never put tokens, authorization codes or personal data in any redirect URL.
- The state cookie is signed, httpOnly, `secure` in production, `sameSite: "lax"` (so it returns after the redirect from Google), host-only (no `domain` attribute), limited to the path `/api/v1/auth/google`, and valid for 10 minutes. It is cleared on every outcome.
- Apply the existing `auth` rate limiter to the Google routes.
- The password of an unverified email and password account is removed when Google links to it, so nobody who pre-registered someone else's email keeps access.
- A password login against an account with no password fails with the same generic "Invalid email or password" message, so responses do not reveal how an account was created.
- Do not import the Google profile picture. People without a photo already show initials.

## A7. Interface rules (customer website and agent dashboard)

Follow the design rules already in use in those apps. The ones that matter here:
- **One brand colour, no gradients, no glass or glow, no emoji, no em dashes.** The only exception is the official Google "G" logo, which keeps its own colours as Google requires.
- **Button:** follow Google's current branding guidelines: a plain solid button with a thin border and a neutral background, the text **Continue with Google**, and the official "G" logo beside the text, unaltered. Do not tint, recolour or restyle the logo. Build it as one small `GoogleButton` component.
- **Logo file:** the project owner supplies the official logo file from Google's branding resources and saves it in each app as `public/images/google-g.svg`. The assistant does not draw, download or recolour it. Until the file exists, the button shows the text only, and the assistant lists this in its report.
- The button is a **plain anchor** to the backend route (not a Next.js `Link`, and not a fetch), so the browser performs a full navigation.
- Put it below the form, separated by a plain line with the word "or". Keep the same size and weight as the main button.
- Plain Indian English copy, short sentences, no hype words, no exclamation marks. No "it's not X, it's Y" phrasing.
- Motion only for dialogs, toasts and focus states. No decorative animation.
- Page titles: the new page uses the title `Complete your profile`, following the title template already set in each app.

## A8. Code style: write it like a human developer

- Plain, readable code. Prefer simple functions, `if / else`, clear early returns and `async / await`. No clever one-liners, no deep nesting, no heavy abstraction.
- Small functions and components. Use the existing helpers instead of writing new ones.
- Names are plain and common. Types are simple. No `any` in TypeScript.
- Few comments, written plainly, only where the reason is not obvious (for example why the cookie uses `sameSite: "lax"`). No banner comments, no step narration, no comments that repeat the code.
- No emoji and no em dashes or en dashes anywhere: code, comments, UI text, tests, docs, commit messages.
- No unused code, no commented-out code, no chat-style leftovers.
- Keep error handling simple: use the existing `ApiError` and error middleware on the backend. The Google callback is the exception because it must redirect instead of returning JSON, so it handles its own errors and always redirects.
- Test data uses realistic Indian names and cities.

## A9. Out of scope

Other social providers (Facebook, Apple and so on), Google One Tap or the Google sign-in script, the Google profile picture, offline access or refresh tokens from Google, any other Google API, Google login for admin accounts, a separate "set password" endpoint (the existing forgot-password flow covers it), account merging screens, and any change to the super admin app.

## A10. Working protocol for the assistant

**The assistant never commits.** Do not run `git add`, `git commit`, `git tag`, `git push`, `git merge`, `git rebase`, `git reset`, `git stash` or any other command that changes the staging area, the history or the remote. Leave all changes uncommitted in the working tree. Read-only commands such as `git status` and `git diff` are fine.

For every plan:
1. **Inspect** the code the plan touches (see A2).
2. **Implement** the plan fully, following A5 to A8.
3. **Run** the app and the tests, fix errors, and try the flow as far as it can be tried without real Google credentials (mocked tests for the backend).
4. **Review** your own code against A6 to A8. Remove emoji, em dashes, decorative comments, unused code and hardcoded values.
5. **Report**: files created and changed, new packages, new variable names added to `.env` (names only, never values), required one-time database steps, differences from this file, anything left for a later plan, and the suggested commit message and tag for this plan.
6. **Stop** and wait for the next plan.

## A11. Git and commit messages

The assistant never commits (see A10). The developer commits by hand after checking the acceptance list. Format: `type: Google Login Plan <number> - short plain message`, followed by a short body. Lowercase message, present tense, no full stop, no emoji, no em dash. Tags are named `google-plan-<number>-done`. To see them later: `git log --oneline --grep="Google Login Plan"`.

---

# Part B: Google Cloud setup checklist (done by the developer)

Do these steps in the Google Cloud Console before testing. They are not code.

1. Create a project (or use an existing one) for Trip Wheels.
2. Configure the **OAuth consent screen**: app name, support email, your domain, and links to your privacy policy and terms pages. Choose the user type that fits a public app (External). Add only the scopes `openid`, `email` and `profile`.
3. Create an **OAuth client ID** of type **Web application**.
4. Under **Authorized redirect URIs**, add one URI per app and per environment. The path is always `/api/v1/auth/google/callback` on the app's own host:
   - Production customer site and production agent dashboard (HTTPS only).
   - Local development. Run the customer site and the agent dashboard on different hostnames so their cookies stay separate: for example the customer site at `http://localhost:3000` and the agent dashboard at `http://127.0.0.1:3001`. Browsers share cookies between ports on the same hostname, so two apps on `localhost` would overwrite each other's session. Register both local callback URIs.
   - Google requires an exact match, so check the scheme, host, port and path carefully.
5. Copy the client id and client secret into the backend `.env`, together with the two redirect URIs and a long random value for `GOOGLE_STATE_SECRET`. Do not paste them into chat, code or the README.
6. While the consent screen is in testing status, Google only lets the test users you list sign in. Publish the app when you are ready for everyone. Check Google's current publishing and verification rules for your app type and scopes in the console.
7. Add the official Google "G" logo file to `public/images/google-g.svg` in both frontend apps, taken from Google's branding resources.

---

# Plan 1: Backend Data Model and Profile Gate

**Where:** `backend/`

**Goal:** the user model, middleware and env validation are ready for accounts that have no password and no phone number yet.

### Tasks

1. **User model changes:**

| Field | Change |
|---|---|
| `googleId` | new, string, unique with a sparse index, never returned in responses |
| `authProviders` | new, list of `password` and `google`. Existing users and email sign-ups get `["password"]` |
| `profileComplete` | new, boolean, default `true`. Set to `false` explicitly only for new Google accounts. Existing users stay `true` without any migration |
| `password` | no longer required. Still hashed, still never selected by default |
| `phone` | no longer required at the schema level. Keep the unique constraint as a **sparse** unique index. Never store an empty string or null: leave the field undefined |
| `isEmailVerified` | unchanged, but always true for Google accounts |

2. **Indexes:** if the existing `phone` index is unique but not sparse, it must be dropped and recreated as sparse, otherwise two Google accounts without phone numbers will collide. Do the index change in a small one-off script in `scripts/` (or by the project's usual index sync approach) and list it in the report as a required one-time database step.
3. **Email registration:** keep requiring a phone number and a password. Set `authProviders` to `["password"]` and `profileComplete` to `true`. If the email already belongs to a Google account, answer with a plain message to sign in with Google or reset the password.
4. **Login by password:** when the account has no password, fail with the same generic "Invalid email or password" message as a wrong password.
5. **Password reset:** make `forgot-password` and `reset-password` work for Google-only accounts. A successful reset sets the password and adds `password` to `authProviders`.
6. **Change password:** for an account without a password, answer with a plain error that tells the person to use reset password.
7. **`GET /users/me`:** also return `profileComplete`, `authProviders` and a computed `hasPassword`. Never return `googleId`, hashes or tokens.
8. **Middleware:** add `requireProfileComplete`. It blocks with a clear `PROFILE_INCOMPLETE` error until a phone number is saved. Apply it to every write route under `/publishers` and to `POST /bookings` (if those routes exist yet; otherwise leave a short note in the report so the later plans use it).
9. **Env validation:** add the Google variables from A5 as an optional group. When all are present, Google is enabled. When any is missing, it is disabled and a clear `googleEnabled` helper returns false. Add the names to `.env` and to `.env.example` if one exists (empty values there).
10. **Package:** install `google-auth-library`.

### Acceptance

- The server starts with and without the Google variables.
- Two accounts without phone numbers can exist at the same time (the index change works).
- An existing user still logs in normally and `profileComplete` reads as true.
- A Google-only account (created by hand in a test) cannot log in with a password, can reset its password, and then can log in with both.
- `requireProfileComplete` blocks an incomplete account with the `PROFILE_INCOMPLETE` error.
- No response ever contains `googleId`, a password hash or a token.

### Suggested commit message (for the developer)

The assistant does not commit. After you check the acceptance list, commit this plan yourself:

```
feat: Google Login Plan 1 - add data model changes and profile gate

Add google id, auth providers and profile complete fields, optional password and phone, sparse indexes, profile gate middleware and google env validation.
```

Suggested tag: `google-plan-1-done`

---

# Plan 2: Backend Google Flow

**Where:** `backend/`

**Goal:** the complete server-side Google flow, from the first redirect to the signed-in session.

### Files

Add a `google.service.js` (Google client, state cookie, account rules), a controller, routes mounted under `/auth`, and a validator for the start query. Reuse the existing token and cookie code from password login through one shared function (for example `createSession`), so password login and Google login issue identical sessions. If that code is inline in the login controller, move it into a shared function without changing its behaviour.

### Start: `GET /auth/google`

1. If Google is disabled, redirect to `/login?error=google_unavailable`.
2. Validate the query. `app` must be `customer` or `agent`. `mode` defaults to `login`. For `app=agent` with `mode=register`, `type` must be `agent` or `individual`. Sanitize `next` as in A6. Invalid input redirects with `google_failed`.
3. Create one OAuth client per app, using the redirect URI for that app from the environment, so the same redirect URI is used for the code exchange.
4. Create `state`, `nonce` and a PKCE code verifier and challenge. Store `state`, `nonce`, the verifier, `app`, `mode`, `type` and `next` in one signed cookie as described in A6.
5. Redirect to Google's authorization URL with the scopes `openid email profile`, the code challenge (S256), `state`, `nonce`, and `prompt=select_account`. If the installed version of `google-auth-library` does not accept `nonce` in its options, add it as an extra query parameter to the generated URL.

### Callback: `GET /auth/google/callback`

1. Read and always clear the state cookie. If it is missing, expired, badly signed, or the returned `state` does not match, redirect with `google_failed`.
2. If Google returned an `error` (the person cancelled), redirect with `google_cancelled`.
3. Exchange the code together with the code verifier. Verify the ID token (signature, audience, issuer, expiry) and check that its `nonce` equals the saved one. Any failure redirects with `google_failed`.
4. Require `email_verified` to be true, otherwise redirect with `google_email_unverified`.
5. Take only `sub`, `email` (lowercase) and `name` from the token.
6. Apply the **account rules**, in this order:
   1. Find a user by `googleId`. If found, go to rule 4.
   2. Otherwise find a user by email. If found, run the role check (rule 4), then link: set `googleId`, add `google` to `authProviders`, and set `isEmailVerified` to true. If the account had **not** been email-verified before, also remove its password, set `authProviders` to only `google`, clear its stored refresh token, and delete its pending OTP records.
   3. Otherwise create an account:
      - `app=customer`: create a `customer`, for either mode.
      - `app=agent` with `mode=register` and a valid `type`: create a user with that role.
      - `app=agent` with `mode=login`: redirect to `/register?error=no_account` and create nothing.
      - New accounts get the name from Google (fall back to the part of the email before the `@`, trimmed to the allowed length), `isEmailVerified` true, `authProviders: ["google"]`, no password, no phone and `profileComplete` false.
      - If the database reports a duplicate key (two callbacks at the same time), look the user up again instead of failing.
   4. Role check for every existing user: a `customer` may only use `app=customer`, an `agent` or `individual` may only use `app=agent`, and an `admin` is never allowed. Anything else redirects with `wrong_app`.
   5. A suspended account redirects with `account_suspended`.
7. Create the session with the shared function (the same httpOnly, host-only cookies as password login) and update `lastLoginAt`.
8. Redirect to a relative path: when `profileComplete` is false, go to `/complete-profile` and carry `next` as a query parameter. Otherwise go to the `next` path, or `/`.

### Errors

Failures redirect to a relative path with `?error=<code>`: `/login` for most codes and `/register` for `no_account`. Use only the codes in A4. Wrap the callback in its own try and catch so that **any** unexpected error ends in a redirect with `google_failed` and never in a JSON error or a stack trace. Log only the error category, never codes, tokens or personal data.

### Complete profile: `POST /auth/complete-profile`

- Requires a signed-in user. If `profileComplete` is already true, answer 400 with "Your profile is already complete."
- Body: `phone` (normalized per the existing phone helper, a 10-digit Indian mobile number with 91 added) and an optional `fullName` (trimmed, within the allowed length). Validate with the existing validator style.
- The phone must be unique. A duplicate answers 409 with a plain message.
- On success set `profileComplete` to true, reset any phone confirmation fields the same way a phone change does, and return the updated user.

### Acceptance

- A full run with the Google library mocked works for: a new customer, a new agent, a new individual, a returning user, linking to a verified email and password account, linking to an unverified one (password removed), and complete profile.
- Agent app, login mode, no account: `no_account`, nothing created.
- A customer email on the agent app, an agent or individual email on the customer app, and an admin email: all `wrong_app`.
- Missing, expired or tampered state cookie, wrong `state`, wrong `nonce`, wrong audience and an unverified Google email are all rejected with the right code.
- A suspended account gets `account_suspended`.
- The session cookies are host-only, no token or personal data appears in any redirect URL, and the state cookie is cleared on every outcome.
- Password login still works exactly as before.

### Suggested commit message (for the developer)

The assistant does not commit. After you check the acceptance list, commit this plan yourself:

```
feat: Google Login Plan 2 - add backend google flow and complete profile

Add google start and callback routes with pkce, state and nonce checks, account linking and creation rules, role checks, error redirects and the complete profile route.
```

Suggested tag: `google-plan-2-done`

---

# Plan 3: Customer Website

**Where:** the customer website folder (`frontend/`)

**Goal:** customers can continue with Google, see clear messages when it fails, and add their phone number before booking.

### Tasks

1. **`GoogleButton` component** (A7). It receives `app`, `mode` and an optional `next`, builds the relative link `/api/v1/auth/google?app=customer&mode=<mode>&next=<safe path>`, and renders a plain anchor. Reuse the existing safe-path helper for `next`. Add `public/images/google-g.svg` handling: show the logo when the file exists, otherwise text only.
2. **Login page:** add the button below the form with the "or" line, `mode=login`. Add one plain help line under the form: "If you signed up with Google, use Continue with Google."
3. **Register page:** the same, with `mode=register`.
4. **Error messages:** a small client component reads `?error=<code>` from the URL, shows the matching customer message from A4 above the form, and then removes the parameter from the URL with `router.replace` so a refresh does not repeat it. Unknown codes show the `google_failed` message. Keep the messages in one place (the constants file).
5. **`useAuth`:** expose `profileComplete`, `authProviders` and `hasPassword` from `/users/me`. Update the user type.
6. **Complete profile page** at `/complete-profile` (inside the protected group):
   - Fields: phone number (10-digit Indian mobile number, the form adds country code 91 when sending) and full name, prefilled from the account and editable. Use `react-hook-form` and `zod` like the other forms.
   - One plain line: "Owners see your phone number after they accept your booking."
   - Submit with `POST /auth/complete-profile`. Show field errors, including the duplicate phone message from the API. On success refetch the user and go to the `next` query parameter (safe path only) or `/`.
   - If `profileComplete` is already true, redirect away from this page.
   - Title: `Complete your profile`.
7. **Guards:** while `profileComplete` is false, every route in the protected customer group redirects to `/complete-profile?next=...`. Public pages (home, search, vehicle details) stay open. The booking request page requires a complete profile.
8. **Email verification:** Google accounts are already verified, so the unverified email banner and the OTP step never show for them.
9. **Profile page:** when `hasPassword` is false, replace the change password form with "You signed in with Google. To add a password, use Reset password." and a link to `/forgot-password`.
10. Keep every other part of authentication unchanged.

### Acceptance

- Both pages show the button below the form, the button is a plain link, and a click leaves the site to the backend route.
- Each error code shows its message once, and the parameter disappears from the URL.
- A new Google customer lands on `/complete-profile`, cannot open the protected pages until the phone number is saved, and then continues to the page they wanted.
- A duplicate phone number shows the API message on the field.
- A Google-only customer sees the "add a password" note on the profile page.
- The button follows A7, with no other colour added to the site, and the code follows A8.

### Suggested commit message (for the developer)

The assistant does not commit. After you check the acceptance list, commit this plan yourself:

```
feat: Google Login Plan 3 - add google sign-in to customer website

Add google button, error messages, complete profile page, profile gate guards and google-only account note on the profile page.
```

Suggested tag: `google-plan-3-done`

---

# Plan 4: Agent Dashboard

**Where:** the agent dashboard folder (currently `admin/`)

**Goal:** owners can register and sign in with Google, finish a short profile step, and still complete the full verification procedure.

### Tasks

1. **`GoogleButton` component** as in Plan 3, with `app=agent`. It also accepts `type` for registration.
2. **Register page:** the owner type choice stays first (Agent or Individual). Under the form add the button with the "or" line, linking to `/api/v1/auth/google?app=agent&mode=register&type=<agent|individual>&next=...`. Keep it **disabled** until a type is chosen, with the plain hint "Choose Agent or Individual first."
3. **Login page:** add the button with `mode=login`. Signing in with Google here never creates an account. Add the help line: "If you signed up with Google, use Continue with Google."
4. **Error messages:** the same component as Plan 3, using the agent dashboard messages from A4. For `no_account` the backend redirects to `/register`, so the register page must also read and show `?error=`. Clear the parameter after showing it.
5. **`useAuth`:** expose `profileComplete`, `authProviders` and `hasPassword`, alongside the publisher profile summary already there.
6. **Complete profile page** at `/complete-profile`:
   - Fields: phone number (10-digit Indian mobile number, 91 added when sending) and full name, prefilled and editable. The owner type is shown but not editable.
   - Plain explanation: "We call this number to verify your account, and customers see it after you accept a booking."
   - Submit with `POST /auth/complete-profile`, then go to `/verification`. If `profileComplete` is already true, redirect away.
   - Title: `Complete your profile`.
7. **Access rules:** add a first state to the existing access rules helper: "Profile incomplete (new Google account with no phone number)": only `/complete-profile` can be opened, everything else redirects there. Keep the other states as they are (email not verified, verification not approved, approved, suspended).
8. **Onboarding still applies in full.** A Google owner sees the same verification checklist as any other owner. Their email is already verified and their phone was saved in step 6, but the profile, documents, submission, the verification call and the Admin decision are all still required. Until approval, Vehicles, Bookings and Schedule stay closed by the existing access rules. A returning owner who signs in with Google before finishing lands on the verification checklist. After approval, Google sign-in opens the full dashboard. Add one plain line on the checklist for Google sign-ups: "The verification call confirms the phone number you saved."
9. **Checklist wording:** show "Email verified" as done automatically for Google sign-ups.
10. **Profile page:** when `hasPassword` is false, replace the change password form with "You signed in with Google. To add a password, use Reset password." and a link to `/forgot-password`.
11. Keep every other part of authentication unchanged.

### Acceptance

- Registering with Google as an agent and as an individual works, lands on `/complete-profile`, then on the verification checklist.
- The register button stays disabled until an owner type is chosen.
- Google on the login page with no partner account creates nothing, goes to `/register`, and shows the `no_account` message.
- A Google owner cannot open Vehicles, Bookings or Schedule before approval, and after approval signs in with Google straight to the dashboard.
- A traveler email shows the `wrong_app` message here.
- Each error code shows its message once and then disappears from the URL.
- The button follows A7, and the code follows A8.

### Suggested commit message (for the developer)

The assistant does not commit. After you check the acceptance list, commit this plan yourself:

```
feat: Google Login Plan 4 - add google sign-in to agent dashboard

Add google button on register and login, error messages, complete profile page, access rule for incomplete profiles and google notes on the checklist and profile pages.
```

Suggested tag: `google-plan-4-done`

---

# Plan 5: Tests, Docs and End-to-End Check

**Where:** all three apps

**Goal:** the feature is tested, documented and proven to work with a real Google account.

### Backend tests

Use the existing test setup (Jest, Supertest, `mongodb-memory-server`). Mock `google-auth-library` so no test calls Google. Cover:
- The start route: valid and invalid `app`, `mode`, `type` and `next`, the state cookie flags and the redirect URL (scopes, code challenge, `state`, `nonce`, `prompt`).
- The callback: every account rule, the role checks, the suspended case, linking a verified account, linking an unverified account (password removed, refresh token cleared), duplicate key handling, and every error code.
- Complete profile: success, already complete, duplicate phone, invalid phone.
- The profile gate on a protected route.
- Password login, registration and reset still behave as before, including for Google-only accounts.
- No response or redirect URL contains a token, a code, `googleId` or a hash.

### Frontend tests

Use the existing test setup in each app:
- `GoogleButton`: the link it builds for each `app`, `mode` and `type`, safe `next` handling, disabled state, and the text-only fallback when the logo file is missing.
- The error message component: each code maps to the right message, unknown codes fall back, and the parameter is removed from the URL.
- The complete profile form: validation, duplicate phone message, redirect after success.
- The guards and the agent access rules helper with `profileComplete` false.

### Docs

- **Backend README:** a short "Google login" section: what it does, the routes, the variable names (names only, never values), the Google Cloud steps from Part B in short form, the local development note about using different hostnames for the two apps, and the one-time index step from Plan 1.
- **Frontend and agent dashboard READMEs:** one short paragraph each: the button is a plain link to the backend, there is no Google script, no new environment variable, the logo file path, and the complete profile page.
- Keep all docs in plain language, without em dashes or emoji.

### Manual end-to-end check (done by the developer with a real Google account)

1. Customer site: continue with Google, complete the profile, search, open a vehicle, and send a booking request. Sign out and sign in with Google again.
2. Agent dashboard: register with Google as an individual, complete the profile page, see the verification checklist, and confirm Vehicles, Bookings and Schedule are closed. Sign out and sign in with Google again and confirm you land on the checklist.
3. Use an email that already has a verified password account and sign in with Google to check linking.
4. Try the customer's Google email on the agent dashboard and the reverse, and confirm the `wrong_app` message.
5. Click Google on the agent login page with an email that has no partner account and confirm `no_account`.
6. Cancel on the Google screen and confirm `google_cancelled`.

### Acceptance

- Backend and frontend tests pass, and lint and type checks pass in each app.
- The READMEs contain the Google section and no secret, key or value.
- The manual check passes with a real Google account in a local setup with separate hostnames.
- A final search of all changed files finds no emoji, no em dashes, no hardcoded client id, secret or URL, and no `NEXT_PUBLIC_` Google variable.

### Suggested commit message (for the developer)

The assistant does not commit. After you check the acceptance list, commit this plan yourself:

```
chore: Google Login Plan 5 - add tests, docs and end-to-end check

Add backend and frontend tests for the google flow, readme notes for setup and local development, and the manual end-to-end checklist.
```

Suggested tag: `google-plan-5-done`

---

# Final Definition of Done

- "Continue with Google" works on the customer website and the agent dashboard, and nowhere else.
- Customers can sign up and sign in with Google and must add a phone number before booking.
- Agents and individuals can register and sign in with Google, but still complete the full verification procedure before they can list vehicles or receive bookings.
- One email belongs to one account with one role, and admin accounts never use Google.
- The backend runs the whole flow with PKCE, state and nonce, verifies the ID token, links accounts only by verified email, and redirects only to relative paths.
- Sessions use the same host-only cookies as password login, and no token or personal data appears in any URL.
- Google values exist only in the backend `.env`. No key, secret or id appears in code, tests or docs, and the frontends have no new environment variable.
- The Google logo is the only element outside the one-brand-colour rule, and it is the official file supplied by the project owner.
- The code is plain and human-written, with few comments, and no emoji or em dashes anywhere.
