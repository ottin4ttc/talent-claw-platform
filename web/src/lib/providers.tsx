"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useThemeStore } from "@/stores/themeStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore();
  const [ready, setReady] = useState(false);
  const shouldMock = process.env.NEXT_PUBLIC_MOCK === "true";
  const [mockReady, setMockReady] = useState(!shouldMock);

  useEffect(() => {
    const saved = window.localStorage.getItem("talent-claw-theme");
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
    }
    setReady(true);
  }, [setTheme]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme, ready]);

  useEffect(() => {
    if (!shouldMock) return;

    let active = true;

    import("@/mocks/browser")
      .then(({ worker }) => worker.start({ onUnhandledRequest: "bypass" }))
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setMockReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, [shouldMock]);

  if (!mockReady) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="flex h-screen items-center justify-center text-muted-foreground">
          Loading...
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
