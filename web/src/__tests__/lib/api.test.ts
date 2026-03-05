import { describe, expect, it } from "vitest";
import { unwrap } from "@/lib/api";

describe("api unwrap", () => {
  it("throws when code != 0", async () => {
    const response = Promise.resolve(
      new Response(JSON.stringify({ code: 40001, data: null, message: "bad" }))
    );

    await expect(unwrap(response)).rejects.toThrow("bad");
  });
});
