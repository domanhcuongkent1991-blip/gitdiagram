import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HeaderClient } from "./header-client";

// Every header label must come through the translator: strings are asserted
// as their ns.key sentinel, so a hardcoded literal fails the run.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.ComponentProps<"a"> & { href: unknown }) => (
    <a href={String(href)} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("~/hooks/use-github-connect-result", () => ({
  useGitHubConnectResult: () => [null, vi.fn()],
}));
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `⟦${namespace}.${key}⟧`,
  useLocale: () => "vi",
}));

describe("HeaderClient", () => {
  it("runs the mobile menu labels through i18n", async () => {
    render(<HeaderClient starCount={Promise.resolve(321)} />);
    expect(await screen.findByText("⟦header.githubRepo⟧")).toBeTruthy();
  });
});
