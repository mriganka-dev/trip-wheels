import app from "../src/app.js";
import { normalizePhone } from "../src/utils/phone.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../src/validators/auth.validator.js";

const run = async () => {
  console.log("Running Auth & User Unit and Route Tests...");

  // 1. Validator checks
  const validRegister = registerSchema.safeParse({
    fullName: "Rohan Sharma",
    email: "rohan.sharma@example.com",
    phone: "9876543210",
    password: "Password123",
    role: "customer",
  });
  if (!validRegister.success) {
    throw new Error("Valid register payload was rejected");
  }

  // Reject admin role
  const adminRegister = registerSchema.safeParse({
    fullName: "Admin Attempt",
    email: "admin@example.com",
    phone: "9876543210",
    password: "Password123",
    role: "admin",
  });
  if (adminRegister.success) {
    throw new Error("Registration validator allowed 'admin' role");
  }

  // Reject weak password
  const weakPass = registerSchema.safeParse({
    fullName: "Rohan Sharma",
    email: "rohan@example.com",
    phone: "9876543210",
    password: "simplepassword",
  });
  if (weakPass.success) {
    throw new Error("Registration validator allowed password without numbers");
  }

  // 2. Phone normalization
  const normalized = normalizePhone("9876543210");
  if (normalized !== "919876543210") {
    throw new Error(
      `Phone normalization failed. Expected 919876543210, got ${normalized}`
    );
  }

  // 3. HTTP route validation tests
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Register endpoint validation failure
    const regRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "A",
        email: "bad-email",
        phone: "123",
        password: "short",
        role: "admin",
      }),
    });
    const regJson = await regRes.json();
    if (regRes.status !== 400 || regJson.success !== false) {
      throw new Error("Register validation should have failed with status 400");
    }
    console.log("Register input validation passed: 400 Bad Request");

    // Login endpoint validation failure
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const loginJson = await loginRes.json();
    if (loginRes.status !== 400 || loginJson.success !== false) {
      throw new Error("Login validation should have failed with status 400");
    }
    console.log("Login input validation passed: 400 Bad Request");

    // Verify-email endpoint invalid OTP format
    const verifyRes = await fetch(`${baseUrl}/api/v1/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", otp: "12" }),
    });
    const verifyJson = await verifyRes.json();
    if (verifyRes.status !== 400 || verifyJson.success !== false) {
      throw new Error(
        "Verify email with invalid OTP length should fail with status 400"
      );
    }
    console.log("Verify email OTP validation passed: 400 Bad Request");

    // Protected route check without JWT
    const meRes = await fetch(`${baseUrl}/api/v1/users/me`);
    const meJson = await meRes.json();
    if (meRes.status !== 401 || meJson.success !== false) {
      throw new Error(
        "Protected /users/me should fail with status 401 when unauthenticated"
      );
    }
    console.log("Protected route auth guard passed: 401 Unauthorized");

    console.log("All Auth unit and route tests passed successfully.");
  } finally {
    server.close();
  }
};

run().catch((err) => {
  console.error("Auth test failed:", err);
  process.exit(1);
});
