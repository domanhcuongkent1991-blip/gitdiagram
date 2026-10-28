import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

afterEach(cleanup);

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

vi.mock("next-intl", () => ({
  useLocale: () => {
    const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/);
    return match?.[1] === "en" ? "en" : "vi";
  },
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));

import { LocaleSwitcher } from "./locale-switcher";

beforeEach(() => {
  refresh.mockClear();
  document.cookie = "NEXT_LOCALE=vi; path=/";
});

test("shows the target language label while in Vietnamese", () => {
  render(<LocaleSwitcher />);
  const button = screen.getByRole("button", { name: /header.switchLanguage/ });
  expect(button).toHaveTextContent("EN");
});

test("clicking switches the cookie to en and refreshes", async () => {
  render(<LocaleSwitcher />);
  fireEvent.click(
    screen.getByRole("button", { name: /header.switchLanguage/ }),
  );
  expect(document.cookie).toContain("NEXT_LOCALE=en");
  expect(refresh).toHaveBeenCalledTimes(1);
});

test("shows VI while in English and switches back", async () => {
  document.cookie = "NEXT_LOCALE=en; path=/";
  render(<LocaleSwitcher />);
  const button = screen.getByRole("button", { name: /header.switchLanguage/ });
  expect(button).toHaveTextContent("VI");
  fireEvent.click(button);
  expect(document.cookie).toContain("NEXT_LOCALE=vi");
  expect(refresh).toHaveBeenCalledTimes(1);
});
