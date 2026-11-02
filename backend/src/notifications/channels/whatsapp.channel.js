import { env } from "../../config/env.js";

// WhatsApp Channel Stub
// Note: Official WhatsApp Cloud API integration will be implemented here later.
// It will map events to approved Meta business message templates and call the
// Graph API endpoints with the recipient's normalized phone number.
// Unofficial tools (e.g. whatsapp-web.js) and wa.me links are strictly avoided.

export const sendWhatsApp = async ({ phone, title, body, event, data }) => {
  if (!env.WHATSAPP_ENABLED) {
    return {
      success: true,
      skipped: true,
      reason: "WhatsApp channel is disabled in configuration",
    };
  }

  // Placeholder execution for when WHATSAPP_ENABLED becomes true
  console.log(
    `[WHATSAPP DISPATCH STUB] Phone: ${phone} | Event: ${event} | Body: ${body}`
  );

  return {
    success: true,
    sentAt: new Date(),
  };
};
