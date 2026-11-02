import { env } from "../config/env.js";
import * as notificationService from "../notifications/notification.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(
    req.user._id,
    req.query
  );

  res
    .status(200)
    .json(new ApiResponse(200, result, "Notifications fetched successfully"));
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.params.id,
    req.user._id
  );

  res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

export const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "All notifications marked as read"));
});

export const getVapidPublicKey = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { publicKey: env.VAPID_PUBLIC_KEY || "" },
        "VAPID public key retrieved"
      )
    );
});

export const savePushSubscription = asyncHandler(async (req, res) => {
  const subscription = await notificationService.savePushSubscription(
    req.user._id,
    req.body
  );

  res
    .status(201)
    .json(
      new ApiResponse(201, subscription, "Push subscription saved successfully")
    );
});

export const removePushSubscription = asyncHandler(async (req, res) => {
  await notificationService.removePushSubscription(
    req.user._id,
    req.body.endpoint
  );

  res
    .status(200)
    .json(new ApiResponse(200, null, "Push subscription removed successfully"));
});

export const sendTestNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.sendTestNotification(
    req.user._id
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        notification,
        "Test notification dispatched to your channels"
      )
    );
});

export const confirmTestNotification = asyncHandler(async (req, res) => {
  const profile = await notificationService.confirmTestNotification(
    req.user._id
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        profile,
        "Notification channel test confirmed successfully"
      )
    );
});

export const getAdminTasks = asyncHandler(async (req, res) => {
  const result = await notificationService.getAdminTasks(req.query);

  res
    .status(200)
    .json(new ApiResponse(200, result, "Admin tasks fetched successfully"));
});

export const updateAdminTask = asyncHandler(async (req, res) => {
  const task = await notificationService.updateAdminTask(
    req.params.id,
    req.body
  );

  res
    .status(200)
    .json(new ApiResponse(200, task, "Admin task updated successfully"));
});
