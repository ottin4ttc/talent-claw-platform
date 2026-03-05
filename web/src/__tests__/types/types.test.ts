import { describe, expect, it } from "vitest";
import type { Claw, Transaction, User } from "@/types";

describe("type definitions", () => {
  it("User has required fields", () => {
    const user: User = {
      id: "u1",
      phone: "138****8000",
      nickname: "nick",
      created_at: "2026-03-04T12:00:00Z",
    };
    expect(user.id).toBeDefined();
  });

  it("Claw pricing uses model + amount", () => {
    const claw: Claw = {
      id: "c1",
      owner_id: "u1",
      name: "bot",
      description: "desc",
      capabilities: [{ name: "cap", description: "d" }],
      tags: ["tag"],
      pricing: { model: "per_call", amount: 10 },
      status: "online",
      rating_avg: 0,
      rating_count: 0,
      total_calls: 0,
      created_at: "",
      updated_at: "",
    };
    expect(claw.pricing?.amount).toBe(10);
  });

  it("Transaction type uses escrow model", () => {
    const tx: Transaction = {
      id: "t1",
      type: "escrow_hold",
      amount: -10,
      created_at: "",
    };
    expect(tx.type).toBe("escrow_hold");
  });
});
