# Trip Wheels Super Admin: Part A - Global Context

## A1. What we are building

Trip Wheels (working name, stored in one constant) is a marketplace where travelers request bikes and cars at travel destinations from agents (rental shops) and individual owners. Platform rules and the other apps are already defined. This app is the operations console for the team that runs the platform.

"Super admin" here means the team members who sign in with the backend's admin role. The backend has one admin role and no sub-roles. Do not invent roles, permission levels or team management in the interface. If the backend later adds roles, this app can be extended.

Rules the interface must respect:

- The platform does not handle payments. There are no payment, refund, payout, commission or revenue screens. Prices are informational. Money is settled between customer and owner at pickup.
- Nothing goes live without review. An owner must pass verification, and each vehicle must be approved, before customers can see it. Verification needs documents, a verification call and an Admin decision. Approval is blocked by the backend until the call is recorded, the documents are approved and the phone number is confirmed.
- Every admin action is audited. The backend writes an audit entry for each change. The interface says so near every destructive or important action, and asks for a written reason where the backend requires one.
- Personal data is sensitive. Identity documents, vehicle documents and phone numbers are private. Documents are shown only through short-lived signed links from the API, and are never stored, cached or logged by this app.
- Decisions are made with context. Every approval, rejection, suspension and resolution is made from a page that shows the facts the decision depends on, and ends with a written note when the backend allows one.
- Desktop first, phone capable. The team will mostly work on a desktop. The app must still be usable on a phone for urgent calls and quick decisions.
- Not installable. This app has no manifest, no service worker and no push notifications. Notifications appear only inside the app.

## A2. Existing project structure and first steps

The repository is one project with several apps:

```
trip-wheels/
  backend/       Express and MongoDB API
  frontend/      customer website (Next.js)
  admin/         agent dashboard app folder (do not change it)
  super-admin/   this app (the folder to work in)
```

The super-admin folder contains the default Next.js setup: app/, public/, .env, .gitignore, eslint.config.mjs, next-env.d.ts, next.config.ts, package.json, package-lock.json, README.md, tsconfig.json.

Work only inside super-admin/. Do not edit the other apps.

Before writing code:
- Read package.json, tsconfig.json, next.config.ts, eslint.config.mjs, .env, .gitignore, app/layout.tsx and app/globals.css. Note the installed versions of Next.js, React and Tailwind (if present) and follow the conventions of those versions. For example, in recent Next.js versions params, searchParams, cookies() and headers() are asynchronous, and the route-protection file may be called middleware or proxy depending on the version.
- Keep TypeScript with the existing app/ router at the project root (no src/ folder), and keep the path alias from tsconfig.json.
- Remove the default Next.js template content (starter page and unused SVG files).
- If the customer website in frontend/ or the agent dashboard in admin/ already exists, read them and copy the shared foundation (design tokens, fonts, ui components, api client, format helpers, check scripts) into this app, then adapt it. Do not import code across app folders. If those files do not exist yet, create them from scratch following A8 and A9.
- Read the backend routes and controllers in backend/src before writing API calls, so field names match the real code.

## A3. Tech stack

Next.js (App Router) with TypeScript in strict mode. Install only what a plan needs.

