import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "./theme-toggle";

// The labels must come through the translator: every string the component
// renders is asserted as its ns.key sentinel, so a hardcoded literal fails.
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark", setTheme: vi.fn() }),
}));
vi.mock("../hooks/use-hydrated", () => ({ useHydrated: () => true }));
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `⟦${namespace}.${key}⟧`,
}));

describe("ThemeToggle", () => {
  it("labels the switch through i18n", () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "⟦header.themeSwitchToLight⟧" }),
    ).toBeTruthy();
    expect(screen.getByText("⟦header.themeLight⟧")).toBeTruthy();
  });
});
