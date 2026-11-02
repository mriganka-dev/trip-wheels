# Trip Wheels - Future Platform Extensions

This document outlines architecture and extension blueprints for future platform enhancements beyond the current core build.

---

## 1. Official WhatsApp Cloud API Integration

### Current Status
Trip Wheels currently provides a formal notification channel abstraction in `src/services/notification.service.js`. Active notifications operate over in-app push and email. Direct automated WhatsApp messaging (or third-party scraping libraries such as `whatsapp-web.js` or ad-hoc `wa.me` links) is intentionally disallowed.

### Target Architecture (Meta WhatsApp Cloud API)
To implement verified WhatsApp notifications:
1. **Meta Developer App**:
   - Register a Meta Business Account and link a verified phone number for the WhatsApp Business Platform.
   - Configure a Webhook callback endpoint at `POST /api/v1/webhooks/whatsapp` with verify-token validation.
2. **Template Pre-approval**:
   - WhatsApp Cloud API requires pre-approved HSM (Highly Structured Message) templates for business-initiated conversations:
     - `booking_request_publisher_alert` (parameters: Publisher Name, Vehicle Name, Dates).
     - `booking_confirmation_customer` (parameters: Customer Name, Pickup Address, Publisher Phone).
     - `trip_completion_review_invite` (parameters: Customer Name, Review Link).
3. **Service Layer Plug-in**:
   - Create `src/services/whatsapp.service.js` implementing:
     ```javascript
     export const sendWhatsAppTemplate = async (recipientPhone, templateName, components) => {
       const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
       return axios.post(url, {
         messaging_product: "whatsapp",
         to: recipientPhone,
         type: "template",
         template: {
           name: templateName,
           language: { code: "en" },
           components
         }
       }, {
         headers: {
           Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`
         }
       });
     };
     ```
   - Wire `sendWhatsAppTemplate` directly into `notification.service.js` under the corresponding event handlers.

---

## 2. Phone OTP & SMS Gateway Extension

### Current Status
Authentication uses email and password with JWT refresh token rotation. Publisher and customer phone numbers are collected and formatted with international dial codes (E.164 standard), but verification is currently soft.

### Extension Points
1. **SMS Provider Integration**:
   - Integrate an SMS gateway provider (such as Twilio, Fast2SMS, or MSG91 for Indian regional numbers).
   - Create `src/services/sms.service.js` to dispatch 6-digit numeric OTPs.
2. **Data Model Updates**:
   - In `User` and `Publisher` schemas, add:
     - `phoneVerified: { type: Boolean, default: false }`
     - `phoneOtpHash: { type: String, select: false }`
     - `phoneOtpExpiresAt: { type: Date }`
3. **API Endpoints**:
   - `POST /api/v1/auth/phone/send-otp` (Rate limited to 3 per hour per IP/Phone).
   - `POST /api/v1/auth/phone/verify-otp`.
4. **Login via Phone**:
   - Extend `POST /api/v1/auth/login` to support passwordless phone + OTP authentication.

---

## 3. Real-Time In-App Chat

### Design Considerations
If direct in-app messaging between customers and publishers is introduced, the platform must preserve the connector model and prevent off-platform disintermediation before booking confirmation.

1. **Gatekeeping**:
   - Chat threads must only be initiated when a booking is in `accepted` or `in_progress` status.
   - Once a booking is marked `completed` or `cancelled`, the chat thread should automatically archive or enter read-only mode after 72 hours.
2. **Technology Stack**:
   - WebSocket / Socket.io server layer using Redis Pub/Sub adapter to support horizontal scaling across multiple container instances.
   - Message storage model:
     - `Thread` schema (`bookingId`, `customerId`, `publisherId`, `lastMessageAt`, `unreadCount`).
     - `ChatMessage` schema (`threadId`, `senderId`, `senderRole`, `messageText`, `attachments`, `deliveredAt`, `readAt`).
3. **Safety & Moderation**:
   - Automatic regex filters for prohibited keywords or abusive content.
   - Issue escalation directly from chat window with one click (`POST /api/v1/issues`).

