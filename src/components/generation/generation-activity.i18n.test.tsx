import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { GenerationActivity } from "./generation-activity";

// Separate file with a sentinel translator: every label must come through
// useTranslations, so a hardcoded literal fails the run.
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `⟦${namespace}.${key}⟧`,
  useLocale: () => "vi",
}));

afterEach(cleanup);

it("runs the activity rows through i18n", () => {
  render(
    <GenerationActivity
      state={{
        status: "graph_sent",
        sourceFileCount: 5,
        explanation:
          "This paragraph is long enough to become the excerpt for the row.",
      }}
    />,
  );
  expect(screen.getByText("⟦generation.filesRead⟧")).toBeTruthy();
  expect(screen.getByText("⟦generation.architectureAnalyzed⟧")).toBeTruthy();
});
