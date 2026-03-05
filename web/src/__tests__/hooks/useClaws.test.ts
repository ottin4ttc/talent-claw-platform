import { describe, expect, it } from "vitest";
import { useClawDetail, useClawList } from "@/hooks/useClaws";

describe("useClaws exports", () => {
  it("useClawList is function", () => {
    expect(typeof useClawList).toBe("function");
  });

  it("useClawDetail is function", () => {
    expect(typeof useClawDetail).toBe("function");
  });
});
