import { env } from "../src/config/env.js";
import {
  ACCOUNT_STATUS,
  FUEL_TYPES,
  PICKUP_MODES,
  ROLES,
  TRANSMISSION_TYPES,
  VEHICLE_STATUS,
  VEHICLE_TYPES,
  VERIFICATION_STATUS,
} from "../src/constants.js";
import { connectDB, disconnectDB } from "../src/db/index.js";
import { Destination } from "../src/models/destination.model.js";
import { PublisherProfile } from "../src/models/publisherProfile.model.js";
import { User } from "../src/models/user.model.js";
import { Vehicle } from "../src/models/vehicle.model.js";
import { normalizePhone } from "../src/utils/phone.js";

export const seedDemo = async () => {
  if (env.NODE_ENV === "production") {
    console.error(
      "seed:demo is guarded and cannot be executed in production environment."
    );
    process.exit(1);
  }

  await connectDB();
  console.log("Seeding demo entities for development testing...");

  // 1. Ensure at least one destination exists
  let digha = await Destination.findOne({ slug: "digha" });
  if (!digha) {
    digha = await Destination.create({
      name: "Digha",
      slug: "digha",
      state: "West Bengal",
      isPilot: true,
      location: { type: "Point", coordinates: [87.5113, 21.6266] },
    });
  }

  // 2. Demo Agent Publisher
  const agentEmail = "demo.agent@tripwheels.com";
  let agentUser = await User.findOne({ email: agentEmail });
  if (!agentUser) {
    agentUser = await User.create({
      fullName: "Digha Coastal Rides",
      email: agentEmail,
      phone: normalizePhone("9876543001"),
      password: "DemoPassword123",
      role: ROLES.AGENT,
      isEmailVerified: true,
      phoneConfirmedByAdmin: true,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    });
    console.log(`- Created demo agent user: ${agentEmail}`);
  }

  let agentProfile = await PublisherProfile.findOne({ user: agentUser._id });
  if (!agentProfile) {
    agentProfile = await PublisherProfile.create({
      user: agentUser._id,
      publisherType: ROLES.AGENT,
      businessName: "Digha Coastal Rides Pvt Ltd",
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      verifiedAt: new Date(),
      agentPickup: {
        address: "Plot 12, Sea Beach Road, New Digha",
        landmark: "Near New Digha Police Station",
        location: { type: "Point", coordinates: [87.525, 21.629] },
      },
    });
    console.log("- Created approved profile for demo agent");
  }

  // 3. Demo Individual Publisher
  const individualEmail = "demo.individual@tripwheels.com";
  let individualUser = await User.findOne({ email: individualEmail });
  if (!individualUser) {
    individualUser = await User.create({
      fullName: "Rahul Sen",
      email: individualEmail,
      phone: normalizePhone("9876543002"),
      password: "DemoPassword123",
      role: ROLES.INDIVIDUAL,
      isEmailVerified: true,
      phoneConfirmedByAdmin: true,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    });
    console.log(`- Created demo individual user: ${individualEmail}`);
  }

  let individualProfile = await PublisherProfile.findOne({
    user: individualUser._id,
  });
  if (!individualProfile) {
    individualProfile = await PublisherProfile.create({
      user: individualUser._id,
      publisherType: ROLES.INDIVIDUAL,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      verifiedAt: new Date(),
      individualArea: {
        city: "Digha",
        approximateArea: "Old Digha Market Area",
      },
    });
    console.log("- Created approved profile for demo individual");
  }

  // 4. Demo Customer
  const customerEmail = "demo.traveler@tripwheels.com";
  let customerUser = await User.findOne({ email: customerEmail });
  if (!customerUser) {
    customerUser = await User.create({
      fullName: "Amitabh Banerjee",
      email: customerEmail,
      phone: normalizePhone("9876543003"),
      password: "DemoPassword123",
      role: ROLES.CUSTOMER,
      isEmailVerified: true,
      phoneConfirmedByAdmin: true,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    });
    console.log(`- Created demo customer: ${customerEmail}`);
  }

  // 5. Demo Vehicles
  const reg1 = "WB02AB1234";
  let vehicle1 = await Vehicle.findOne({ registrationNumber: reg1 });
  if (!vehicle1) {
    vehicle1 = await Vehicle.create({
      publisher: agentUser._id,
      publisherProfile: agentProfile._id,
      destination: digha._id,
      type: VEHICLE_TYPES.BIKE,
      brand: "Royal Enfield",
      model: "Hunter 350",
      year: 2023,
      transmission: TRANSMISSION_TYPES.MANUAL,
      fuelType: FUEL_TYPES.PETROL,
      registrationNumber: reg1,
      chassisNumber: "ME4HUNTER12345678",
      status: VEHICLE_STATUS.ACTIVE,
      pricing: { perDay: 900, perHour: 60, deposit: 2000, minRentalHours: 4 },
      pickup: { mode: PICKUP_MODES.FIXED },
      insurance: {
        policyNumber: "POL-HUNTER-001",
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
    });
    console.log("- Created demo vehicle 1 (Hunter 350)");
  }

  const reg2 = "WB02CD5678";
  let vehicle2 = await Vehicle.findOne({ registrationNumber: reg2 });
  if (!vehicle2) {
    vehicle2 = await Vehicle.create({
      publisher: individualUser._id,
      publisherProfile: individualProfile._id,
      destination: digha._id,
      type: VEHICLE_TYPES.CAR,
      brand: "Maruti Suzuki",
      model: "Swift",
      year: 2022,
      transmission: TRANSMISSION_TYPES.MANUAL,
      fuelType: FUEL_TYPES.PETROL,
      registrationNumber: reg2,
      chassisNumber: "MA3SWIFT87654321",
      status: VEHICLE_STATUS.ACTIVE,
      pricing: { perDay: 1800, perHour: 120, deposit: 5000, minRentalHours: 6 },
      pickup: { mode: PICKUP_MODES.FLEXIBLE },
      insurance: {
        policyNumber: "POL-SWIFT-002",
        expiresAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      },
    });
    console.log("- Created demo vehicle 2 (Swift)");
  }

  console.log("Demo seed completed successfully.");
  await disconnectDB();
};

if (process.argv[1]?.endsWith("seedDemo.js")) {
  seedDemo().catch(async (err) => {
    console.error("Demo seeding failed:", err);
    await disconnectDB();
    process.exit(1);
  });
}
