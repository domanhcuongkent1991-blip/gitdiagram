import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { ExpandedActivity, GenerationActivity } from "./generation-activity";

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
        graph: { nodes: [{}, {}, {}], edges: [{}, {}] },
        explanation:
          "This paragraph is long enough to become the excerpt for the row.",
      }}
    />,
  );
  expect(screen.getByText("⟦generation.filesRead⟧")).toBeTruthy();
  expect(screen.getByText("⟦generation.architectureAnalyzed⟧")).toBeTruthy();
  expect(screen.getByText("⟦generation.graphSummary⟧")).toBeTruthy();
});

it("runs the expanded summary through i18n", () => {
  render(
    <ExpandedActivity
      state={{
        status: "graph_sent",
        graph: { nodes: [{}, {}], edges: [{}] },
      }}
    />,
  );
  expect(screen.getByText("⟦generation.info⟧")).toBeTruthy();
});
