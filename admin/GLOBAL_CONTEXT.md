# Trip Wheels Agent Dashboard: Part A - Global Context

## A1. What we are building

Trip Wheels is a marketplace where travelers request bikes and cars at travel destinations from agents and individual owners. This app is the dashboard for those owners. Everything on the customer side and the platform rules are already defined; this dashboard must follow them exactly.

Rules the interface must respect:
- No payment features at all. There are no earnings pages, payouts, commissions, invoices or payment screens. The owner collects the rent directly from the customer at pickup. Prices are informational, and the interface says so where it matters.
- Request-based booking. A customer sends a request. The owner must accept or reject it before the response deadline. The countdown must be obvious everywhere a request appears.
- Verification first. Nothing a customer can see goes live until the owner is verified and the vehicle is approved by an Admin. Verification needs documents, a verification call from the Admin team, and an Admin decision.
- Mandatory vehicle confirmation. About 24 hours before pickup the owner must confirm the exact vehicle (chassis number, registration number, notes). If a booked vehicle cannot be provided (rented elsewhere, damaged, in service), the owner must report it at least 24 hours before pickup. The interface explains the consequences clearly.
- Handover checks. At pickup the owner checks the customer government ID (name matches the booking) and a valid driving license for the vehicle type. The owner may decline handover when either is missing or invalid.
- Staged information. The customer phone number is only available after the owner accepts. The owner sees whatever the API sends and shows a clear "available after you accept" message when a field is missing.
- Two owner types:
  - Agent: a business with several vehicles and one fixed pickup location (a map pin chosen once in the profile).
  - Individual: a person with at most 2 vehicles, an approximate pickup area, and an exact pickup point agreed with each customer.
- Contact by phone. There is no in-app chat and no WhatsApp link or button. The customer phone number is shown with a call link and a copy button after acceptance.
- Mobile first. Many owners will run this on a phone at a shop counter or on the road. The dashboard is installable as an app (PWA) and receives push alerts for new requests.

## A2. Existing project structure and conventions

The repository is one project with several apps:
- backend/: Express and MongoDB API
- frontend/: customer website (Next.js)
- admin/: the Next.js app folder that contains this dashboard (note: named admin in directory structure, but it is strictly the agent dashboard; do not build admin features here)

Conventions:
- Keep TypeScript with the existing app/ router at the project root (no src/ folder), and keep the path alias from tsconfig.json.
- Remove default Next.js template content.
- Share foundation tokens, fonts, and helpers with the customer website where appropriate without cross-importing across app directories.
- Always verify backend routes, models, and serializers in backend/src before wiring API calls.

## A3. Tech stack

Next.js (App Router) with TypeScript in strict mode. Install only what a plan needs:
- Styling: Tailwind CSS, design tokens defined in app/globals.css
- Server state: @tanstack/react-query
- Forms: react-hook-form, zod, @hookform/resolvers
- Dates: date-fns and built-in Intl APIs (locale en-IN)
- Class names: clsx
- Icons: lucide-react (used sparingly, never for sparkles or AI symbols)
- Accessible primitives: Radix primitives only where accessibility is hard (dialog, tabs, popover). Everything else is hand-written
- Maps: leaflet and react-leaflet with OpenStreetMap tiles, loaded client-only
- Favicon generation: sharp and png-to-ico as dev dependencies
- Tests: vitest, @testing-library/react, @testing-library/jest-dom

No large UI kits, no charting libraries, no Redux, no animation libraries, and no CSS-in-JS libraries.

## A4. Folder structure

```
app/
  (auth)/        login, register, verify-email, forgot-password, reset-password
  (dashboard)/   page.tsx (home), verification, vehicles, bookings, schedule,
                 issues, reviews, reliability, notifications, profile, guide
  layout.tsx  globals.css  manifest.ts  not-found.tsx  error.tsx  offline/
components/
  ui/  layout/  vehicles/  bookings/  verification/  maps/  notifications/  common/
lib/
  api/          client, server helper, one file per resource
  env.ts  format.ts  constants.ts  query-keys.ts  push.ts  pwa.ts
hooks/  types/  tests/  scripts/
public/         sw.js, icons
```

## A5. Conventions

API access:
- Browser requests proxy via Next.js rewrite: /api/v1/:path* to BACKEND_URL/api/v1/:path*. Keeps httpOnly cookies intact without CORS issues.
- All dashboard data is fetched client-side with React Query behind auth.
- One fetch wrapper in lib/api/client.ts with credentials: "include". Handles 401 with a single shared refresh token call to /auth/refresh-token.
- One file per resource in lib/api/, typed models in types/, query keys in lib/query-keys.ts. No any.

