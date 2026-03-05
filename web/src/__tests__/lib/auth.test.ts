import { describe, expect, it } from "vitest";
import { clearToken, getToken, setToken } from "@/lib/auth";

describe("auth helpers", () => {
  it("set/get/clear token", () => {
    setToken("abc");
    expect(getToken()).toBe("abc");
    clearToken();
    expect(getToken()).toBeNull();
  });
});
