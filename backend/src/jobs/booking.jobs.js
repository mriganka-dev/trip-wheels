import {
  ADMIN_TASK_STATUS,
  ADMIN_TASK_TYPES,
  BOOKING_STATUS,
  BUSINESS_DEFAULTS,
  NOTIFICATION_EVENTS,
} from "../constants.js";
import { AdminTask } from "../models/adminTask.model.js";
import { Booking } from "../models/booking.model.js";
import { PublisherProfile } from "../models/publisherProfile.model.js";
import { User } from "../models/user.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { notify } from "../notifications/notification.service.js";
import { getBackupVehicles } from "../services/booking.service.js";
import { getHoursDifference } from "../utils/dates.js";

export const expireRequestsJob = async () => {
  const now = new Date();

  const expiredCandidates = await Booking.find({
    status: BOOKING_STATUS.REQUESTED,
    responseDeadlineAt: { $lte: now },
  }).select("_id publisher customer bookingCode");

  for (const item of expiredCandidates) {
    const claimed = await Booking.findOneAndUpdate(
      { _id: item._id, status: BOOKING_STATUS.REQUESTED },
      {
        $set: {
          status: BOOKING_STATUS.EXPIRED,
          respondedAt: now,
        },
        $push: {
          statusHistory: {
            status: BOOKING_STATUS.EXPIRED,
            at: now,
            note: "Automatically expired after response deadline",
          },
        },
      },
      { new: true }
    );

    if (claimed) {
      // Increment publisher expired counter
      const profile = await PublisherProfile.findOneAndUpdate(
        { user: claimed.publisher },
        { $inc: { "reliability.expired": 1 } },
        { new: true }
      );

      // Create Admin task if publisher has repeated expirations (>= 3)
      if (profile && (profile.reliability?.expired || 0) >= 3) {
        const existingTask = await AdminTask.findOne({
          publisher: claimed.publisher,
          type: ADMIN_TASK_TYPES.CALL_PUBLISHER_NO_RESPONSE,
          status: ADMIN_TASK_STATUS.OPEN,
        });

        if (!existingTask) {
          await AdminTask.create({
            type: ADMIN_TASK_TYPES.CALL_PUBLISHER_NO_RESPONSE,
            publisher: claimed.publisher,
            booking: claimed._id,
            details: {
              reason: "Repeated expired booking requests without response",
              expiredCount: profile.reliability?.expired || 0,
            },
          });
        }
      }

      // Notify customer and publisher
      notify({
        event: NOTIFICATION_EVENTS.BOOKING_EXPIRED,
        userId: claimed.customer,
        data: {
          bookingId: claimed._id,
          bookingCode: claimed.bookingCode,
        },
      });

      notify({
        event: NOTIFICATION_EVENTS.BOOKING_EXPIRED,
        userId: claimed.publisher,
        data: {
          bookingId: claimed._id,
          bookingCode: claimed.bookingCode,
        },
      });
    }
  }
};

export const requestRemindersJob = async () => {
  const now = new Date();

  const pendingRequests = await Booking.find({
    status: BOOKING_STATUS.REQUESTED,
    responseDeadlineAt: { $gt: now },
  }).select(
    "_id createdAt responseDeadlineAt remindersSent publisher bookingCode"
  );

  for (const b of pendingRequests) {
    const totalWindowMs =
      b.responseDeadlineAt.getTime() - b.createdAt.getTime();
    const halfwayTime = new Date(b.createdAt.getTime() + totalWindowMs / 2);
    const finalNoticeTime = new Date(
      b.responseDeadlineAt.getTime() - 30 * 60 * 1000
    );

    // Halfway reminder
    if (now >= halfwayTime && !b.remindersSent?.halfway) {
      const claimed = await Booking.findOneAndUpdate(
        { _id: b._id, "remindersSent.halfway": false },
        { $set: { "remindersSent.halfway": true } }
      );

      if (claimed) {
        notify({
          event: NOTIFICATION_EVENTS.BOOKING_REMINDER_HALFWAY,
          userId: b.publisher,
          data: {
            bookingId: b._id,
            bookingCode: b.bookingCode,
          },
        });
      }
    }

    // Final reminder (30 mins before deadline)
    if (now >= finalNoticeTime && !b.remindersSent?.final) {
      const claimed = await Booking.findOneAndUpdate(
        { _id: b._id, "remindersSent.final": false },
        { $set: { "remindersSent.final": true } }
      );

      if (claimed) {
        notify({
          event: NOTIFICATION_EVENTS.BOOKING_REMINDER_FINAL,
          userId: b.publisher,
          data: {
            bookingId: b._id,
            bookingCode: b.bookingCode,
          },
        });
      }
    }
  }
};

