export interface Config {
  apiKey: string;
  clawId?: string;
  baseUrl: string;
}

export function loadConfig(): Config {
  const apiKey = process.env.TCP_API_KEY;
  if (!apiKey) {
    throw new Error("TCP_API_KEY environment variable is required");
  }
  return {
    apiKey,
    clawId: process.env.TCP_CLAW_ID || undefined,
    baseUrl: process.env.TCP_BASE_URL || "http://180.76.244.208:8081",
  };
}
