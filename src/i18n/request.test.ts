import { afterEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: getMock })),
}));
// The real getRequestConfig asserts RSC context, which vitest's client
// environment lacks; a passthrough keeps the cookie/merge logic under test.
vi.mock("next-intl/server", () => ({
  getRequestConfig: (fn: () => Promise<unknown>) => fn,
}));

import request from "./request";

describe("getRequestConfig", () => {
  afterEach(() => getMock.mockReset());

  it("defaults to vi when no cookie", async () => {
    getMock.mockReturnValue(undefined);
    const config = await request({ requestLocale: Promise.resolve("vi") });
    expect(config.locale).toBe("vi");
  });

  it.each(["en", "vi"])("accepts cookie value %s", async (value) => {
    getMock.mockReturnValue({ name: "NEXT_LOCALE", value });
    const config = await request({ requestLocale: Promise.resolve("vi") });
    expect(config.locale).toBe(value);
  });

  it.each(["fr", "en-US", " "])("falls back to vi for %s", async (value) => {
    getMock.mockReturnValue({ name: "NEXT_LOCALE", value });
    const config = await request({ requestLocale: Promise.resolve("vi") });
    expect(config.locale).toBe("vi");
  });

  it("returns a messages object", async () => {
    getMock.mockReturnValue({ name: "NEXT_LOCALE", value: "vi" });
    const config = await request({ requestLocale: Promise.resolve("vi") });
    const messages = config.messages as Record<string, unknown>;
    expect(typeof messages).toBe("object");
    expect(messages).not.toBeNull();
  });
});
