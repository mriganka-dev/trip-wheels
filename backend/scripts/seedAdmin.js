import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { ACCOUNT_STATUS, ROLES } from "../src/constants.js";
import { connectDB, disconnectDB } from "../src/db/index.js";
import { User } from "../src/models/user.model.js";
import { normalizePhone } from "../src/utils/phone.js";

const parseCliArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        parsed[key] = next;
        i++;
      }
    }
  }

  return parsed;
};

const seedAdmin = async () => {
  const cliArgs = parseCliArgs();

  const fullName =
    cliArgs.name || process.env.ADMIN_NAME || "Trip Wheels Admin";
  const email = (
    cliArgs.email ||
    process.env.ADMIN_EMAIL ||
    "admin@tripwheels.com"
  )
    .toLowerCase()
    .trim();
  const password =
    cliArgs.password || process.env.ADMIN_PASSWORD || "AdminPass123";
  const phone = normalizePhone(
    cliArgs.phone || process.env.ADMIN_PHONE || "9876543210"
  );

  await connectDB();

  const existingAdmin = await User.findOne({
    $or: [{ role: ROLES.ADMIN }, { email }],
  });

  if (existingAdmin) {
    console.log(`Admin user already exists with email: ${existingAdmin.email}`);
    await disconnectDB();
    process.exit(0);
  }

  await User.create({
    fullName,
    email,
    phone,
    password,
    role: ROLES.ADMIN,
    isEmailVerified: true,
    phoneConfirmedByAdmin: true,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
  });

  console.log(`Admin user created successfully with email: ${email}`);
  await disconnectDB();
  process.exit(0);
};

seedAdmin().catch(async (error) => {
  console.error("Admin seeding failed:", error.message);
  await disconnectDB();
  process.exit(1);
});