| Purpose | Choice |
|---|---|
| Styling | Tailwind CSS (install if missing), design tokens defined once in app/globals.css |
| Server state | @tanstack/react-query |
| Forms | react-hook-form, zod, @hookform/resolvers |
| Dates | date-fns and the built-in Intl APIs (locale en-IN) |
| Class names | clsx |
| Icons | lucide-react, used sparingly and never for sparkle, magic wand or "AI" style symbols |
| Accessible primitives | Radix primitives only where accessibility is hard (dialog, tabs, popover). Everything else is plain hand-written components |
| Maps | leaflet and react-leaflet with OpenStreetMap tiles, loaded only on the client, wrapped in one Map component (used to check an owner's pickup pin) |
| Server-only guard | server-only |
| Favicon generation | sharp and png-to-ico as dev dependencies |
| Tests | vitest, @testing-library/react, @testing-library/jest-dom |

Do not add a large UI kit, a charting library, Redux or another global state library, an animation library, a CSS-in-JS library, any analytics or tracking script, or any third-party service SDK. This app talks only to the backend.

## A4. Folder structure to create

```
app/
  (auth)/      login, forgot-password, reset-password
  (console)/   page.tsx (Today), tasks, verifications, vehicles, destinations,
               bookings, issues, users, watchlists, exports, analytics,
               settings, audit-log, notifications, profile
  layout.tsx  globals.css  robots.ts  not-found.tsx  error.tsx
components/
  ui/  layout/  verification/  vehicles/  bookings/  issues/  users/  maps/  common/
lib/
  api/          client, one file per resource
  env.ts  format.ts  constants.ts  query-keys.ts
hooks/  types/  tests/  scripts/
public/
```

Route groups (names in brackets) do not change the URLs.

## A5. Conventions

API access:
- All browser requests go to /api/v1/... on the same origin. In next.config.ts add a rewrite that proxies /api/v1/:path* to the backend. This keeps the backend's httpOnly cookies working without CORS problems. Cookies are host-only, so this app's session is separate from the customer site and the agent dashboard.
- All console data is fetched in the browser with React Query. Pages are client-rendered behind login. Do not read cookies on the server to fetch data.
- One fetch wrapper in lib/api/client.ts: sends credentials: "include", parses the backend response shape, throws a typed ApiError on failure. On a 401 it calls /auth/refresh-token once (share one in-flight refresh between parallel requests), retries the original request, and if refresh fails it clears the session and goes to login.
- One file per resource in lib/api/ (auth.ts, dashboard.ts, verifications.ts, vehicles.ts, destinations.ts, bookings.ts, issues.ts, users.ts, tasks.ts, settings.ts, audit.ts, analytics.ts, exports.ts, notifications.ts), typed models in types/. No any. Query keys live in lib/query-keys.ts.

Backend response shapes:
- Success: { statusCode, data, message, success: true }.
- Error: { statusCode, message, errors: [], success: false }. Map field errors in errors onto the matching form fields.
- Lists: data has items, page, limit, totalItems, totalPages.

Data states:
- Every screen that loads data has three clear states: loading (a skeleton that matches the layout), empty (a short explanation), and error (a plain message and a retry button).

Tables and filters:
- Every list is a real table on desktop (header row, thin row dividers, no zebra, no boxes around rows) and stacked rows on phones, with the most important line first.
- Filters sit above the table in one row. Filter values, sort, search text and the page number live in the URL query string so views can be shared and the back button works. Search boxes wait about 300 ms after typing before querying.
- Pagination shows the range ("21 to 40 of 138") and the total.
- Lists refetch on window focus. Queues that need attention (verifications, tasks, issues) also refetch every 60 seconds.

Formatting (in lib/format.ts, used everywhere):
- Dates and times: en-IN, local time zone, for example 20 Nov 2026, 9:00 am. The API sends UTC. Convert date inputs to ISO UTC before sending.
- "Waiting for": how long since something was submitted (2 days, 5 hours), used to show queue age.
- Phone numbers: stored as digits with country code. Show as +91 98765 43210 with a tel: link and a copy button.
- Currency: INR with Indian digit grouping, for example ₹1,299.
- Percentages and averages: one decimal place at most.

Forms and decisions:
- react-hook-form with a zod schema per form. Errors appear under the field, labels stay visible, and the submit button is disabled while sending.
- Every approval, rejection, suspension, override and resolution opens a confirmation dialog that names the person, vehicle or booking, states what will happen, and has a note field. The note is required wherever the backend requires one, and for any reject, suspend or override action even if the backend does not. The dialog ends with the line "This action is recorded in the audit log."

Accessibility and responsiveness:
- Semantic HTML, visible focus ring, labels on every control, contrast at WCAG AA, keyboard-operable dialogs and tabs, prefers-reduced-motion respected. Check 360, 768, 1280 and 1440 px.

## A6. Environment and secrets (strict)

- Environment values live in the .env file only. Create or update .env in super-admin/ and put every variable there. The file already exists, so keep its current content and add what is missing.
- Do not create .env.example, .env.local, .env.production or any other env file.
- No value, key, token, URL or secret may be written in source code, including components, tests, scripts, config files, README, comments and docs. Code reads values only through lib/env.ts. The only other place that may read process.env is next.config.ts, for the API rewrite and security headers.
- Nothing is exposed to the browser. Do not use any NEXT_PUBLIC_ variable. Browser code calls relative paths such as /api/v1/... and never needs a backend address. lib/env.ts starts with import "server-only" so it can never be bundled into client code.
- This app holds no third-party keys. There is no Cloudinary, SMTP, push or map key here. The backend owns all of them. The map uses OpenStreetMap tiles, which need no key.
- Variables this app needs:

| Name | Used for |
|---|---|
| BACKEND_URL | the address the API rewrite forwards to (read in next.config.ts only) |
| APP_URL | the public address of this console, used for page metadata (read through lib/env.ts) |

- lib/env.ts validates the variables with zod, throws a clear error when one is missing, and returns them through small named functions. Error messages name the variable but never print its value.
- Make sure .gitignore ignores .env and any .env.* file. The README says that required variables are set in .env and validated in lib/env.ts, and never lists values.
- Never log environment values, request headers with cookies, tokens or document links.
- Tests mock lib/env instead of setting environment values.
- Plan 1 adds npm run check:env to enforce all of this.

## A7. Backend contract used by this console

Confirm every item against the real backend code and report any difference. Build lib/api/ around the real shapes. Do not invent endpoints. When an endpoint this prompt expects does not exist, build the screen from the data that is available, hide the unavailable action, and list the gap in your report.

Endpoints:

| Area | Endpoints |
|---|---|
| Auth | POST /auth/login, /auth/refresh-token, /auth/logout, /auth/forgot-password, /auth/reset-password, /auth/change-password |
| User | GET and PATCH /users/me, PATCH /users/me/avatar |
| Dashboard | GET /admin/dashboard |
| Tasks | GET /admin/tasks, PATCH /admin/tasks/:id |
| Verification | GET /admin/verifications, GET /admin/verifications/:publisherId, PATCH /admin/verifications/:publisherId/verification-call, PATCH /admin/verifications/:publisherId/documents/:docId, /approve, /reject, /request-reverification |
| Users | GET /admin/users, GET /admin/users/:id, PATCH /admin/users/:userId/confirm-phone, /suspend, /unsuspend |
| Vehicles | GET /admin/vehicles, PATCH /admin/vehicles/:id/approve, /reject, /suspend |
| Destinations | GET /destinations, POST /admin/destinations, PATCH /admin/destinations/:id |
| Bookings | GET /admin/bookings, GET /bookings/:id, PATCH /admin/bookings/:id/status |
| Trust | GET /admin/issues, GET /issues/:id, PATCH /admin/issues/:id, PATCH /admin/reviews/:id/hide |
| Watchlists | GET /admin/flags/individual-misclassification, GET /admin/watchlists/insurance-expiry |
| Insight and system | GET /admin/analytics/overview, GET /admin/analytics/destinations, GET and PATCH /admin/settings, GET /admin/audit-logs, GET /admin/export/:resource |
| Notifications | GET /notifications, PATCH /notifications/:id/read, PATCH /notifications/read-all |

Labels (keep in lib/constants.ts, never type them twice):

Verification status:
- not_submitted: Not submitted
- pending: Waiting for review
- approved: Approved
- rejected: Not approved
- reverification_required: New documents needed
- suspended: Suspended

Vehicle status:
- draft: Draft
- pending_review: Waiting for review
- active: Live
- paused: Paused
- suspended: Suspended
- rejected: Not approved

Booking status:
- requested: Requested
- confirmed: Confirmed
- rejected: Rejected by owner
- expired: Expired
- cancelled_by_customer: Cancelled by customer
- cancelled_by_publisher: Cancelled by owner
- vehicle_unavailable: Vehicle unavailable
- handover_declined: Handover declined
- no_show: No show
- ongoing: On trip
- completed: Completed

Issue type:
- vehicle_mismatch: Vehicle does not match
- chassis_mismatch: Chassis number does not match
- registration_mismatch: Registration number does not match
- vehicle_damage_undisclosed: Damage not disclosed
- not_as_promised: Not as promised
- vehicle_unavailable_at_pickup: Vehicle not available at pickup
- customer_no_show: Customer no show
- customer_damage: Damage by customer
- late_return: Late return
- misconduct: Misconduct
- other: Other

Issue status:
- open: Open
- under_review: Under review
- resolved: Resolved
- dismissed: Dismissed

Task type:
- call_publisher_no_response: Call: owner not replying to requests
- call_publisher_unconfirmed_vehicle: Call: vehicle not confirmed
- call_publisher_pickup_unconfirmed: Call: pickup not confirmed
- review_issue: Review an issue
- review_flag: Review a flag

Task statuses: open, in_progress, done.

## A8. Design direction and hard rules

The console should feel like a clear working tool for a small operations team: a booking register and a case file, not a startup admin template. It is denser than the other apps but uses the same brand so the products feel related. It must not look like generic AI output.

### A8.1 Hard rules (every one of these is mandatory)

1. No purple gradients: No gradients of any colour. Backgrounds, buttons, headers, text and image overlays are flat.
2. No glowing blobs: No blurred coloured shapes, glows, halos or large decorative blur elements behind content.
3. No glass cards: No backdrop-blur, no frosted or semi-transparent panels. Panels are solid with a thin border.
4. One brand colour: A single deep green plus its tints (see A8.2). No second accent colour. Warning and error colours exist only for status messages and are never decoration.
5. A font with character, not Inter: Headings use a display font with real personality (see A8.3). Inter, Roboto, Arial, Helvetica and the system font stack are not allowed as the visible font.
6. Not everything in three cards: No row of three equal cards anywhere. In particular, no row of statistic tiles on the Today page or the analytics page. Content is plain text, lists, tables and definition lists.
7. No bento grids: No mosaic of uneven tiles. Layouts are a sidebar plus one or two columns.
8. No sparkle icons: No sparkles, star bursts, magic wands or "AI" symbols. Star icons are allowed only to show a real review rating.
9. No emoji in headings: No emoji anywhere on the site, in code or in docs.
10. No em dashes: No em dash and no en dash anywhere: page text, titles, meta descriptions, alt text, notifications, error messages, code comments, README, docs and commit messages. Use a full stop, a comma, a colon, or the word "to" for ranges.
11. No "It's not X, it's Y" copy: Also avoid "not just X but Y", "more than just X", "whether you are X or Y", "say goodbye to", "imagine". State what the thing is and does, directly.
12. Real testimonials, or none: Build no testimonial section. The only feedback shown is real reviews from the API. Never invent names, quotes, ratings, photos, counts or logos.
13. No dot-grid backgrounds: No dots, grids, lines, noise, mesh or pattern backgrounds. The page background is flat paper colour.
14. Animation only where it matters: See A8.5.
15. Real photos of the product: See A8.6.
16. Your own favicon: See A8.7.
17. A real page title in the tab: See A8.7.
18. No lorem ipsum: No placeholder text of any kind, no "John Doe", no "Coming soon" filler. If real content is not available, leave the section out.

### A8.2 One brand colour and the tokens

| Token | Value | Use |
|---|---|---|
| --paper | #F7F2E8 | page background (a warm neutral, not a brand colour) |
| --surface | #FFFFFF | solid panels, tables, sidebar |
| --ink | #1F2A28 | main text |
| --ink-soft | #5B6663 | secondary text |
| --line | #E2DACB | borders and dividers |
| --brand | #1F5C4D | the one brand colour: primary buttons, links, active navigation, selected states |
| --brand-dark | #174A3E | hover and pressed state of brand |
| --brand-tint | #E3EEE9 | selected rows, active nav item, quiet highlights (a tint of the brand) |
| --warning | #A8691A | status messages only (waiting, due soon) |
| --negative | #B3362E | status messages only (errors, rejected, suspended, overdue) |

Approved and positive states use --brand. There is no separate success colour and no accent colour. Status is never shown by colour alone. Every status badge carries its text label. Check every text and background pair for WCAG AA contrast.

### A8.3 Typography

- Use the display font and body font aligned with the brand: Fraunces for headings/wordmark and Public Sans for body text.
- Body text is at least 16 px on phones. Tables and dense lists may use 14 px with enough line height.
- Load fonts with next/font (self-hosted), only the weights that are used, with display: swap.
- Not allowed as the main font: Inter, Roboto, Arial, Helvetica, the system-ui stack, and overused trend fonts such as Poppins, Montserrat and Space Grotesk.

### A8.4 Layout approach

- Desktop: fixed left sidebar (solid surface, plain text links, thin line on right, active item in --brand-tint with brand text) and a main area with page title and one line of context at top. Content width up to 1280 px for tables.
- Sidebar groups: Work (Today, Tasks, Verifications, Vehicles, Issues), Records (Bookings, Users, Destinations), Insight (Analytics, Watchlists, Exports), System (Settings, Audit log). Waiting counts appear as plain numbers.
- Top bar: page title, notification bell, "Signed in as {name}", Sign out button.
- Phone and tablet: sidebar becomes a menu sheet opened from top bar. Tables become stacked rows.
- Review pages (verification, vehicle, issue): two-column layout on desktop. Left column holds facts/checks as definition lists. Right column holds documents/evidence in a viewer. Sticky action bar at the bottom.
- Detail pages: definition lists (label left, value right), plain headings, thin dividers.
- Today: ordered lists only (see Plan 3). No tiles, no counters row, no chart.
- Simple text wordmark in display font using APP_NAME with DASHBOARD_NAME label.
- One light theme. No dark mode.

### A8.5 Motion

- Allowed: short fade or slide (150 to 200 ms) when a dialog, menu sheet, dropdown or toast opens/closes; clear focus and pressed state on controls; quiet skeleton pulse while loading.
- Not allowed: entrance animations, scroll-triggered effects, parallax, hover lift/scale on rows, animated counters, looping or decorative animation, animated backgrounds, page transitions.
- Respect prefers-reduced-motion.

### A8.6 Photos

- The only images are real vehicle photos, identity/vehicle document images, issue evidence photos and owner avatars returned by the API.
- Empty states are text only. People without an avatar show initials in a plain circle.
- Show vehicle photos in a simple gallery. Show documents/evidence in a viewer with zoom and "Open in a new tab" link (rel="noreferrer").
- Every image has meaningful alt text.
- Never save, cache or log document links.

### A8.7 Favicon and page titles

- Favicon: original mark in brand colour, saved as app/icon.svg, generated to app/favicon.ico.
- Page title in browser tab: { default: "Trip Wheels Super Admin", template: "%s | Trip Wheels Super Admin" }.

| Page | Title |
|---|---|
| Today | Today |
| Login, Forgot and reset password | Sign in, Reset your password |
| Tasks | Tasks |
| Verifications list, review | Verification queue, Verification review |
| Vehicles list, review | Vehicle review queue, Vehicle review |
| Destinations | Destinations |
| Bookings list, detail | Bookings, Booking details |
| Issues list, detail | Issues, Issue details |
| Users list, detail | Users, User details |
| Watchlists | Watchlists |
| Exports | Exports |
| Analytics | Analytics |
| Settings | Settings |
| Audit log | Audit log |
| Notifications | Notifications |
| Profile | Your profile |
| Not found | Page not found |

### A8.8 Copy

- Plain Indian English, short sentences, concrete facts.
- State consequences plainly.
- No hype words ("seamless", "effortless", "unlock", "elevate", "revolutionize"). No exclamation marks.

### A8.9 Search engines and caching

- Private console: robots: { index: false, follow: false } in root metadata and app/robots.ts disallowing everything. No sitemap.
- Response headers on every route: X-Robots-Tag: noindex, nofollow, Cache-Control: no-store, X-Frame-Options: DENY, Referrer-Policy: no-referrer, X-Content-Type-Options: nosniff.

## A9. Code style: write it like a human developer

- Plain, readable TypeScript and React. Simple function components, if / else, clear early returns.
- No clever one-liners, no deeply nested ternaries, no generic factory helpers, no unused hooks or context providers.
- Small components (under 150 lines). Split when there are two clear jobs.
- Names in plain camelCase (VerificationRow, getStatusLabel, canApprove).
- Strict types with simple interface. No any.
- No unused imports, variables or dead code.
- No emoji and no em dashes anywhere (none in code, comments, UI text, alt text, notifications, test names, README, docs, commit messages).
- No secrets in code.
- Comments: few, short, plain, explaining why, not what. No banner comments.

## A10. Out of scope (do not build)

Payment, refund, payout, commission or revenue screens; customer-facing pages; owner screens; creating or managing admin accounts and roles; in-app chat; wa.me or WhatsApp links; manifest, service worker or push notifications; native mobile apps; charts and graph libraries; dark mode; multi-language support; social login; testimonial or statistics sections; analytics or tracking scripts; non-real photos.

## A11. Working protocol for the assistant

The assistant never commits. Do not run git add, git commit, git tag, git push, git merge, git rebase, git reset, git stash or any other command that changes the staging area, the history or the remote. Leave all changes uncommitted in the working tree. The developer reviews the changes and commits by hand.

For every plan:
1. Inspect current code and list what exists. Read backend code.
2. Implement plan fully with loading, empty and error states.
3. Run app, fix type and lint errors, check screens at 360, 768, 1280 and 1440 px.
4. Review against A6, A8, A9. Run check:style and check:env.
5. Report changes, packages, env variable names, routes, backend gaps, suggested commit message and tag.
6. Stop and wait for the next plan.

## A12. Git and commit messages

Format: type: Super Admin Plan <number> - short plain message, followed by a short body.
Types: docs for Part A, chore for setup/polish, feat for features, fix, test, refactor.
Lowercase, present tense, no full stop, no emoji, no em dash.
One commit per finished plan, with tag super-admin-plan-<number>-done. Part A uses super-admin-part-a-done.

Suggested commit for Part A:
```
docs: Super Admin Part A - add global context, design direction and conventions

Add scope, env rules, tech stack, folder structure, api contract, design rules, code style rules and commit rules used by all super admin plans.
```
Tag: super-admin-part-a-done
