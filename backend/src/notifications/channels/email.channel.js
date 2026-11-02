import { env } from "../../config/env.js";
import { sendEmail } from "../../services/email.service.js";

export const sendNotificationEmail = async ({
  toEmail,
  title,
  body,
  deepLink,
}) => {
  if (!toEmail) {
    return { success: false, error: "Recipient email is missing" };
  }

  const actionUrl = deepLink
    ? `${env.APP_BASE_URL}${deepLink}`
    : env.APP_BASE_URL;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #222; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="margin-top: 0; color: #111;">Trip Wheels</h2>
      <h3 style="color: #333; margin-bottom: 12px;">${title}</h3>
      <p style="font-size: 15px; line-height: 1.5; color: #444;">${body}</p>
      <div style="margin: 28px 0;">
        <a href="${actionUrl}" style="background-color: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; display: inline-block;">
          View Details
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #888; margin-bottom: 0;">
        You received this notification according to your Trip Wheels account preferences.
      </p>
    </div>
  `;

  const text = `${title}\n\n${body}\n\nView details at: ${actionUrl}`;

  const result = await sendEmail({
    to: toEmail,
    subject: `Trip Wheels — ${title}`,
    text,
    html,
  });

  return {
    success: result.sent || result.simulated,
    sentAt: new Date(),
    error: result.error,
  };
};

