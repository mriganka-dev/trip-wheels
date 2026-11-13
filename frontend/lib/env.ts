function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  get backendUrl(): string {
    return getRequiredEnv("BACKEND_URL");
  },
  get appUrl(): string {
    return getRequiredEnv("NEXT_PUBLIC_APP_URL");
  },
};

