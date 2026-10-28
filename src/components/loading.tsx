import { getTranslations } from "next-intl/server";
import styles from "./generation/workspace.module.css";

export default async function Loading() {
  const t = await getTranslations("loading");
  return (
    <section className={styles.workspace} aria-label={t("ariaRepository")}>
      <span className="sr-only" role="status">
        {t("srDiagram")}
      </span>
    </section>
  );
}
