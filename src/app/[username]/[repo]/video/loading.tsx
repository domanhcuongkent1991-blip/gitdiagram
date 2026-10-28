import { getTranslations } from "next-intl/server";
import controls from "~/components/generation/workspace.module.css";
import styles from "~/components/explainer/explainer-video.module.css";

/** The watch page's own loading state; the repo one announces a diagram. */
export default async function VideoLoading() {
  const t = await getTranslations("videosPage");
  return (
    <section
      className={`${controls.workspace} ${styles.watch}`}
      aria-label={t("loadingVideo")}
    >
      <span className="sr-only" role="status">
        {t("loadingVideo")}
      </span>
    </section>
  );
}
