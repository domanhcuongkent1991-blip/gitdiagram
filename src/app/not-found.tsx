import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Page not found",
};

/**
 * Shown for addresses that match no page, most often `/owner` without a
 * repository (a GitHub profile link with the domain swapped).
 */
export default async function NotFound() {
  const t = await getTranslations("errors.notFound");
  return (
    <main className="px-4 pt-5 pb-8 sm:px-8 sm:py-10">
      <div className="neo-panel mx-auto max-w-2xl rounded-lg px-5 py-8 text-center sm:p-10">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("heading")}</h1>
        <p className="mt-4 text-base text-[hsl(var(--neo-soft-text))] dark:text-neutral-300">
          {t("body")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="neo-button inline-flex min-h-[44px] items-center rounded-md px-4 py-2 text-sm font-semibold"
          >
            {t("makeDiagram")}
          </Link>
          <Link
            href="/browse"
            className="neo-button-muted inline-flex min-h-[44px] items-center rounded-md px-4 py-2 text-sm font-semibold"
          >
            {t("browseDiagrams")}
          </Link>
        </div>
      </div>
    </main>
  );
}
