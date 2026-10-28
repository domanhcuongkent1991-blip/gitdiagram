import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import VideosError from "./error";

// Every label must come through the translator: strings are asserted as
// their ns.key sentinel, so a hardcoded literal fails the run.
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `⟦${namespace}.${key}⟧`,
  useLocale: () => "vi",
}));

describe("VideosError", () => {
  it("runs the fallback copy through i18n", () => {
    render(<VideosError retry={() => {}} />);
    expect(screen.getByText("⟦videosPage.title⟧")).toBeTruthy();
    expect(screen.getByText("⟦videosPage.videosLoadFailed⟧")).toBeTruthy();
    expect(screen.getByText("⟦videosPage.videosLoadRetry⟧")).toBeTruthy();
    expect(screen.getByText("⟦videosPage.tryAgain⟧")).toBeTruthy();
  });
});
