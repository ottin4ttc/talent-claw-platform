import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createTestWrapper } from "@/__tests__/helpers/test-utils";
import { ApiKeyManager } from "@/components/dashboard/ApiKeyManager";

describe("ApiKeyManager", () => {
  it("renders API key list", async () => {
    render(<ApiKeyManager />, { wrapper: createTestWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/clw_mock/)).toBeInTheDocument();
    });
  });

  it("opens dialog when clicking create", async () => {
    render(<ApiKeyManager />, { wrapper: createTestWrapper() });

    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
