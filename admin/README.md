# Trip Wheels Partner Dashboard

Trip Wheels Partner is the operational dashboard and Progressive Web App (PWA) for vehicle rental shop owners (agents) and individual hosts in Northeast India. It manages vehicle fleets, pricing, availability calendars, booking requests, handovers, reviews, and issues.

## Purpose and Architecture Differences

Trip Wheels consists of three distinct frontends:
1. Customer Website (`frontend/`): Public discovery, vehicle search, customer booking checkout, and traveler profiles.
2. Partner Dashboard (`admin/`, this app): Dedicated exclusively to vehicle publishers (agents and individual owners). No customer booking checkout, no payment gateways, and no admin moderation screens.
3. Internal Admin Panel: Back-office management for platform staff to review publisher documents, verify phone calls, inspect issues, and manage vehicle listings.

Partners collect all rental fees and deposits directly from travelers at vehicle handover via cash or UPI. Consequently, this dashboard contains no payment processing or earnings withdrawal mechanics.

## Core Design Principles

- Single Brand Tone: The interface uses `#1F5C4D` as the sole decorative and brand color, applied consistently across primary actions, selected navigation items, and positive states.
- Tactile Palette: Solid warm paper background (`#F7F2E8`, `--paper`), clean white cards (`#FFFFFF`, `--surface`), and muted borders (`#E2DACB`, `--line`).
- Typography: Fraunces serif for headings and wordmark, paired with Public Sans for legible form controls and tables.
- No Hype or Clutter: Strictly no color transitions, glow effects, translucent glass panels, statistics tiles, bento boxes, or emoji.
- Privacy and Offline Integrity: The entire app is disallowed in `robots.ts` with `noindex` directives. The service worker caches static application assets but never caches `/api/` endpoints to prevent stale booking data.

## Prerequisites

- Node.js 20 or higher
- npm 10 or higher
- Running Trip Wheels Backend (`http://localhost:5000` by default)

