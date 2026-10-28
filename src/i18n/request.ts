import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { deepMergeMessages, LOCALE_COOKIE, normalizeLocale } from "~/lib/locale";

import enMessages from "../../messages/en.json";
import viMessages from "../../messages/vi.json";

const MESSAGES: Record<string, unknown> = { en: enMessages, vi: viMessages };

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = normalizeLocale(store.get(LOCALE_COOKIE)?.value);
  return {
    locale,
    messages: deepMergeMessages(enMessages, MESSAGES[locale]),
  };
});
