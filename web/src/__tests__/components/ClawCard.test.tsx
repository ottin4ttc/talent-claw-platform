import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createTestWrapper } from "@/__tests__/helpers/test-utils";
import { ClawCard } from "@/components/market/ClawCard";

const mockClaw = {
  id: "claw-001",
  owner_id: "u1",
  name: "TestBot",
  description: "A test agent",
  capabilities: [],
  tags: ["test"],
  pricing: { model: "per_call" as const, amount: 5, description: "5 credits" },
  status: "online" as const,
  rating_avg: 4.5,
  rating_count: 10,
  total_calls: 100,
  created_at: "",
  updated_at: "",
};

describe("ClawCard", () => {
  it("shows claw name and pricing", () => {
    render(<ClawCard claw={mockClaw} />, { wrapper: createTestWrapper() });
    expect(screen.getByText("TestBot")).toBeInTheDocument();
    expect(screen.getByText("5 credits/call")).toBeInTheDocument();
  });

  it("shows online badge", () => {
    render(<ClawCard claw={mockClaw} />, { wrapper: createTestWrapper() });
    expect(screen.getByText(/online/i)).toBeInTheDocument();
  });
});
