# Trip Wheels Frontend

Trip Wheels is a self-drive vehicle rental marketplace for Northeast India (Assam, Meghalaya, Arunachal Pradesh). This repository contains the Next.js 16 App Router customer-facing web application and Progressive Web App (PWA).

## Core Principles

- Brand Palette: Single primary brand tone (`#1F5C4D`, `--brand`), warm paper surfaces (`#F7F2E8`, `--paper`), card backgrounds (`#FFFFFF`, `--surface`), and muted borders (`#E2DACB`, `--line`).
- Typography: Fraunces serif for expressive editorial headings and Public Sans for crisp legibility.
- Visual Language: Solid, tactile borders and flat paper surfaces. Clean opaque panels without translucent overlays or stock photography, and no emojis anywhere in the user interface.
- Payment Model: Offline only. All rental and deposit payments are settled directly between travelers and vehicle owners at vehicle pickup via cash or UPI.

## Prerequisites

- Node.js 20 or higher
- npm 10 or higher
- Running Trip Wheels Backend (optional for local mock preview, required for live data)

## Getting Started

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Configure environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   BACKEND_URL=http://localhost:4000
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev`: Starts the Next.js development server with Turbopack.
- `npm run build`: Compiles and bundles the production application.
- `npm run start`: Launches the compiled production application.
- `npm run lint`: Runs ESLint with Next.js rules.
- `npm run typecheck`: Runs `tsc --noEmit` to verify TypeScript types across all files.
- `npm test`: Runs the Vitest test suite across unit and component specs.
- `npm run check:style`: Validates the codebase against strict design guidelines (typography, punctuation standards, and visual tokens).
- `npm run generate:icons`: Generates PWA manifest icons, Apple touch icons, and favicons from the master brand SVG.

## Folder Structure

```
frontend/
├── app/                      # Next.js App Router structure
│   ├── (auth)/               # Auth routes (login, register, verify-otp, forgot-password)
│   ├── (customer)/           # Authenticated customer views (bookings, issues, profile)
│   ├── (dev)/                # Development-only tools (styleguide with production guard)
│   ├── (public)/             # Public pages (home, destinations, search, vehicles, terms)
│   ├── api/                  # API proxy routes and push subscriptions
│   ├── manifest.ts           # Dynamic Web App Manifest
│   ├── robots.ts             # Robots.txt crawler directives
│   └── sitemap.ts            # Dynamic XML sitemap generator
├── components/               # Domain-driven React components
│   ├── auth/                 # Authentication forms and OTP fields
│   ├── booking/              # Booking timeline, checklists, and summary cards
│   ├── destinations/         # Destination galleries and highlights
│   ├── layout/               # Header, mobile navigation drawer, and footer
│   ├── reviews/              # Star rating inputs and review submission cards
│   ├── search/               # Search bar, date range pickers, and filter drawer
│   ├── ui/                   # Reusable atomic primitives (buttons, inputs, modals)
│   └── vehicle/              # Detail tabs, specs, owner information, and pricing
├── lib/                      # Core logic and shared utilities
│   ├── api/                  # Typed API clients and endpoints
│   ├── constants.ts          # Central constants and business rules
│   ├── format.ts             # Currency, date, and string formatting helpers
│   ├── push.ts               # Web Push subscription management
│   └── query-keys.ts         # TanStack Query cache keys
├── public/                   # Static public assets
│   ├── icons/                # Generated PWA PNG icons
│   ├── images/               # Curated destination and fleet photography
│   └── sw.js                 # Custom service worker for offline caching and push
├── scripts/                  # Automated verification and asset scripts
├── tests/                    # Vitest test specifications
└── types/                    # Shared TypeScript interfaces and domain schemas
```

## How the API Proxy Works

Browser security prevents cross-origin requests and strict cookie forwarding when connecting to an independent backend host during local development.

To solve this cleanly:
- Client code calls relative paths such as `/api/v1/vehicles` or `/api/v1/auth/login`.
- Next.js rewrites defined in `next.config.ts` route these requests to `${BACKEND_URL}/api/v1/*`.
- Cookies, authorization headers, and session tokens are preserved without browser CORS interference.

## How to Generate PWA Icons

The project includes an automated script using `sharp` and `png-to-ico` to generate responsive icons from a single vector source:

```bash
npm run generate:icons
```

This outputs:
- `public/icons/icon-192x192.png`
- `public/icons/icon-512x512.png`
- `public/icons/icon-maskable-512x512.png`
- `public/apple-touch-icon.png`
- `public/favicon.ico`

## How to Test Web Push Locally

1. Generate a VAPID key pair on the backend or with the `web-push` CLI:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. Add the public key to your `.env.local`:
   ```env
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_vapid_key_here
   ```

3. In the browser, navigate to your Profile page (`/profile`) and toggle on Notifications.
4. When prompted by the browser, click "Allow".
5. The frontend subscribes to the browser PushManager, converts the subscription payload, and posts it to `/api/v1/notifications/push-subscriptions`.
6. Use the backend test script or curl to send a push payload with title, body, and action URL. The service worker in `public/sw.js` will catch the push event and show a native notification.

## Production Build and Quality Verification

Run the full validation suite locally before deploying:

```bash
npm run check:style
npm run lint
npm run typecheck
npm test
npm run build
```
