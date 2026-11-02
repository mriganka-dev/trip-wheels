import { AuditLog } from "../models/auditLog.model.js";
import { formatPaginatedResponse, getPagination } from "../utils/pagination.js";

const SENSITIVE_KEYS = [
  "password",
  "refreshToken",
  "token",
  "otp",
  "code",
  "secret",
  "documentUrl",
  "selfieUrl",
];

const sanitizeSnapshot = (data) => {
  if (!data) return null;
  const obj = data.toObject
    ? data.toObject()
    : JSON.parse(JSON.stringify(data));

  const clean = (item) => {
    if (!item || typeof item !== "object") return item;
    if (Array.isArray(item)) return item.map(clean);

    const result = {};
    for (const [key, value] of Object.entries(item)) {
      if (
        SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s.toLowerCase()))
      ) {
        continue;
      }
      result[key] = clean(value);
    }
    return result;
  };

  return clean(obj);
};

export const logAudit = async ({
  actorId,
  action,
  targetType,
  targetId,
  before = null,
  after = null,
  ip = "",
  userAgent = "",
}) => {
  try {
    await AuditLog.create({
      actor: actorId,
      action,
      targetType,
      targetId: targetId ? targetId.toString() : null,
      before: sanitizeSnapshot(before),
      after: sanitizeSnapshot(after),
      ip: ip || "",
      userAgent: userAgent || "",
    });
  } catch (err) {
    console.error("Failed to write audit log entry:", err);
  }
};

export const getAuditLogs = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.actor) {
    filter.actor = query.actor;
  }
  if (query.action) {
    filter.action = query.action;
  }
  if (query.targetType) {
    filter.targetType = query.targetType;
  }
  if (query.targetId) {
    filter.targetId = query.targetId;
  }
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  const totalItems = await AuditLog.countDocuments(filter);
  const items = await AuditLog.find(filter)
    .populate("actor", "fullName email role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return formatPaginatedResponse({ items, totalItems, page, limit });
};
