import mongoose from "mongoose";
import { BUSINESS_DEFAULTS } from "../constants.js";

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "default_settings",
      unique: true,
      index: true,
    },
    RESPONSE_WINDOW_HOURS: {
      type: Number,
      default: BUSINESS_DEFAULTS.RESPONSE_WINDOW_HOURS,
    },
    MIN_BOOKING_LEAD_HOURS: {
      type: Number,
      default: BUSINESS_DEFAULTS.MIN_BOOKING_LEAD_HOURS,
    },
    MAX_ACTIVE_REQUESTS_PER_CUSTOMER: {
      type: Number,
      default: BUSINESS_DEFAULTS.MAX_ACTIVE_REQUESTS_PER_CUSTOMER,
    },
    VEHICLE_CONFIRMATION_LEAD_HOURS: {
      type: Number,
      default: BUSINESS_DEFAULTS.VEHICLE_CONFIRMATION_LEAD_HOURS,
    },
    VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE: {
      type: [Number],
      default: () => [
        ...BUSINESS_DEFAULTS.VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE,
      ],
    },
    VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE: {
      type: Number,
      default: BUSINESS_DEFAULTS.VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE,
    },
    LATE_DISCLOSURE_HOURS: {
      type: Number,
      default: BUSINESS_DEFAULTS.LATE_DISCLOSURE_HOURS,
    },
    PRE_PICKUP_REMINDER_HOURS_BEFORE: {
      type: Number,
      default: BUSINESS_DEFAULTS.PRE_PICKUP_REMINDER_HOURS_BEFORE,
    },
    NO_SHOW_GRACE_MINUTES: {
      type: Number,
      default: BUSINESS_DEFAULTS.NO_SHOW_GRACE_MINUTES,
    },
    AUTO_COMPLETE_GRACE_HOURS: {
      type: Number,
      default: BUSINESS_DEFAULTS.AUTO_COMPLETE_GRACE_HOURS,
    },
    INDIVIDUAL_MAX_VEHICLES: {
      type: Number,
      default: BUSINESS_DEFAULTS.INDIVIDUAL_MAX_VEHICLES,
    },
    OTP_EXPIRY_MINUTES: {
      type: Number,
      default: BUSINESS_DEFAULTS.OTP_EXPIRY_MINUTES,
    },
    OTP_MAX_ATTEMPTS: {
      type: Number,
      default: BUSINESS_DEFAULTS.OTP_MAX_ATTEMPTS,
    },
    OTP_RESEND_COOLDOWN_SECONDS: {
      type: Number,
      default: BUSINESS_DEFAULTS.OTP_RESEND_COOLDOWN_SECONDS,
    },
    OTP_MAX_PER_HOUR: {
      type: Number,
      default: BUSINESS_DEFAULTS.OTP_MAX_PER_HOUR,
    },
    REVIEW_WINDOW_DAYS: {
      type: Number,
      default: BUSINESS_DEFAULTS.REVIEW_WINDOW_DAYS,
    },
    ISSUE_WINDOW_DAYS_AFTER_COMPLETION: {
      type: Number,
      default: BUSINESS_DEFAULTS.ISSUE_WINDOW_DAYS_AFTER_COMPLETION,
    },
    INSURANCE_EXPIRY_WARNING_DAYS: {
      type: [Number],
      default: () => [...BUSINESS_DEFAULTS.INSURANCE_EXPIRY_WARNING_DAYS],
    },
  },
  {
    timestamps: true,
  }
);

export const Setting =
  mongoose.models.Setting || mongoose.model("Setting", settingSchema);

export default Setting;

