# Trip Wheels Backend Architecture

This document describes the architectural principles, layering, state machines, access boundaries, and operational schedules governing the Trip Wheels backend.

---

## 1. Architectural Philosophy & Connector Model

Trip Wheels is a direct connector platform connecting travelers seeking self-drive vehicle rentals with independent local fleet publishers.
- **Pure Connector**: The platform facilitates discovery, availability matching, booking requests, trust verification, and audit logging.
- **Zero Payment Handling**: No payment gateway is integrated. No financial credentials, credit cards, UPI transactions, security deposits, or rental fares pass through the platform. Direct payment and security deposit exchange occur offline between customer and publisher at vehicle handover.
- **Staged Reveal**: Contact coordinates and pickup addresses are revealed progressively based on booking state transitions to protect customer and publisher privacy while deterring disintermediation before booking approval.

---

## 2. Layered Architecture

Every incoming HTTP request flows sequentially through five decoupled layers:

```
+-----------------------------------------------------------------------+
| 1. HTTP Router & Global Middlewares (CORS, Helmet, RateLimiter, ReqId)|
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
| 2. Input Validation (Joi schema validation on body, query, and params)|
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
| 3. Controller (HTTP boundary: extracts input, maps response format)   |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
| 4. Service Layer (Domain rules, state transitions, transactions, jobs)|
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
| 5. Mongoose Data Models & Database Indexes                            |
+-----------------------------------------------------------------------+
```

### Layer Responsibilities
- **Routes (`src/routes/`)**: Mount HTTP paths, assign rate limiters, authentication (`verifyJWT`), role verification (`authorizeRoles`), and validation middlewares.
- **Validation (`src/validators/`)**: Strict schemas using Joi. Rejects malformed requests with `400 Bad Request` before reaching controllers.
- **Controllers (`src/controllers/`)**: Parse HTTP headers, params, and body. Delegates all business calculations to services. Packages output in standard `ApiResponse(statusCode, data, message)`.
- **Services (`src/services/`)**: Implement business logic, ownership assertions (`src/utils/ownership.js`), atomic transactions, event emissions, notifications, and audit logging.
- **Models (`src/models/`)**: Mongoose schemas defining database constraints, validations, and compound indexes.

---

## 3. Booking State Machine

Bookings transition through a deterministic finite state machine:

```
                           +-------------+
                           |   PENDING   |
                           +------+------+
                                  |
             +--------------------+--------------------+
             |                    |                    |
             v                    v                    v
      +--------------+     +--------------+     +--------------+
      |  CANCELLED   |     |   DECLINED   |     |   ACCEPTED   |
      | (by customer)|     | (by pub/adm) |     +-------+------+
      +--------------+     +--------------+             |
                                                        |
                                           +------------+------------+
                                           |                         |
                                           v                         v
                                    +--------------+          +--------------+
                                    |  CANCELLED   |          |  IN_PROGRESS |
                                    | (by customer)|          |  (Trip start)|
                                    +--------------+          +------+-------+
                                                                     |
                                                                     v
                                                              +--------------+
                                                              |  COMPLETED   |
                                                              |  (Trip end)  |
                                                              +--------------+
```

### State Definitions:
- **`pending`**: Customer created booking request. Publisher notified. Auto-expires after 24 hours if unconfirmed.
- **`accepted`**: Publisher reviewed and confirmed vehicle availability. Contact details and exact pickup address unlocked via staged reveal.
- **`declined`**: Publisher cannot fulfill request. Reason recorded. Customer notified.
- **`in_progress`**: Handover verified; odometer and fuel reading recorded at departure.
- **`completed`**: Return verified; ending odometer recorded; review invitation triggered.
- **`cancelled`**: Customer cancelled prior to trip departure.

---

## 4. Staged-Reveal Privacy Matrix

Customer and publisher sensitive fields are conditionally sanitized depending on the requester role and booking status:

| Requester | Booking State | Customer Sees from Publisher | Publisher Sees from Customer |
| :--- | :--- | :--- | :--- |
| **Customer** | `pending` | Business name, city, average rating. (Phone & exact address masked). | Full name, trip dates, vehicle requested. (Phone & email masked). |
| **Customer** | `accepted`, `in_progress`, `completed` | Full business contact phone, email, full pickup address, emergency contact. | Customer phone, email, notes, trip purpose. |
| **Publisher** | `pending` | N/A | General purpose, requested dates, first name. (Direct phone/email masked). |
| **Publisher** | `accepted`, `in_progress`, `completed` | N/A | Unmasked phone, direct email, customer notes. |
| **Admin** | Any state | Unmasked full profile and KYC documents. | Unmasked full profile, email, phone, audit trails. |

---

## 5. Event Catalog & Notification Channels

The notification subsystem (`src/services/notification.service.js`) routes platform events across multiple channels:

| Event Name | Recipient | In-App Push | Email Channel | WhatsApp Channel (Stubbed) |
| :--- | :--- | :--- | :--- | :--- |
| `BOOKING_REQUESTED` | Publisher | Yes | Yes (Summary) | Ready for Cloud API |
| `BOOKING_ACCEPTED` | Customer | Yes | Yes (Pickup instructions) | Ready for Cloud API |
| `BOOKING_DECLINED` | Customer | Yes | Yes (Reason included) | Ready for Cloud API |
| `BOOKING_CANCELLED` | Publisher & Customer | Yes | Yes | Ready for Cloud API |
| `TRIP_STARTED` | Customer & Publisher | Yes | Yes (Start odometer log) | Ready for Cloud API |
| `TRIP_COMPLETED` | Customer & Publisher | Yes | Yes (Review prompt) | Ready for Cloud API |
| `ISSUE_REPORTED` | Admin & Publisher | Yes | Yes (Urgent alert) | Ready for Cloud API |
| `KYC_SUBMITTED` | Admin | Yes | Yes | - |
| `KYC_VERIFIED` | Publisher | Yes | Yes | Ready for Cloud API |

---

## 6. Scheduled Background Jobs

When `JOBS_ENABLED=true` (or when running worker process), `src/jobs/runner.js` executes periodic cron tasks:

| Job Name | Schedule | Purpose |
| :--- | :--- | :--- |
| **Expire Pending Bookings** | Every 15 minutes | Moves bookings stuck in `pending` for $>24$ hours to `cancelled`/`expired`. |
| **Upcoming Trip Reminders** | Daily at 08:00 AM | Sends reminder notifications to customers with trips starting in the next 24 hours. |
| **Reliability Score Recalculator**| Daily at 02:00 AM | Recalculates publisher acceptance rates, response times, and reviews score. |
| **Cleanup Expired Tokens** | Weekly on Sunday 03:00 AM | Purges expired refresh tokens and ephemeral records. |

