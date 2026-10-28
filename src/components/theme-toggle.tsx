"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { useHydrated } from "~/hooks/use-hydrated";
import { cn } from "~/lib/utils";

interface ThemeToggleProps {
  className?: string;
  onToggle?: () => void;
}

export function ThemeToggle({ className, onToggle }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("header");
  const mounted = useHydrated();
  const baseClassName =
    "text-sm font-medium text-black transition-colors duration-150 hover:text-purple-600 dark:text-neutral-200 dark:hover:text-[hsl(var(--neo-link-hover))]";

  if (!mounted) {
    return (
      <button type="button" className={cn(baseClassName, className)}>
        {t("themeDark")}
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(isDark ? "light" : "dark");
        onToggle?.();
      }}
      aria-label={isDark ? t("themeSwitchToLight") : t("themeSwitchToDark")}
      className={cn(baseClassName, className)}
    >
      {isDark ? t("themeLight") : t("themeDark")}
    </button>
  );
}