export const vehicleConfirmationRemindersJob = async () => {
  const now = new Date();

  // Find confirmed bookings with unconfirmed vehicle where startAt is in the future
  const bookings = await Booking.find({
    status: BOOKING_STATUS.CONFIRMED,
    "vehicleConfirmation.confirmedAt": null,
    startAt: { $gt: now },
  });

  const reminderHours =
    BUSINESS_DEFAULTS.VEHICLE_CONFIRMATION_REMINDER_HOURS_BEFORE; // [24, 18, 14]
  const deadlineHours =
    BUSINESS_DEFAULTS.VEHICLE_CONFIRMATION_DEADLINE_HOURS_BEFORE; // 12

  for (const b of bookings) {
    const hoursToPickup = getHoursDifference(now, b.startAt);

    // Check reminders at 24h, 18h, 14h
    for (const h of reminderHours) {
      if (hoursToPickup <= h && hoursToPickup > deadlineHours) {
        // Use slot string representation to track
        const slotKey = `reminder_${h}h`;
        const alreadySent = b.remindersSent?.vehicleConfirmation?.some(
          (d) =>
            new Date(d).toISOString().slice(0, 13) ===
            now.toISOString().slice(0, 13)
        );

        if (!alreadySent) {
          const claimed = await Booking.findOneAndUpdate(
            {
              _id: b._id,
              "vehicleConfirmation.confirmedAt": null,
            },
            {
              $push: { "remindersSent.vehicleConfirmation": now },
            }
          );

          if (claimed) {
            notify({
              event: NOTIFICATION_EVENTS.BOOKING_VEHICLE_CONFIRMATION_REMINDER,
              userId: b.publisher,
              data: {
                bookingId: b._id,
                bookingCode: b.bookingCode,
                hoursRemaining: Math.round(hoursToPickup),
              },
            });
            break;
          }
        }
      }
    }

    // Check missed deadline at 12 hours
    if (hoursToPickup <= deadlineHours && !b.vehicleConfirmation?.missedAt) {
      const claimed = await Booking.findOneAndUpdate(
        {
          _id: b._id,
          status: BOOKING_STATUS.CONFIRMED,
          "vehicleConfirmation.confirmedAt": null,
          "vehicleConfirmation.missedAt": null,
        },
        {
          $set: { "vehicleConfirmation.missedAt": now },
        }
      );

      if (claimed) {
        // Increase missedConfirmations counter on publisher
        await PublisherProfile.findOneAndUpdate(
          { user: b.publisher },
          { $inc: { "reliability.missedConfirmations": 1 } }
        );

        // Create Admin Task
        await AdminTask.create({
          type: ADMIN_TASK_TYPES.CALL_PUBLISHER_UNCONFIRMED_VEHICLE,
          publisher: b.publisher,
          booking: b._id,
          details: {
            bookingCode: b.bookingCode,
            hoursUntilPickup: Math.round(hoursToPickup),
          },
        });

        // Notify customer
        notify({
          event: NOTIFICATION_EVENTS.BOOKING_VEHICLE_CONFIRMATION_MISSED,
          userId: b.customer,
          data: {
            bookingId: b._id,
            bookingCode: b.bookingCode,
          },
        });
      }
    }
  }
};

export const prePickupRemindersJob = async () => {
  const now = new Date();

  // 3 hours before pickup reminder to publisher
  const bookings = await Booking.find({
    status: BOOKING_STATUS.CONFIRMED,
    startAt: { $gt: now },
  });

  for (const b of bookings) {
    const hoursToPickup = getHoursDifference(now, b.startAt);

    if (
      hoursToPickup <= BUSINESS_DEFAULTS.PRE_PICKUP_REMINDER_HOURS_BEFORE &&
      !b.remindersSent?.pickup
    ) {
      const claimed = await Booking.findOneAndUpdate(
        { _id: b._id, "remindersSent.pickup": false },
        { $set: { "remindersSent.pickup": true } }
      );

      if (claimed) {
        notify({
          event: NOTIFICATION_EVENTS.BOOKING_PICKUP_REMINDER,
          userId: b.publisher,
          data: {
            bookingId: b._id,
            bookingCode: b.bookingCode,
          },
        });
      }
    }

    // Unconfirmed 1 hour before pickup -> Admin task
    if (hoursToPickup <= 1 && !b.prePickupConfirmedAt) {
      const existingTask = await AdminTask.findOne({
        booking: b._id,
        type: ADMIN_TASK_TYPES.CALL_PUBLISHER_PICKUP_UNCONFIRMED,
      });

      if (!existingTask) {
        await AdminTask.create({
          type: ADMIN_TASK_TYPES.CALL_PUBLISHER_PICKUP_UNCONFIRMED,
          publisher: b.publisher,
          booking: b._id,
          details: {
            bookingCode: b.bookingCode,
            hoursUntilPickup: Math.round(hoursToPickup),
          },
        });
      }
    }
  }
};

