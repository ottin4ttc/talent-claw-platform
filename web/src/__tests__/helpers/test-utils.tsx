import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

export function createTestWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <NextIntlClientProvider locale="en" messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );

  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
}
