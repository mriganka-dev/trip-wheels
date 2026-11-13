import { env } from "../config/env.js";
import {
  CRITICAL_NOTIFICATION_EVENTS,
  NOTIFICATION_CHANNELS,
  ROLES,
} from "../constants.js";
import { AdminTask } from "../models/adminTask.model.js";
import { Notification } from "../models/notification.model.js";
import { PublisherProfile } from "../models/publisherProfile.model.js";
import { PushSubscription } from "../models/pushSubscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { formatPaginatedResponse, getPagination } from "../utils/pagination.js";
import { sendNotificationEmail } from "./channels/email.channel.js";
import { sendInApp } from "./channels/inApp.channel.js";
import { sendPush } from "./channels/push.channel.js";
import { sendWhatsApp } from "./channels/whatsapp.channel.js";
import { renderNotification } from "./templates.js";

export const notify = async ({
  userId,
  event,
  data = {},
  channels: explicitChannels,
}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return null;
    }

    const { title, body, deepLink } = renderNotification(event, data);
    const notificationData = { ...data, deepLink };

    const isCritical = CRITICAL_NOTIFICATION_EVENTS.includes(event);
    const userPrefs = user.notificationPreferences || {
      email: true,
      push: true,
      inApp: true,
    };

    // Critical events ignore user preference opt-outs
    const sendInAppChannel =
      explicitChannels?.includes(NOTIFICATION_CHANNELS.IN_APP) ??
      (isCritical || userPrefs.inApp !== false);

    const sendPushChannel =
      explicitChannels?.includes(NOTIFICATION_CHANNELS.PUSH) ??
      (isCritical || userPrefs.push !== false);

    const sendEmailChannel =
      explicitChannels?.includes(NOTIFICATION_CHANNELS.EMAIL) ??
      (isCritical || userPrefs.email !== false);

    const sendWhatsAppChannel =
      explicitChannels?.includes(NOTIFICATION_CHANNELS.WHATSAPP) ??
      env.WHATSAPP_ENABLED;

    const initialChannelStatuses = [
      {
        channel: NOTIFICATION_CHANNELS.IN_APP,
        status: sendInAppChannel ? "sent" : "skipped",
        sentAt: sendInAppChannel ? new Date() : null,
      },
      {
        channel: NOTIFICATION_CHANNELS.PUSH,
        status: sendPushChannel ? "sent" : "skipped",
      },
      {
        channel: NOTIFICATION_CHANNELS.EMAIL,
        status: sendEmailChannel ? "sent" : "skipped",
      },
      {
        channel: NOTIFICATION_CHANNELS.WHATSAPP,
        status: sendWhatsAppChannel ? "sent" : "skipped",
      },
    ];

    const notification = await Notification.create({
      user: userId,
      event,
      title,
      body,
      data: notificationData,
      channels: initialChannelStatuses,
    });

    // Asynchronously dispatch to non-blocking channels
    setImmediate(async () => {
      const channelUpdates = [];

      // 1. In-App
      if (sendInAppChannel) {
        await sendInApp({ userId, title, body, data: notificationData });
      }

      // 2. Web Push
      if (sendPushChannel) {
        try {
          const pushResult = await sendPush({
            userId,
            title,
            body,
            data: notificationData,
          });

          channelUpdates.push({
            channel: NOTIFICATION_CHANNELS.PUSH,
            status: pushResult.success ? "sent" : "failed",
            sentAt: pushResult.success ? new Date() : null,
            error: pushResult.error || "",
          });
        } catch (pushErr) {
          channelUpdates.push({
            channel: NOTIFICATION_CHANNELS.PUSH,
            status: "failed",
            error: pushErr.message,
          });
        }
      }

      // 3. Email
      if (sendEmailChannel && user.email) {
        try {
          const emailResult = await sendNotificationEmail({
            toEmail: user.email,
            title,
            body,
            deepLink,
          });

          channelUpdates.push({
            channel: NOTIFICATION_CHANNELS.EMAIL,
            status: emailResult.success ? "sent" : "failed",
            sentAt: emailResult.success ? new Date() : null,
            error: emailResult.error || "",
          });
        } catch (emailErr) {
          channelUpdates.push({
            channel: NOTIFICATION_CHANNELS.EMAIL,
            status: "failed",
            error: emailErr.message,
          });
        }
      }

      // 4. WhatsApp
      if (sendWhatsAppChannel) {
        try {
          const waResult = await sendWhatsApp({
            phone: user.phone,
            title,
            body,
            event,
            data: notificationData,
          });

          channelUpdates.push({
            channel: NOTIFICATION_CHANNELS.WHATSAPP,
            status: waResult.success ? "sent" : "failed",
            sentAt: waResult.sentAt || null,
          });
        } catch (waErr) {
          channelUpdates.push({
            channel: NOTIFICATION_CHANNELS.WHATSAPP,
            status: "failed",
            error: waErr.message,
          });
        }
      }

      // Update delivery statuses on notification document
      if (channelUpdates.length > 0) {
        try {
          const currentNotification = await Notification.findById(
            notification._id
          );
          if (currentNotification) {
            for (const update of channelUpdates) {
              const target = currentNotification.channels.find(
                (c) => c.channel === update.channel
              );
              if (target) {
                target.status = update.status;
                target.sentAt = update.sentAt || target.sentAt;
                target.error = update.error || target.error;
              }
            }
            await currentNotification.save();
          }
        } catch (saveErr) {
          console.error(
            "Failed to update notification channel status:",
            saveErr.message
          );
        }
      }
    });

    return notification;
  } catch (error) {
    console.error(`Failed to dispatch notification [${event}]:`, error.message);
    return null;
  }
};

