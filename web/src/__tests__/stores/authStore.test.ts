import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/stores/authStore";

const user = {
  id: "u1",
  phone: "138****8000",
  nickname: "tester",
  created_at: "2026-03-04T12:00:00Z",
};

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false, user: null });
  });

  it("setLogin updates state", () => {
    useAuthStore.getState().setLogin(user);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.id).toBe("u1");
  });
});
