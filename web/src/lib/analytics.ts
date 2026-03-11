"use client";

import SDK from "@datarangers/sdk-javascript";

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production") return;

  SDK.init({
    app_id: 20012964,
    channel: "cn",
    channel_domain: "https://gator.volces.com",
    log: false,
    autotrack: true,
    spa: true,
  });

  SDK.start();
  initialized = true;
}

export function trackEvent(event: string, params?: Record<string, unknown>) {
  SDK.event(event, params ?? {});
}

export function setUser(userId: string) {
  SDK.config({ user_unique_id: userId });
}
