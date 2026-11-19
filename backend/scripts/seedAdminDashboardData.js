import { connectDB, disconnectDB } from "../src/db/index.js";
import { User } from "../src/models/user.model.js";
import { PublisherProfile } from "../src/models/publisherProfile.model.js";
import { Vehicle } from "../src/models/vehicle.model.js";
import { Destination } from "../src/models/destination.model.js";
import { Booking } from "../src/models/booking.model.js";
import { Issue } from "../src/models/issue.model.js";
import { AdminTask } from "../src/models/adminTask.model.js";
import {
  ROLES,
  ACCOUNT_STATUS,
  VERIFICATION_STATUS,
  VEHICLE_STATUS,
  VEHICLE_TYPES,
  TRANSMISSION_TYPES,
  FUEL_TYPES,
  PICKUP_MODES,
  BOOKING_STATUS,
  ISSUE_STATUS,
  ADMIN_TASK_STATUS,
} from "../src/constants.js";
import { normalizePhone } from "../src/utils/phone.js";

async function run() {
  await connectDB();
  console.log("Seeding real operational data for Super Admin dashboard...");

  const digha = await Destination.findOne({ slug: "digha" });

  // 1. Pending Publisher (Agency)
  const agencyEmail = "sharma.travels@tripwheels.com";
  let agencyUser = await User.findOne({ email: agencyEmail });
  if (!agencyUser) {
    agencyUser = await User.create({
      fullName: "Sharma Tourist Fleet",
      email: agencyEmail,
      phone: normalizePhone("9876543110"),
      password: "Password123",
      role: ROLES.AGENT,
      isEmailVerified: true,
      phoneConfirmedByAdmin: false,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    });
  }

  let agencyProfile = await PublisherProfile.findOne({ user: agencyUser._id });
  if (!agencyProfile) {
    agencyProfile = await PublisherProfile.create({
      user: agencyUser._id,
      publisherType: ROLES.AGENT,
      businessName: "Sharma Tourist Travels Ltd",
      destination: digha?._id,
      verificationStatus: VERIFICATION_STATUS.PENDING,
      agentPickup: {
        address: "New Digha Main Road",
        landmark: "Hotel Sea Coast",
        location: { type: "Point", coordinates: [87.525, 21.629] },
      },
    });
    console.log("- Created pending agency publisher profile");
  }

  // 2. Pending Publisher (Individual)
  const indEmail = "sourav.ganguly@tripwheels.com";
  let indUser = await User.findOne({ email: indEmail });
  if (!indUser) {
    indUser = await User.create({
      fullName: "Sourav Ganguly",
      email: indEmail,
      phone: normalizePhone("9876543111"),
      password: "Password123",
      role: ROLES.INDIVIDUAL,
      isEmailVerified: true,
      phoneConfirmedByAdmin: false,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    });
  }

  let indProfile = await PublisherProfile.findOne({ user: indUser._id });
  if (!indProfile) {
    indProfile = await PublisherProfile.create({
      user: indUser._id,
      publisherType: ROLES.INDIVIDUAL,
      destination: digha?._id,
      individualArea: { city: "Digha", approximateArea: "Old Digha" },
      verificationStatus: VERIFICATION_STATUS.PENDING,
    });
    console.log("- Created pending individual publisher profile");
  }

  // 3. Vehicles Pending Review
  const pendingReg1 = "WB02EF9911";
  let pendingVeh1 = await Vehicle.findOne({ registrationNumber: pendingReg1 });
  if (!pendingVeh1) {
    pendingVeh1 = await Vehicle.create({
      publisher: agencyUser._id,
      publisherProfile: agencyProfile._id,
      destination: digha?._id,
      type: VEHICLE_TYPES.CAR,
      brand: "Mahindra",
      model: "Scorpio-N Z8L",
      year: 2024,
      transmission: TRANSMISSION_TYPES.MANUAL,
      fuelType: FUEL_TYPES.DIESEL,
      registrationNumber: pendingReg1,
      chassisNumber: "MAHSCORP99110022",
      status: VEHICLE_STATUS.PENDING_REVIEW,
      pricing: { perDay: 3500, perHour: 250, deposit: 6000, minRentalHours: 6 },
      pickup: {
        mode: PICKUP_MODES.FIXED,
        location: { type: "Point", coordinates: [87.525, 21.629] },
      },
      insurance: {
        policyNumber: "POL-SCORP-001",
        expiresAt: new Date(Date.now() + 200 * 24 * 3600 * 1000),
      },
    });
    console.log("- Created pending vehicle: Scorpio-N Z8L");
  }

  const pendingReg2 = "WB02GH3344";
  let pendingVeh2 = await Vehicle.findOne({ registrationNumber: pendingReg2 });
  if (!pendingVeh2) {
    pendingVeh2 = await Vehicle.create({
      publisher: indUser._id,
      publisherProfile: indProfile._id,
      destination: digha?._id,
      type: VEHICLE_TYPES.BIKE,
      brand: "Royal Enfield",
      model: "Classic 350 Reborn",
      year: 2023,
      transmission: TRANSMISSION_TYPES.MANUAL,
      fuelType: FUEL_TYPES.PETROL,
      registrationNumber: pendingReg2,
      chassisNumber: "RECLASSIC33445566",
      status: VEHICLE_STATUS.PENDING_REVIEW,
      pricing: { perDay: 1200, perHour: 90, deposit: 2500, minRentalHours: 4 },
      pickup: {
        mode: PICKUP_MODES.FLEXIBLE,
        location: { type: "Point", coordinates: [87.5113, 21.6266] },
      },
      insurance: {
        policyNumber: "POL-CLASSIC-002",
        expiresAt: new Date(Date.now() + 150 * 24 * 3600 * 1000),
      },
    });
    console.log("- Created pending vehicle: Classic 350");
  }

  // 4. Customer & Bookings
  const cust = await User.findOne({ role: ROLES.CUSTOMER });
  const activeVeh = await Vehicle.findOne({ status: VEHICLE_STATUS.ACTIVE });
  if (cust && activeVeh) {
    const existingBk = await Booking.findOne({ customer: cust._id });
    if (!existingBk) {
      const start = new Date(Date.now() + 24 * 3600 * 1000);
      const end = new Date(Date.now() + 72 * 3600 * 1000);
      const bk1 = await Booking.create({
        bookingCode: "TW-2026-001",
        customer: cust._id,
        publisher: activeVeh.publisher,
        publisherProfile: activeVeh.publisherProfile,
        vehicle: activeVeh._id,
        destination: activeVeh.destination,
        startAt: start,
        endAt: end,
        durationHours: 48,
        pricingSnapshot: {
          perDay: activeVeh.pricing.perDay,
          perHour: activeVeh.pricing.perHour,
          deposit: activeVeh.pricing.deposit,
          estimatedTotal: activeVeh.pricing.perDay * 2,
        },
        pickup: activeVeh.pickup,
        status: BOOKING_STATUS.CONFIRMED,
      });
      console.log("- Created confirmed booking TW-2026-001");

      const bk2 = await Booking.create({
        bookingCode: "TW-2026-002",
        customer: cust._id,
        publisher: activeVeh.publisher,
        publisherProfile: activeVeh.publisherProfile,
        vehicle: activeVeh._id,
        destination: activeVeh.destination,
        startAt: new Date(Date.now() + 12 * 3600 * 1000),
        endAt: new Date(Date.now() + 36 * 3600 * 1000),
        durationHours: 24,
        pricingSnapshot: {
          perDay: activeVeh.pricing.perDay,
          perHour: activeVeh.pricing.perHour,
          deposit: activeVeh.pricing.deposit,
          estimatedTotal: activeVeh.pricing.perDay,
        },
        pickup: activeVeh.pickup,
        status: BOOKING_STATUS.REQUESTED,
      });
      console.log("- Created requested booking TW-2026-002");

      // 5. Open Issue
      const existingIssue = await Issue.findOne({ booking: bk1._id });
      if (!existingIssue) {
        await Issue.create({
          booking: bk1._id,
          raisedBy: cust._id,
          raisedAgainst: activeVeh.publisher,
          category: "vehicle_unavailable",
          type: "vehicle_unavailable_at_pickup",
          severity: "high",
          status: ISSUE_STATUS.OPEN,
          description: "Customer requested airport drop confirmation for rental pickup",
        });
        console.log("- Created open dispute/issue");
      }
    }
  }

  // 6. Admin Call Tasks
  const existingTask = await AdminTask.findOne({ status: ADMIN_TASK_STATUS.OPEN });
  if (!existingTask) {
    await AdminTask.create({
      type: "call_publisher_pickup_unconfirmed",
      publisher: agencyUser._id,
      status: ADMIN_TASK_STATUS.OPEN,
      note: "Perform phone verification check with Sharma Tourist Travels",
    });
    console.log("- Created open admin call task");
  }

  console.log("Super Admin real operational data seeded successfully!");
  await disconnectDB();
}

run().catch(async (e) => {
  console.error("Error:", e);
  await disconnectDB();
  process.exit(1);
});
