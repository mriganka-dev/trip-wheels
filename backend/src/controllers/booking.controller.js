import * as bookingService from "../services/booking.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBookingRequest(req.user, req.body);
  res
    .status(201)
    .json(
      new ApiResponse(201, booking, "Booking request created successfully")
    );
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.getMyBookings(req.user, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "My bookings fetched successfully"));
});

export const getReceivedBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.getReceivedBookings(req.user, req.query);
  res
    .status(200)
    .json(
      new ApiResponse(200, result, "Received bookings fetched successfully")
    );
});

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.user, req.params.id);
  res
    .status(200)
    .json(
      new ApiResponse(200, booking, "Booking details fetched successfully")
    );
});

export const acceptBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.acceptBooking(
    req.user,
    req.params.id,
    req.body
  );
  res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking accepted successfully"));
});

export const rejectBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.rejectBooking(
    req.user,
    req.params.id,
    req.body.reason
  );
  res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking rejected successfully"));
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(
    req.user,
    req.params.id,
    req.body.reason
  );
  res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking cancelled successfully"));
});

export const finalizePickupPoint = asyncHandler(async (req, res) => {
  const booking = await bookingService.finalizePickupPoint(
    req.user,
    req.params.id,
    req.body
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, booking, "Exact pickup point finalized successfully")
    );
});

export const confirmVehicle = asyncHandler(async (req, res) => {
  const booking = await bookingService.confirmVehicle(
    req.user,
    req.params.id,
    req.body
  );
  res
    .status(200)
    .json(new ApiResponse(200, booking, "Vehicle confirmed successfully"));
});

export const reportVehicleUnavailable = asyncHandler(async (req, res) => {
  const booking = await bookingService.reportVehicleUnavailable(
    req.user,
    req.params.id,
    req.body
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        booking,
        "Vehicle unavailability reported successfully"
      )
    );
});

export const confirmPickupReady = asyncHandler(async (req, res) => {
  const booking = await bookingService.confirmPickupReady(
    req.user,
    req.params.id
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, booking, "Pickup readiness confirmed successfully")
    );
});

export const getBackupVehicles = asyncHandler(async (req, res) => {
  const backups = await bookingService.getBackupVehicles(req.params.id);
  res
    .status(200)
    .json(
      new ApiResponse(200, backups, "Backup vehicles fetched successfully")
    );
});

export const recordHandover = asyncHandler(async (req, res) => {
  const booking = await bookingService.recordHandover(
    req.user,
    req.params.id,
    req.body
  );
  res
    .status(200)
    .json(new ApiResponse(200, booking, "Handover recorded successfully"));
});

export const declineHandover = asyncHandler(async (req, res) => {
  const booking = await bookingService.declineHandover(
    req.user,
    req.params.id,
    req.body
  );
  res
    .status(200)
    .json(new ApiResponse(200, booking, "Handover declined successfully"));
});

export const markPickedUp = asyncHandler(async (req, res) => {
  const booking = await bookingService.customerMarkPickedUp(
    req.user,
    req.params.id
  );
  res
    .status(200)
    .json(new ApiResponse(200, booking, "Pickup confirmed by customer"));
});

export const markNoShow = asyncHandler(async (req, res) => {
  const booking = await bookingService.markNoShow(req.user, req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking marked as no-show"));
});

export const completeBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.completeBooking(req.user, req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, booking, "Trip completed successfully"));
});

export const requestModification = asyncHandler(async (req, res) => {
  const booking = await bookingService.requestModification(
    req.user,
    req.params.id,
    req.body
  );
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        booking,
        "Modification request submitted successfully"
      )
    );
});

export const decideModification = asyncHandler(async (req, res) => {
  const booking = await bookingService.decideModification(
    req.user,
    req.params.id,
    req.params.reqId,
    req.body.action
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        booking,
        `Modification request ${req.body.action}ed successfully`
      )
    );
});

export const getAdminBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.getAdminBookings(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Bookings list fetched for admin"));
});

export const adminOverrideStatus = asyncHandler(async (req, res) => {
  const booking = await bookingService.adminOverrideStatus(
    req.user,
    req.params.id,
    req.body.status,
    req.body.note
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        booking,
        "Booking status overridden successfully by admin"
      )
    );
});
