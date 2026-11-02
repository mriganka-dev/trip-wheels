import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter = null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return transporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.log(
      `[DEV EMAIL LOG] To: ${to} | Subject: ${subject}\nText: ${text || html}`
    );
    return { sent: false, simulated: true };
  }

  try {
    const info = await mailTransporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error.message);
    return { sent: false, error: error.message };
  }
};

export const sendOtpEmail = async (email, otp, purpose) => {
  const isVerify = purpose === "verify_email";
  const subject = isVerify
    ? "Trip Wheels — Verify Your Email Address"
    : "Trip Wheels — Reset Your Password";

  const messageText = isVerify
    ? `Your verification code is: ${otp}. It expires in 10 minutes. Do not share this code with anyone.`
    : `Your password reset code is: ${otp}. It expires in 10 minutes. If you did not request a password reset, you can ignore this email.`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #111;">Trip Wheels</h2>
      <p style="font-size: 16px; color: #333;">${
        isVerify
          ? "Thank you for registering. Please use the verification code below to confirm your email:"
          : "We received a request to reset your password. Use the code below to proceed:"
      }</p>
      <div style="background: #f4f4f4; padding: 15px; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 20px 0;">
        ${otp}
      </div>
      <p style="font-size: 14px; color: #666;">This code is valid for 10 minutes and can only be used once.</p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    text: messageText,
    html,
  });
};

