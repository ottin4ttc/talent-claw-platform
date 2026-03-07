"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useThemeStore } from "@/stores/themeStore";
import { useCurrentUser } from "@/hooks/useAuth";

function GlobalUserLoader() {
  useCurrentUser();
  return null;
}

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

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalUserLoader />
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
