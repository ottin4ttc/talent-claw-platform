import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createTestWrapper } from "@/__tests__/helpers/test-utils";
import LoginPage from "@/app/[locale]/login/page";

describe("LoginPage", () => {
  it("renders phone input and send button", () => {
    render(<LoginPage />, { wrapper: createTestWrapper() });
    expect(screen.getByPlaceholderText(/phone/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("shows validation on invalid phone", async () => {
    render(<LoginPage />, { wrapper: createTestWrapper() });
    fireEvent.change(screen.getByPlaceholderText(/phone/i), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument();
    });
  });
});
