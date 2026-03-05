import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);

export function resetMockBalance() {
  (globalThis as { __resetMockBalance?: () => void }).__resetMockBalance?.();
}
