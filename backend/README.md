# Trip Wheels - Backend API

Production-ready backend API service for **Trip Wheels**, a self-drive vehicle rental connector platform connecting travelers with verified local fleet publishers.

---

## 1. Core Architectural Philosophies

- **Pure Connector Model**: The platform facilitates vehicle discovery, real-time availability matching, booking requests, trust verification, and audit logging.
- **Zero Payment Handling**: No payment gateway is integrated. No financial transactions, card details, UPI transfers, security deposits, or rental fees pass through the platform. Rental charges and security deposits are settled directly and offline between the customer and the publisher at vehicle handover.
- **Staged Reveal**: Contact details and exact vehicle location are revealed progressively based on the booking state machine to preserve privacy and prevent disintermediation prior to confirmed bookings.
- **Human-Written Code Standard**: Plain modern JavaScript (ES modules), strict schema validations (Zod), clear architectural boundaries, and zero emoji in application code and logs.

---

## 2. Prerequisites

- **Node.js**: `v20.x` LTS or later
- **npm**: `v10.x` or later
- **MongoDB**: `v7.0` or later (standalone or Atlas cluster)
- **Cloudinary Account**: For vehicle image hosting and encrypted publisher KYC documents

---

## 3. Quick Start & Setup

### 3.1 Install Dependencies
```bash
cd backend
npm install
```

### 3.2 Environment Variables
Copy `.env.example` to `.env` in the `backend` directory:
```bash
cp .env.example .env
```

Configure your environment variables:
```ini
# Application
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/trip_wheels
DB_NAME=trip_wheels

# Authentication Secrets (minimum 32 characters)
ACCESS_TOKEN_SECRET=replace_with_a_secure_random_string_at_least_32_chars
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=replace_with_another_secure_random_string_at_least_32_chars
REFRESH_TOKEN_EXPIRY=7d

# Media Uploads (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Push Notifications (Web Push VAPID)
VAPID_PUBLIC_KEY=your_generated_vapid_public_key
VAPID_PRIVATE_KEY=your_generated_vapid_private_key
VAPID_SUBJECT=mailto:support@tripwheels.local

# Background Jobs
JOBS_ENABLED=true
```

To generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

### 3.3 Database Seeding & Index Synchronization
```bash
# Sync compound and unique indexes
npm run sync:indexes

# Seed default administrator account
npm run seed:admin

# Seed standard top tourist destinations
npm run seed:destinations

# Seed demo dataset (publishers, vehicles, sample bookings)
npm run seed:demo
```

### 3.4 Start Development Server
```bash
npm run dev
```
The server will start at `http://localhost:8000`.

### 3.5 Google Login Setup

Google login allows customers and fleet partners (agents and individuals) to sign up and sign in using "Continue with Google" alongside email and password. Super admin accounts remain password-only.

#### Routes
- `GET /api/v1/auth/google`: Starts the authorization code flow with PKCE, state token, and nonce. Accepts `app` (`customer` or `agent`), `mode` (`login` or `register`), `type` (`agent` or `individual`), and optional `next` relative path.
- `GET /api/v1/auth/google/callback`: Receives the authorization code from Google, verifies state and nonce, verifies ID token signature, links by verified email or creates an account, and sets host-only session cookies.
- `POST /api/v1/auth/complete-profile`: Saves the 10-digit Indian mobile number (with country code 91) and optional full name for Google accounts.
- `GET /api/v1/users/me`: Returns the current user profile including `profileComplete`, `authProviders`, and `hasPassword`.

#### Environment Variables
Configure the following variable names in your backend `.env` file (names only, never commit secret values):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI_CUSTOMER`
- `GOOGLE_REDIRECT_URI_AGENT`
- `GOOGLE_STATE_SECRET`

When any of these variables is missing, Google login is gracefully turned off, and the auth routes redirect with `google_unavailable` while the server starts normally.

#### Google Cloud Setup Steps
1. Create a Google Cloud project in the Google Cloud Console.
2. In Google Auth Platform, configure the OAuth consent screen with Audience set to External, app name "Trip Wheels", and user support email. While in Testing mode, register test user Gmail addresses under Audience.
3. Add scopes: `openid`, `email`, and `profile`.
4. Create an OAuth client ID of type "Web application".
5. Add Authorized redirect URIs matching your registered callback paths:
   - Customer callback: `http://localhost:3000/api/v1/auth/google/callback`
   - Partner callback: `http://127.0.0.1:3001/api/v1/auth/google/callback`

#### Local Development Hostnames
Session cookies are host-only without a shared domain attribute. Run the customer website on `http://localhost:3000` and the partner dashboard on `http://127.0.0.1:3001` (or another distinct hostname). Using different hostnames prevents cookie collision and keeps partner and customer sessions completely isolated.

