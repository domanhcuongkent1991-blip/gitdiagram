"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, setLocaleCookie, type Locale } from "~/lib/locale";

export function LocaleSwitcher({
  className = "text-sm font-medium text-black transition-colors duration-150 hover:text-purple-600 dark:text-neutral-200 dark:hover:text-[hsl(var(--neo-link-hover))]",
  onToggle,
}: {
  className?: string;
  onToggle?: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("header");
  const router = useRouter();

  const target: Locale = locale === "vi" ? "en" : "vi";

  const switchLocale = () => {
    setLocaleCookie(target);
    onToggle?.();
    router.refresh();
  };

  return (
    <button
      type="button"
      aria-label={t("switchLanguage")}
      title={t("switchLanguage")}
      onClick={switchLocale}
      className={className}
    >
      {target === "en" ? "EN" : "VI"}
    </button>
  );
}

export { LOCALE_COOKIE };
