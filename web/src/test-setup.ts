import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import React from "react";

type MockLinkProps = React.PropsWithChildren<{
  href: string | { href?: string };
}> &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function ensureUsableLocalStorage() {
  const broken =
    typeof window.localStorage?.getItem !== "function" ||
    typeof window.localStorage?.setItem !== "function" ||
    typeof window.localStorage?.removeItem !== "function";

  if (!broken) return;

  const memoryStorage = createMemoryStorage();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    writable: true,
    value: memoryStorage,
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: memoryStorage,
  });
}

ensureUsableLocalStorage();

afterEach(() => {
  localStorage.clear();
});

vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["en", "zh"],
    defaultLocale: "en",
  },
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/market",
  redirect: vi.fn(),
  Link: ({ href, children, ...props }: MockLinkProps) => {
    const target = typeof href === "string" ? href : href?.href || "#";
    return React.createElement("a", { href: target, ...props }, children);
  },
}));
