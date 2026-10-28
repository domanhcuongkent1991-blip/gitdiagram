import { useTranslations } from "next-intl";

/** Marks something new: the explainer videos, while they are fresh. */
export function NewBadge({ className = "" }: { className?: string }) {
  const t = useTranslations("header");
  return <span className={`new-badge ${className}`}>{t("newBadge")}</span>;
}
