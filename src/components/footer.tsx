import Link from "next/link";
import { getTranslations } from "next-intl/server";

export function Footer() {
  return (
    <footer className="mt-auto border-black pt-4 pb-9 sm:border-t-[3px] sm:py-4 lg:px-8 dark:border-black">
      <div className="container mx-auto flex h-8 max-w-4xl items-center justify-center">
        <span className="text-base font-medium text-black sm:text-sm dark:text-neutral-100">
          <FooterContents />
        </span>
      </div>
    </footer>
  );
}

async function FooterContents() {
  const t = await getTranslations("footer");
  return (
    <>
      {t("madeBy")}{" "}
      <Link
        href="https://ahmedkhaleel.com"
        target="_blank"
        rel="noopener noreferrer"
        className="neo-link hover:underline"
      >
        Ahmed Khaleel
      </Link>
      <span className="mx-2 text-black dark:text-neutral-100">/</span>
      <Link href="/advertise" className="neo-link hover:underline">
        {t("advertise")}
      </Link>
    </>
  );
}
