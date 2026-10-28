import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { createTranslator } from "./src/test/next-intl-mock";

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => createTranslator(namespace),
  useLocale: () => "vi",
}));

vi.mock("next-intl/server", () => ({
  getTranslations: (opts: { namespace?: string; locale?: string } | string) => {
    const namespace = typeof opts === "string" ? opts : (opts?.namespace ?? "");
    return createTranslator(namespace);
  },
  getMessages: async () => ({}),
  getLocale: async () => "en",
}));