Backend response shapes:
- Success: { statusCode, data, message, success: true }
- Error: { statusCode, message, errors: [], success: false }
- Lists: data contains { items, page, limit, totalItems, totalPages }

Data states:
- Every data-driven screen must provide loading skeletons, clear empty states, and helpful error states with retry buttons.

Formatting (lib/format.ts):
- Currency: INR with Indian digit grouping (e.g. ₹1,299).
- Dates and times: en-IN, local time zone (e.g. 20 Nov 2026, 9:00 am). API sends UTC; date inputs convert to ISO UTC before sending.
- Phone numbers: stored with country code, displayed as +91 98765 43210 with tel: links.
- Countdowns: "2 h 15 min left", switching to minutes under 1 hour, and "Time is up" after deadline.

Forms and uploads:
- react-hook-form with zod schemas.
- Photos: jpg, png, webp up to 5 MB each.
- Documents: jpg, png, webp, pdf up to 8 MB each.
- Clear error handling, previews, and direct photo capture on mobile.

Accessibility and responsiveness:
- Semantic HTML, visible focus ring, labels on every control, WCAG AA contrast.
- Minimum 44 px touch targets.
- Mobile first starting at 360 px, tested at 360 px, 768 px, and 1280 px.
- State in URL query strings for filters, tabs, and pagination.

## A6. Environment variables