export const notifyAdmins = async (event, data = {}) => {
  try {
    const adminUsers = await User.find({
      role: ROLES.ADMIN,
      accountStatus: "active",
    });
    const promises = adminUsers.map((admin) =>
      notify({
        userId: admin._id,
        event,
        data,
      })
    );
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error("Failed to notify admins:", error.message);
    return false;
  }
};

export const createAdminTask = async ({
  type,
  booking = null,
  publisher = null,
  note = "",
  dueAt = null,
  assignedTo = null,
}) => {
  const task = await AdminTask.create({
    type,
    booking,
    publisher,
    note,
    dueAt,
    assignedTo,
  });

  return task;
};

export const getUserNotifications = async (userId, query = {}) => {
  const { page, limit, skip } = getPagination(query);

  const [items, totalItems, unreadCount] = await Promise.all([
    Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, readAt: null }),
  ]);

  const pagedResponse = formatPaginatedResponse({
    items,
    totalItems,
    page,
    limit,
  });

  pagedResponse.unreadCount = unreadCount;
  return pagedResponse;
};

export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { readAt: new Date() } },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return notification;
};

export const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { user: userId, readAt: null },
    { $set: { readAt: new Date() } }
  );

  return true;
};

export const savePushSubscription = async (userId, subscriptionData) => {
  const { endpoint, keys, userAgent = "", platform = "" } = subscriptionData;

  const subscription = await PushSubscription.findOneAndUpdate(
    { endpoint },
    {
      $set: {
        user: userId,
        keys,
        userAgent,
        platform,
        isActive: true,
        failedCount: 0,
      },
    },
    { new: true, upsert: true }
  );

  return subscription;
};

export const removePushSubscription = async (userId, endpoint) => {
  await PushSubscription.findOneAndDelete({ endpoint, user: userId });
  return true;
};

export const sendTestNotification = async (userId) => {
  return await notify({
    userId,
    event: "notifications.test",
    data: { test: true },
  });
};

export const confirmTestNotification = async (userId) => {
  const profile = await PublisherProfile.findOneAndUpdate(
    { user: userId },
    { $set: { notificationsTestConfirmedAt: new Date() } },
    { new: true }
  );

  if (!profile) {
    throw new ApiError(404, "Publisher profile not found");
  }

  return profile;
};

export const getAdminTasks = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);

  const filter = {};
  if (query.status) {
    filter.status = query.status;
  }
  if (query.type) {
    filter.type = query.type;
  }

  const [items, totalItems] = await Promise.all([
    AdminTask.find(filter)
      .populate("publisher", "fullName email phone")
      .populate("assignedTo", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AdminTask.countDocuments(filter),
  ]);

  return formatPaginatedResponse({ items, totalItems, page, limit });
};

export const updateAdminTask = async (taskId, { status, note, assignedTo }) => {
  const task = await AdminTask.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Admin task not found");
  }

  if (status !== undefined) {
    task.status = status;
    if (status === "done") {
      task.completedAt = new Date();
    }
  }

  if (note !== undefined) {
    task.note = note.trim();
  }

  if (assignedTo !== undefined) {
    task.assignedTo = assignedTo;
  }

  await task.save();
  return task;
};
