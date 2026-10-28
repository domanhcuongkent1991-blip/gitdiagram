export type Locale = "vi" | "en";

export const DEFAULT_LOCALE: Locale = "vi";

export const LOCALES: readonly Locale[] = ["vi", "en"];

export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Persist the locale choice for a year; client-side only. */
export function setLocaleCookie(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=strict`;
}

/** Map a raw cookie value to a supported locale; anything unknown falls back to vi. */
export function normalizeLocale(value: string | undefined | null): Locale {
  const trimmed = value?.trim().toLowerCase();
  return trimmed === "en" || trimmed === "vi" ? trimmed : DEFAULT_LOCALE;
}

/**
 * Merge locale messages over the EN base so a missing translation key still
 * renders the English string instead of a bare message key. Non-plain-object
 * values (strings, arrays, null) replace the base wholesale.
 */
export function deepMergeMessages<T>(base: T, override: unknown): T {
  if (
    base === null ||
    typeof base !== "object" ||
    Array.isArray(base) ||
    override === null ||
    typeof override !== "object" ||
    Array.isArray(override)
  ) {
    return (override === undefined ? base : override) as T;
  }

  const result: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };
  for (const [key, value] of Object.entries(override)) {
    result[key] =
      key in result
        ? deepMergeMessages(result[key], value)
        : value;
  }
  return result as T;
}