Required variables defined in .env.example:
- BACKEND_URL: backend base URL used by rewrite (e.g. http://localhost:5000)
- NEXT_PUBLIC_APP_URL: public URL of this dashboard (e.g. http://localhost:3001)
- NEXT_PUBLIC_CUSTOMER_SITE_URL: public URL of customer site (e.g. http://localhost:3000)
- NEXT_PUBLIC_SUPPORT_EMAIL: support email shown in help and suspension notices

Validated through lib/env.ts which throws a clear error if any required variable is missing.

## A7. Backend contract verified

Backend routes in backend/src:
- Auth: POST /auth/register, /auth/verify-email, /auth/resend-otp, /auth/login, /auth/refresh-token, /auth/logout, /auth/forgot-password, /auth/reset-password, /auth/change-password
- User: GET and PATCH /users/me, PATCH /users/me/avatar, PATCH /users/me/notification-preferences
- Publisher profile: PUT /publishers/profile, GET /publishers/profile/me, POST /publishers/documents, GET /publishers/documents/me, DELETE /publishers/documents/:id, POST /publishers/selfie (individuals), POST /publishers/submit-verification
- Destinations: GET /destinations
- Vehicles: POST /vehicles, PATCH /vehicles/:id, POST /vehicles/:id/images, DELETE /vehicles/:id/images/:imageId, POST /vehicles/:id/documents, POST /vehicles/:id/submit, PATCH /vehicles/:id/pause, PATCH /vehicles/:id/resume, DELETE /vehicles/:id, GET /vehicles/mine, POST and GET /vehicles/:id/unavailability, DELETE /vehicles/:id/unavailability/:blockId
- Bookings: GET /bookings/received, GET /bookings/:id, PATCH /bookings/:id/accept, /reject, /cancel, /pickup-point, /confirm-vehicle, /report-vehicle-unavailable, /confirm-pickup-ready, /handover, /decline-handover, /mark-no-show, /complete, PATCH /bookings/:id/modification-requests/:reqId
- Trust: POST /bookings/:id/reviews, GET /publishers/:id/reviews, POST /bookings/:id/issues (multipart with "evidence"), GET /issues/mine, GET /issues/:id, POST /issues/:id/respond
- Notifications: GET /notifications, PATCH /notifications/:id/read, PATCH /notifications/read-all, GET /notifications/vapid-public-key, POST and DELETE /notifications/push-subscriptions, POST /notifications/test, POST /notifications/test/confirm

Status labels and tones:
- Booking: requested (New request, warning), confirmed (Confirmed, brand), rejected (You rejected it, neutral), expired (Expired, no reply, negative), cancelled_by_customer (Cancelled by the customer, neutral), cancelled_by_publisher (You cancelled, negative), vehicle_unavailable (Vehicle reported unavailable, negative), handover_declined (Handover declined, neutral), no_show (Customer did not show, neutral), ongoing (On trip, brand), completed (Completed, neutral).
- Vehicle: draft (Draft), pending_review (In review), active (Live), paused (Paused), suspended (Suspended), rejected (Not approved).
- Verification: not_submitted (Not submitted), pending (In review), approved (Approved), rejected (Not approved), reverification_required (New documents needed), suspended (Suspended).

Backend verification details:
- Vehicle private fields: chassisNumber and registrationNumber have select: false in the schema. In getMyVehicles, they are not selected by default. When uploading documents or submitting a vehicle, the backend selects +chassisNumber +registrationNumber.
- Customer phone number staging: serialized on backend to redact customer phone from publisher until booking reaches confirmed, ongoing, completed, handover_declined, or no_show.
- Reliability data: score (0 to 100), requestsReceived, accepted, rejected, expired, completed, cancelledAfterConfirm, noShows, issuesUpheld, lateDisclosures, undisclosedUnavailability, missedConfirmations, avgResponseMinutes.

## A8. Design direction and hard rules

The dashboard feels like a ledger book or booking register: a clean, working tool made for rental businesses.

Hard rules:
1. No gradients of any colour. Backgrounds, buttons, headers, text, and overlays are flat.
2. No glowing blobs, halos, or large blur decorations.
3. No glass cards or backdrop-blur. Panels are solid with thin borders.
4. One brand colour: deep green (#1F5C4D) plus tints. No second accent colour.
5. Display font with character for headings (e.g. Fraunces), plain body companion (e.g. Public Sans). Inter, Roboto, Arial, Helvetica, and system fonts are not allowed as visible fonts.
6. No row of three equal cards. No statistic card rows on home. Content is plain text, lists, and tables.
7. No bento grids.
8. No sparkle, star bursts, or AI symbols. Stars are used only for real review ratings.
9. No emoji anywhere in UI, code, comments, or documentation.
10. No em dashes and no en dashes anywhere. Use full stop, comma, colon, or "to".
11. No hype or "It is not X, it is Y" marketing copy.
12. Real testimonials and reviews only.
13. No dot-grid, noise, or mesh backgrounds. Flat paper colour (#F7F2E8).
14. Animation only where it matters: dialog/toast transitions (150 to 200 ms) and quiet skeleton pulse.
15. Real vehicle photos only. No stock photos, illustrations, or placeholder photo services.
16. Original favicon mark in brand colour.
17. Real page titles in tab using template: "%s | Trip Wheels Partner".
18. No placeholder text, no lorem ipsum, no John Doe.

Design tokens:
- --paper: #F7F2E8 (page background)
- --surface: #FFFFFF (solid panels, tables, sidebar)
- --ink: #1F2A28 (main text)
- --ink-soft: #5B6663 (secondary text)
- --line: #E2DACB (borders and dividers)
- --brand: #1F5C4D (one brand colour: buttons, links, active nav)
- --brand-dark: #174A3E (hover/pressed brand state)
- --brand-tint: #E3EEE9 (active nav item, selected rows)
- --warning: #A8691A (status messages only)
- --negative: #B3362E (error and alert messages only)

Search engines:
- Private dashboard. robots: { index: false, follow: false } in root metadata and app/robots.ts disallowing all routes.

## A9. Code style: write it like a human developer

- Plain, readable TypeScript and React. Simple function components, early returns, clear if/else.
- No clever one-liners, no deeply nested ternaries, no over-engineering.
- Components kept small (under 150 lines where practical).
- Descriptive names in camelCase; PascalCase for components.
- Strict typing with interfaces, no any.
- Minimal comments explaining why, never narrating obvious code.
- No emoji and no em or en dashes anywhere in code, comments, commit messages, or docs.

## A10. Out of scope

Do not build:
- Payment, earnings, payout, commission, or invoice screens
- Customer-facing website screens or admin approval screens
- In-app chat, wa.me, or WhatsApp links
- Native mobile applications
- Charts, analytics widgets, or telemetry dashboards
- Dark mode
- Multi-language support
- Social authentication

## A11. Working protocol for the assistant

The assistant never commits. Do not run git add, git commit, git tag, git push, git merge, git rebase, git reset, git stash, or any command that alters git history or the staging area. All changes remain uncommitted in the working tree for the developer to review and commit.

For every plan:
1. Inspect existing code and backend endpoints.
2. Implement cleanly with loading, empty, and error states.
3. Verify at 360 px, 768 px, and 1280 px.
4. Run npm run check:style from Plan 1 onward.
5. Report files changed, new packages, backend notes, and the suggested commit message and tag.
6. Stop and await the next plan.

## A12. Git and commit conventions

Developer commits each finished plan with format:
`type: Agent Dashboard Plan <number> - short plain message`

Suggested commit message for Part A:
```
docs: Agent Dashboard Part A - add global context, design direction and conventions

Add scope, owner rules, tech stack, folder structure, api contract, design rules, code style rules and commit rules used by all agent dashboard plans.
```

Suggested tag: `agent-part-a-done`
