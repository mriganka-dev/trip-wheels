import app from "../src/app.js";
import { z } from "zod";
import { validate } from "../src/middlewares/validate.middleware.js";
import { ApiError } from "../src/utils/ApiError.js";
import apiRouter from "../src/routes/index.js";

// Mount ephemeral routes to test validation and error handling
apiRouter.post(
  "/test-validation",
  validate({
    body: z.object({
      name: z.string().min(3),
      email: z.string().email(),
    }),
  }),
  (req, res) => res.json({ ok: true })
);

apiRouter.get("/test-custom-error", () => {
  throw new ApiError(400, "Sample business error", ["Custom error reason"]);
});

const run = async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/v1/health`);
    const healthJson = await healthRes.json();
    if (healthRes.status !== 200 || !healthJson.success) {
      throw new Error("Health check failed");
    }
    console.log("Health check passed: 200 OK");

    // 2. 404 handler
    const notFoundRes = await fetch(`${baseUrl}/api/v1/unknown-endpoint`);
    const notFoundJson = await notFoundRes.json();
    if (notFoundRes.status !== 404 || notFoundJson.success !== false) {
      throw new Error("404 handler failed");
    }
    console.log("404 handler passed: 404 Not Found");

    // 3. Custom ApiError
    const errorRes = await fetch(`${baseUrl}/api/v1/test-custom-error`);
    const errorJson = await errorRes.json();
    if (
      errorRes.status !== 400 ||
      errorJson.message !== "Sample business error"
    ) {
      throw new Error("ApiError handling failed");
    }
    console.log("ApiError handler passed: 400 Bad Request");

    // 4. Zod validation error
    const valRes = await fetch(`${baseUrl}/api/v1/test-validation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x", email: "not-an-email" }),
    });
    const valJson = await valRes.json();
    if (valRes.status !== 400 || valJson.errors.length !== 2) {
      throw new Error("Zod validation failed");
    }
    console.log("Zod validation passed: 400 Bad Request with formatted issues");

    console.log("All foundation tests passed successfully.");
  } finally {
    server.close();
  }
};

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
