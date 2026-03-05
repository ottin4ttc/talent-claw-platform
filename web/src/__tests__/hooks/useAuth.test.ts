import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createTestWrapper } from "@/__tests__/helpers/test-utils";
import { useCurrentUser } from "@/hooks/useAuth";

describe("useCurrentUser", () => {
  it("fetches auth/me when token exists", async () => {
    localStorage.setItem("talent-claw-token", "mock-jwt-token-xxx");

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("user-001");
  });

  it("stays idle when token missing", () => {
    localStorage.removeItem("talent-claw-token");
    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createTestWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
  });
});
