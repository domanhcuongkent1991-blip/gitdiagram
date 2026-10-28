import { describe, expect, it } from "vitest";
import { deepMergeMessages, normalizeLocale } from "./locale";

describe("normalizeLocale", () => {
  it.each([
    [undefined, "vi"],
    ["", "vi"],
    ["fr", "vi"],
    ["VI", "vi"],
    ["en", "en"],
    ["vi", "vi"],
  ])("maps %p to %p", (input, expected) => {
    expect(normalizeLocale(input)).toBe(expected);
  });
});

describe("deepMergeMessages", () => {
  it("falls back to base when override misses a key", () => {
    const base = { home: { title: "Repository to diagram", hero: "Hero" } };
    expect(deepMergeMessages(base, { home: { title: "Sơ đồ" } })).toEqual({
      home: { title: "Sơ đồ", hero: "Hero" },
    });
  });

  it("replaces objects wholesale when types differ", () => {
    const base = { a: { b: 1 } };
    expect(deepMergeMessages(base, { a: "thay cả khối" })).toEqual({
      a: "thay cả khối",
    });
  });
});
