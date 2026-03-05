import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createTestWrapper } from "@/__tests__/helpers/test-utils";
import { useTopup, useWallet } from "@/hooks/useWallet";

describe("useWallet", () => {
  it("reads current balance", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.balance).toBe(1000);
  });
});

describe("useTopup", () => {
  it("topup updates balance", async () => {
    const { result } = renderHook(() => useTopup(), {
      wrapper: createTestWrapper(),
    });

    act(() => {
      result.current.mutate({ amount: 100 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.balance).toBe(1100);
  });
});
