import { BUSINESS_DEFAULTS } from "../constants.js";
import { Setting } from "../models/setting.model.js";

let cachedSettings = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export const invalidateConfigCache = () => {
  cachedSettings = null;
  cacheExpiresAt = 0;
};

export const getSettings = async () => {
  const now = Date.now();
  if (cachedSettings && now < cacheExpiresAt) {
    return cachedSettings;
  }

  let doc = null;
  try {
    doc = await Setting.findOne({ key: "default_settings" }).lean();
  } catch (err) {
    // If DB is unreachable or disconnected, fallback to defaults
    doc = null;
  }

  const merged = { ...BUSINESS_DEFAULTS };

  if (doc) {
    for (const key of Object.keys(BUSINESS_DEFAULTS)) {
      if (doc[key] !== undefined && doc[key] !== null) {
        merged[key] = doc[key];
      }
    }
  }

  cachedSettings = Object.freeze(merged);
  cacheExpiresAt = now + CACHE_TTL_MS;

  return cachedSettings;
};

export const getSetting = async (key) => {
  const settings = await getSettings();
  return settings[key] !== undefined ? settings[key] : BUSINESS_DEFAULTS[key];
};

export const updateSettings = async (updates) => {
  const doc = await Setting.findOneAndUpdate(
    { key: "default_settings" },
    { $set: updates },
    { new: true, upsert: true }
  ).lean();

  invalidateConfigCache();
  return getSettings();
};
