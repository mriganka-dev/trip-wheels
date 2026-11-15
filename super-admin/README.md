# Trip Wheels Super Admin

Trip Wheels Super Admin is the private operations console used by the platform team to oversee and operate the vehicle rental marketplace. It handles publisher verifications, vehicle moderation, booking oversight, customer issue resolution, platform watchlists, destination settings, and audit logs.

## Scope and Separation

Trip Wheels consists of distinct applications:
1. Customer Website (`frontend/`): Public discovery, vehicle search, customer booking checkout, and traveler profiles.
2. Agent Dashboard (`admin/`): Operational portal for rental shop partners and individual vehicle owners to manage fleet, calendar, requests, and handovers.
3. Super Admin Console (`super-admin/`, this app): Private console for the platform operations team.

This console does not handle customer booking checkout, payment processing, or commissions. Payments are settled directly between customer and vehicle owner at pickup.

## Environment Variables

Required environment variables are set in the `.env` file and validated at runtime in `lib/env.ts`. No environment values or secrets are stored in version control or exposed to the client browser.

## Tech Stack

- Next.js (App Router) with TypeScript in strict mode
- Tailwind CSS with custom design tokens
- TanStack React Query for client data fetching
- React Hook Form with Zod schemas
- Date-fns and Intl APIs (en-IN locale)
- Radix UI primitives for dialogs and popovers

## Available Scripts

- `npm run dev`: Starts the local development server.
- `npm run build`: Compiles and builds the production application.
- `npm run start`: Runs the built production application.
- `npm run lint`: Runs ESLint checks.
- `npm run check:style`: Audits the codebase for strict styling rules (no gradients, em dashes, or emoji).
- `npm run check:env`: Verifies environment hygiene and secret protections.