#### One-Time Database Index Migration
Run the index migration script once to replace the sparse phone index with a partial unique index:
```bash
node scripts/migratePhoneIndex.js
```
This allows multiple new Google users with empty phone numbers prior to completing their profile.


---

## 4. API Documentation

Interactive API documentation and schema references are available directly from the running service:
- **Interactive Swagger UI**: [`http://localhost:8000/api/v1/docs`](http://localhost:8000/api/v1/docs)
- **OpenAPI 3.0 Specification (JSON)**: [`http://localhost:8000/api/v1/docs.json`](http://localhost:8000/api/v1/docs.json)
- **Postman Collection**: Import [`docs/postman_collection.json`](docs/postman_collection.json) into Postman.

---

## 5. Directory Structure

```
backend/
├── docs/
│   ├── openapi.json             # OpenAPI 3.0 specification
│   ├── postman_collection.json  # Postman 2.1 collection
│   ├── architecture.md          # Architectural guide & state machines
│   └── future-extensions.md     # Extension blueprints (WhatsApp, OTP, Chat)
├── public/
│   └── temp/                    # Temporary staging for file uploads
├── scripts/
│   ├── seedAdmin.js             # Initial superadmin seeder
│   ├── seedDestinations.js      # Tourist destination seeder
│   ├── seedDemo.js              # Full demo dataset seeder
│   └── syncIndexes.js           # Database index synchronization
├── src/
│   ├── config/                  # Environment validation & constants
│   ├── controllers/             # HTTP boundary request handlers
│   ├── db/                      # MongoDB connection management
│   ├── jobs/                    # Periodic cron schedules (runner.js)
│   ├── middlewares/             # Auth, role, validation, request ID, error handlers
│   ├── models/                  # Mongoose data schemas & indexes
│   ├── routes/                  # Express sub-routers
│   ├── services/                # Core domain business logic & state transitions
│   ├── utils/                   # Helpers (ownership, tokens, phone, errors, responses)
│   ├── validators/              # Zod input validation schemas
│   ├── app.js                   # Express application setup
│   └── index.js                 # HTTP server entrypoint
├── tests/                       # Automated unit & integration tests
├── Dockerfile                   # Production container build
├── docker-compose.yml           # Docker Compose stack (API + MongoDB)
├── ecosystem.config.cjs         # PM2 production cluster configuration
├── package.json
└── README.md
```

---

## 6. NPM Scripts Reference

| Script | Purpose |
| :--- | :--- |
| `npm run dev` | Start development server with automatic file watching (`nodemon`) |
| `npm start` | Start production server with Node.js |
| `npm test` | Run complete automated integration and unit test suite |
| `npm run test:ci` | Run test suite in headless continuous integration mode |
| `npm run sync:indexes` | Synchronize all registered Mongoose schema indexes with MongoDB |
| `npm run seed:admin` | Seed initial platform administrator account |
| `npm run seed:destinations`| Seed curated Indian self-drive destinations |
| `npm run seed:demo` | Seed mock users, publishers, and vehicles for testing |

---

## 7. Background Tasks & Cron Schedules

Background workers are controlled via the `JOBS_ENABLED` environment variable:
- When set to `true`, `src/jobs/runner.js` initializes automated maintenance schedules:
  - **Booking Expiry**: Runs every 15 minutes to expire pending bookings unconfirmed after 24 hours.
  - **Daily Trip Reminders**: Runs daily at 08:00 AM to dispatch pickup reminders for bookings starting in the next 24 hours.
  - **Reliability Scoring**: Runs nightly at 02:00 AM to recalculate publisher reliability scores based on response rates, cancellations, and reviews.
  - **Session Cleanup**: Runs weekly to purge expired tokens and audit artifacts.

---

## 8. Production Deployment Checklist

1. **Reverse Proxy & TLS**: Place the Node.js service behind Nginx or an AWS ALB with SSL termination.
2. **Trust Proxy**: Configured (`trust proxy = 1`) in `src/app.js` to correctly resolve client IP addresses through load balancers for rate limiting.
3. **Cookie Security**: Ensure `NODE_ENV=production` so auth cookies are stamped with `secure: true`, `sameSite: "strict"`, and `httpOnly: true`.
4. **VAPID Keys**: Ensure real production VAPID key pairs are generated and configured.
5. **Database Replica Set**: Use a production MongoDB replica set with change stream support and automated backups.
6. **Containerized Deployment**:
   ```bash
   docker compose up -d --build
   ```
7. **PM2 Process Manager**:
   ```bash
   npx pm2 start ecosystem.config.cjs
   ```