export const overdueAndAutoCompleteJob = async () => {
  const now = new Date();

  // 1. Flag overdue ongoing bookings
  const overdueBookings = await Booking.find({
    status: BOOKING_STATUS.ONGOING,
    endAt: { $lt: now },
    isOverdue: false,
  });

  for (const b of overdueBookings) {
    const claimed = await Booking.findOneAndUpdate(
      { _id: b._id, status: BOOKING_STATUS.ONGOING, isOverdue: false },
      { $set: { isOverdue: true } }
    );

    if (claimed) {
      notify({
        event: NOTIFICATION_EVENTS.BOOKING_OVERDUE,
        userId: b.customer,
        data: {
          bookingId: b._id,
          bookingCode: b.bookingCode,
        },
      });

      notify({
        event: NOTIFICATION_EVENTS.BOOKING_OVERDUE,
        userId: b.publisher,
        data: {
          bookingId: b._id,
          bookingCode: b.bookingCode,
        },
      });
    }
  }

  // 2. Auto-complete trips after endAt + AUTO_COMPLETE_GRACE_HOURS
  const graceMs = BUSINESS_DEFAULTS.AUTO_COMPLETE_GRACE_HOURS * 3600 * 1000;
  const threshold = new Date(now.getTime() - graceMs);

  const candidatesForAutoComplete = await Booking.find({
    status: BOOKING_STATUS.ONGOING,
    endAt: { $lt: threshold },
  });

  for (const b of candidatesForAutoComplete) {
    const claimed = await Booking.findOneAndUpdate(
      { _id: b._id, status: BOOKING_STATUS.ONGOING },
      {
        $set: {
          status: BOOKING_STATUS.COMPLETED,
          "completion.completedAt": now,
          "completion.completedBy": "system",
          "completion.autoCompleted": true,
        },
        $push: {
          statusHistory: {
            status: BOOKING_STATUS.COMPLETED,
            at: now,
            note: "Auto-completed by system after return grace period",
          },
        },
      },
      { new: true }
    );

    if (claimed) {
      // Increment vehicle tripsCompleted
      await Vehicle.findByIdAndUpdate(
        claimed.assignedVehicle || claimed.vehicle,
        {
          $inc: { tripsCompleted: 1 },
        }
      );

      // Increment completed on publisher profile
      await PublisherProfile.findOneAndUpdate(
        { user: claimed.publisher },
        { $inc: { "reliability.completed": 1 } }
      );

      // Increment completed on customer user
      await User.findByIdAndUpdate(claimed.customer, {
        $inc: { "reliability.completedBookings": 1 },
      });

      notify({
        event: NOTIFICATION_EVENTS.BOOKING_COMPLETED,
        userId: claimed.customer,
        data: {
          bookingId: claimed._id,
          bookingCode: claimed.bookingCode,
        },
      });

      notify({
        event: NOTIFICATION_EVENTS.BOOKING_COMPLETED,
        userId: claimed.publisher,
        data: {
          bookingId: claimed._id,
          bookingCode: claimed.bookingCode,
        },
      });
    }
  }
};

export const noShowSuggestionJob = async () => {
  const now = new Date();
  const graceMs = BUSINESS_DEFAULTS.NO_SHOW_GRACE_MINUTES * 60 * 1000;
  const threshold = new Date(now.getTime() - graceMs);

  // Confirmed bookings where startAt + grace < now and trip hasn't started
  const candidates = await Booking.find({
    status: BOOKING_STATUS.CONFIRMED,
    startAt: { $lt: threshold },
    customerPickedUpAt: null,
    "handover.pickedUpAt": null,
  });

  // Notifications or flags for publishers can be sent safely once per booking
  for (const b of candidates) {
    // If not yet flagged/notified
    const existingNotification = await AdminTask.findOne({
      booking: b._id,
      details: { bookingCode: b.bookingCode, noShowSuggested: true },
    });

    if (!existingNotification) {
      // No-show option is available to publisher
    }
  }
};
