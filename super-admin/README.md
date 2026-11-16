# Trip Wheels Super Admin

Trip Wheels Super Admin is the private operations console used by the Trip Wheels team to run the vehicle rental marketplace. It provides oversight for publisher verifications, vehicle moderation, booking workflows, customer disputes, platform watchlists, business settings, audit trails, and key metrics.

## Scope and Product Separation

The repository consists of distinct applications with strict separation of concerns:

1. **Customer Website (`frontend/`):** Public discovery, vehicle search, customer booking checkout, and traveler profiles.
2. **Agent Dashboard (`admin/`):** Operational dashboard for rental shop partners and individual vehicle owners to manage fleet, calendar, booking requests, and vehicle handover.
3. **Super Admin Console (`super-admin/`, this app):** Private operations console for the Trip Wheels operations and review team.

Key platform boundaries:
- **No payment processing:** The platform does not handle payments, payouts, refunds, commissions, or bank transfers. Rental charges and security deposits are settled directly between customer and owner at vehicle pickup.
- **Review before live:** Nothing goes live without admin review. Publishers must complete document verification and phone checks, and every vehicle must be individually approved before appearing in customer search.
- **Audit trail:** Every administrative decision, status change, and setting update is audited and logged immutably.
- **Document privacy:** Identity documents, driving licenses, and vehicle registration certificates are accessed exclusively through short-lived signed URLs and are never stored or cached in the browser.

## Setup Instructions

### Prerequisites
- Node.js 20 or higher
- npm 10 or higher
- A running Trip Wheels backend instance

### Installation
1. Change into the `super-admin` directory:
   ```bash
   cd super-admin
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Configure the local environment:
   Create a `.env` file in the `super-admin` root directory containing the required configuration. Environment variables are validated server-side by `lib/env.ts`. Environment keys, values, and host addresses are never committed to version control or listed in documentation.

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open your browser to the local server port to access the console.

## Available Scripts

The following npm scripts are configured for development, quality verification, and production:

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Compiles the application and generates optimized production bundles.
- `npm run start`: Starts the Next.js production server.
- `npm run lint`: Runs ESLint across all TypeScript and React files.
- `npm run typecheck`: Runs the TypeScript compiler to verify type correctness without emitting files.
- `npm run test`: Executes unit and integration test suites using Vitest and Testing Library.
- `npm run check:style`: Audits the codebase for design system compliance (zero em dashes, zero en dashes, zero emojis, solid flat backgrounds, no glassmorphism, no banned phrases).
- `npm run check:env`: Enforces strict environment isolation (prevents public client variables, detects hardcoded addresses, and flags secret prefixes).
- `npm run generate:favicon`: Generates custom favicon assets from the official SVG icon.

## Folder Structure

```
super-admin/
  app/
    (auth)/          Authentication routes (login, forgot-password, reset-password)
    (console)/       Main operations console routes
      page.tsx       Today overview and urgent work queues
      tasks/         Operational task queue
      verifications/ Owner verification queue and detailed review
      vehicles/      Vehicle moderation queue and vehicle detail
      destinations/  Pilot destination management and activation
      bookings/      Bookings oversight and timeline inspection
      issues/        Dispute moderation and resolution actions
      users/         User directory and account suspension
      watchlists/    High-risk fleet, license, and misclassification alerts
      exports/       CSV export generation for operations records
      analytics/     Platform and destination key figures and tables
      settings/      Business settings editor with diff confirmation
      audit-log/     Immutable read-only log of admin actions
      notifications/ Notification center and quick navigation
      profile/       Super admin profile details and password change
    (dev)/           Development-only routes (styleguide, inaccessible in production)
    layout.tsx       Root layout with typography, providers, and security metadata
    globals.css      Design tokens and CSS custom properties
    robots.ts        Search crawler disallow configuration
  components/
    ui/              Design system primitives (buttons, dialogs, tables, badges, etc.)
    layout/          App shell, header, sidebar, and navigation components
    common/          Shared cards, document viewers, and stat tables
  hooks/             Client hooks (useAuth, useIdleTimeout, usePageTitle)
  lib/               Core utilities
    api/             API clients for backend endpoints
    constants.ts     Status metadata, tones, labels, and system constants
    env.ts           Server-only environment validation and accessors
    format.ts        Locale-aware date, time, currency, and phone formatting
    query-keys.ts    TanStack Query cache key definitions
  tests/             Unit and integration test suites (Vitest, Testing Library)
  scripts/           Repository compliance scripts (check-style, check-env)
```

## How the API Proxy Works

The Super Admin console communicates with the backend through a Next.js server-side rewrite proxy defined in `next.config.ts`:

- All client requests are directed to `/api/v1/*` relative to the current origin.
- Next.js rewrites incoming requests to the internal backend address specified in `BACKEND_URL`.
- The backend URL is never exposed to the client browser, injected into client HTML, or bundled into JavaScript files.
- Authentication cookies (`accessToken` and `refreshToken`) are forwarded securely across the proxy with `credentials: "include"`.

## Security Architecture

1. **Role Gate:** Every console route is protected. Only users with the backend `admin` role can access console screens. Non-admin users and unauthenticated sessions are immediately redirected to `/login`.
2. **Idle Sign-Out:** An active timer automatically prompts after 29 minutes of inactivity and signs the operator out after 30 minutes, preventing unauthorized console access on unattended workstations.
3. **HTTP Security Headers:** Every page response includes strict security headers:
   - `X-Robots-Tag: noindex, nofollow`
   - `Cache-Control: no-store`
   - `X-Frame-Options: DENY`
   - `Content-Security-Policy: frame-ancestors 'none';`
   - `Referrer-Policy: no-referrer`
   - `X-Content-Type-Options: nosniff`
4. **Disallow-All Robots:** `app/robots.ts` disallows all web crawlers across the entire domain.
5. **Short-Lived Document Access:** Personal identity documents, driver licenses, and vehicle permits are retrieved using temporary signed URLs and are never stored or cached in localStorage, IndexedDB, or server logs.
6. **Confirmation and Audit Trails:** Every destructive, approving, or status-altering action requires confirmation, prompts for an admin reason, and logs the acting admin, timestamp, IP address, user agent, and before-and-after state to the immutable audit log.