## Getting Started

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Configure environment variables in `.env`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev`: Starts the Next.js development server with Turbopack.
- `npm run build`: Compiles and bundles the production Next.js application.
- `npm run start`: Launches the compiled production application.
- `npm run lint`: Runs ESLint with Next.js rules.
- `npm run typecheck`: Runs `tsc --noEmit` to verify TypeScript types across the app.
- `npm test`: Runs the Vitest test suite for components, helpers, and business rules.
- `npm run check:style`: Audits the codebase against strict styling rules (no color blends, em dashes, or emoji).
- `npm run generate:favicon`: Generates `public/favicon.ico` from `app/icon.svg`.
- `node scripts/generate-icons.mjs`: Generates 192px, 512px, 512px maskable, and Apple touch icons in `public/icons/`.

## Folder Structure

```
admin/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Partner authentication (login, register, verify-email, reset-password)
│   ├── (dashboard)/              # Main partner workflows
│   │   ├── page.tsx              # Today (urgent actions, ongoing trips, today pickups)
│   │   ├── bookings/             # Booking requests, active trips, and booking details
│   │   ├── guide/                # Partner operational guide and policy explanations
│   │   ├── issues/               # Customer issues and partner replies
│   │   ├── notifications/        # In-app notifications list and opt-in prompt
│   │   ├── profile/              # Account settings, password change, and push notifications toggle
│   │   ├── reliability/          # Partner reliability score and performance history
│   │   ├── reviews/              # Customer reviews and owner ratings
│   │   ├── schedule/             # Vehicle availability calendar and blocked intervals
│   │   ├── vehicles/             # Fleet listings, new vehicle creation, edit, and vehicle detail
│   │   └── verification/         # Partner verification checklist, business profile, and documents
│   ├── (dev)/                    # Development-only pages (styleguide, blocked in production)
│   ├── manifest.ts               # Web App Manifest definition
│   ├── offline/                  # Offline fallback page
│   ├── robots.ts                 # Crawler disallow rules
│   └── layout.tsx                # Root layout with fonts, providers, and service worker registration
├── components/                   # React components organized by domain
│   ├── bookings/                 # Booking actions (accept, reject, cancel, handover, confirm vehicle)
│   ├── common/                   # Service worker registration and PWA install banners
│   ├── issues/                   # Issue response dialogs
│   ├── layout/                   # AppShell, Sidebar (desktop), TopBar, and BottomTabBar (mobile)
│   ├── maps/                     # Interactive Leaflet pin picker and coordinates fallback
│   ├── notifications/            # Notification bell and dropdown
│   ├── reviews/                  # Review reply dialogs
│   ├── ui/                       # Reusable primitives (Button, Input, Select, Dialog, Badge, Tabs)
│   └── vehicles/                 # Vehicle multi-step form, photo manager, document uploader
├── hooks/                        # Custom React hooks (useAuth)
├── lib/                          # Core utilities and business rules
│   ├── access-rules.ts           # Route protection and role verification
│   ├── constants.ts              # Business timings, status configurations, and labels
│   ├── env.ts                    # Validated environment configuration
│   ├── format.ts                 # Currency, dates, phone, duration, and countdown formatting
│   ├── push.ts                   # Web Push subscription, VAPID key fetch, and test triggers
│   ├── pwa.ts                    # Standalone detection and install prompt dismissal helpers
│   ├── query-keys.ts             # TanStack Query cache keys
│   └── api/                      # Typed backend API client and endpoints
├── public/                       # Static assets
│   ├── icons/                    # Responsive PWA icons
│   └── sw.js                     # Hand-written service worker for push and offline shell
├── scripts/                      # Style checking and icon generation scripts
├── tests/                        # Vitest unit and integration test specifications
└── types/                        # TypeScript type definitions for auth, bookings, vehicles, and reviews
```

## How the API Proxy Works

During development, the Next.js frontend proxy forwards calls matching `/api/v1/*` directly to the backend URL configured in `.env` (via rewrites in `next.config.ts`).

- Browser requests are made to relative endpoints: `/api/v1/vehicles`, `/api/v1/bookings`, `/api/v1/auth/login`.
- Next.js server proxies the request to `${NEXT_PUBLIC_API_URL}/api/v1/*`.
- Cookies and authorization headers are forwarded cleanly without cross-origin or CORS friction.
- Automatic token refresh: The `apiClient` transparently intercepts 401 Unauthorized responses, triggers a single refresh token request to `/api/v1/auth/refresh-token`, and retries the original request if refreshed.

## How to Generate PWA Icons

The partner PWA uses icons rendered from the vector mark in `app/icon.svg`:

```bash
node scripts/generate-icons.mjs
```

This generates:
- `public/icons/icon-192.png`: 192x192 square launcher icon
- `public/icons/icon-512.png`: 512x512 splash and high-DPI icon
- `public/icons/icon-512-maskable.png`: 512x512 maskable icon with safe zone padding
- `public/icons/apple-touch-icon.png`: 180x180 iOS home screen icon

If the brand mark changes, replace `app/icon.svg` and re-run the script.

## How to Test Push Notifications Locally

1. Start the backend service with VAPID keys configured in the backend environment.
2. Run `npm run dev` in this directory.
3. Open `http://localhost:3000` and sign in with an agent or individual partner account.
4. Navigate to Verification (`/verification`) or Profile (`/profile`).
5. Click "Turn on notifications". When your browser requests notification permissions, select "Allow".
6. In the Verification checklist under "App installed and notifications", click "Send a test notification".
7. A test push notification dispatched from the backend will arrive in your system notification tray.
8. Click "I received it" to confirm receipt. The checklist item will update to "Done".

## Testing and Quality Verification

Run the full validation suite locally:

```bash
npm run check:style
npm run typecheck
npm run lint
npm test
npm run build
```
