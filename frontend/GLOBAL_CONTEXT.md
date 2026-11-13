# Trip Wheels Frontend: Part A - Global Context

## A1. What we are building

Trip Wheels is a marketplace where travelers find and request bikes and cars at travel destinations. Vehicles are listed by agents (rental shops) and individual owners. A traveler can request a vehicle at a destination before leaving home, so they do not waste time searching on arrival.

This frontend is for the traveler (customer) only. Agent, individual owner, and admin screens are not part of this scope.

Key product rules:
- No online payment anywhere. The customer pays the agent or owner directly at pickup. Prices shown are informational.
- Request-based booking. The customer sends a request. The owner accepts or rejects it within a time window. The customer sees the waiting state and alternative vehicles while waiting.
- Staged information. The backend only sends the owner phone number, exact pickup point (for individual owners), and vehicle chassis/registration numbers when rules allow. The frontend displays whatever the API sends and shows a clear "will be shared later" message when a field is missing.
- Documents at pickup. The customer must carry a valid government ID and driving license. The owner can refuse handover without them.
- Mobile first. Responsive design starting at 360 px width. Installable as a PWA.

## A2. Conventions and Tech Stack

- Next.js (App Router) with TypeScript in strict mode.
- Styling: Tailwind CSS with design tokens defined in app/globals.css.
- State: @tanstack/react-query.
- Forms: react-hook-form, zod, @hookform/resolvers.
- Dates: date-fns and Intl (locale en-IN).
- Class utilities: clsx.
- Icons: lucide-react (used sparingly, no AI/sparkle icons).
- Accessible primitives: Radix UI dialog and tabs where needed. Plain hand-written components for the rest.
- Maps: leaflet and react-leaflet with OpenStreetMap tiles (client only, wrapped in a single Map component).
- Testing: vitest, @testing-library/react, @testing-library/jest-dom.

## A3. Design Direction and Hard Rules

- No gradients of any kind.
- No glowing blobs, blur shapes, halos, or decorative blur elements.
- No glass cards (no backdrop-blur). Panels are solid with thin borders.
- One brand colour (#1F5C4D) plus tints. No second accent colour.
- Display font with character for headings; readable body font (at least 16 px). Inter, Roboto, Arial, Helvetica, and system font stacks are not allowed as visible fonts.
- No row of three equal cards. No bento grids. Vehicle results are rows, not card grids.
- No sparkle or AI symbols.
- No emoji anywhere (in UI, code, comments, docs, or commit messages).
- No em dashes and no en dashes anywhere. Use a full stop, comma, colon, or "to".
- No "It is not X, it is Y" or hype copy. Plain Indian English, short sentences, concrete facts.
- Real testimonials only (from API reviews on vehicle detail pages). No fake reviews or quotes.
- No dot-grid, noise, or mesh backgrounds. Flat paper background (#F7F2E8).
- Real product photos only. If missing, show text or a plain tinted block with the name.

## A4. Design Tokens

| Token | Value | Use |
|---|---|---|
| --paper | #F7F2E8 | Page background |
| --surface | #FFFFFF | Solid panels |
| --ink | #1F2A28 | Main text |
| --ink-soft | #5B6663 | Secondary text |
| --line | #E2DACB | Borders and dividers |
| --brand | #1F5C4D | Primary buttons, links, selected states, wordmark |
| --brand-dark | #174A3E | Hover and pressed state of brand |
| --brand-tint | #E3EEE9 | Selected rows and highlights |
| --warning | #A8691A | Status messages only |
| --negative | #B3362E | Status messages only |

## A5. Backend Contract Verification and Endpoints

- All client requests proxy via Next.js rewrite: /api/v1/:path* to BACKEND_URL/api/v1/:path*.
- Success shape: { statusCode, data, message, success: true }.
- Error shape: { statusCode, message, errors: [], success: false }.
- Pagination shape: data has items, page, limit, totalItems, totalPages.
- Endpoints verified in backend/src:
  - Auth: POST /auth/register, /auth/verify-email, /auth/resend-otp, /auth/login, /auth/refresh-token, /auth/logout, /auth/forgot-password, /auth/reset-password, /auth/change-password.
  - User: GET/PATCH /users/me, PATCH /users/me/avatar (multipart), PATCH /users/me/notification-preferences, POST /users/anonymize.
  - Destinations: GET /destinations.
  - Vehicles: GET /vehicles/search, GET /vehicles/:id, GET /vehicles/:id/availability, GET /vehicles/:id/reviews.
  - Bookings: POST /bookings, GET /bookings/mine, GET /bookings/:id, PATCH /bookings/:id/cancel, GET /bookings/:id/backups, PATCH /bookings/:id/mark-picked-up, PATCH /bookings/:id/complete, POST /bookings/:id/modification-requests.
  - Trust: POST /bookings/:id/reviews, POST /bookings/:id/issues (multipart with "evidence"), GET /issues/mine, GET /issues/:id, POST /issues/:id/respond.
  - Notifications: GET /notifications, PATCH /notifications/:id/read, PATCH /notifications/read-all, GET /notifications/vapid-public-key, POST/DELETE /notifications/push-subscriptions.

## A6. Code Style Standards

- Plain, readable TypeScript and React. No clever one-liners or unnecessary abstractions.
- Small components (under 150 lines where practical).
- Strict Indian English formatting (INR currency with Indian grouping e.g. ₹1,299, en-IN dates).
- State in URL query strings for search filters, sort order, and page.
- No unused code, dead code, or commented-out blocks.
- No commit by the assistant without explicit instruction.

