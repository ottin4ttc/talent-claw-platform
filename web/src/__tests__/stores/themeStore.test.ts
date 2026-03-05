import { beforeEach, describe, expect, it } from "vitest";
import { useThemeStore } from "@/stores/themeStore";

describe("themeStore", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "dark" });
  });

  it("default is dark", () => {
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("toggles theme", () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("light");
  });
});
