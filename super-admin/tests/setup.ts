import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock server-only module
vi.mock("server-only", () => ({}));

// Mock lib/env without setting real environment values
vi.mock("@/lib/env", () => ({
  getAppUrl: () => "https://admin.example.com",
  getBackendUrl: () => "https://api.example.com",
  isProduction: () => false,
  isDevelopment: () => true,
  validateEnv: () => ({
    NODE_ENV: "test",
    APP_URL: "https://admin.example.com",
    BACKEND_URL: "https://api.example.com",
  }),
}));
