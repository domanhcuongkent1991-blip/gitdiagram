import { ChevronDown } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { DiagramReadout } from "~/features/diagram/readout";
import { architectureLines } from "./architecture-prose";
import theme from "./workspace.module.css";
import styles from "./readout.module.css";

function formatDate(value: string | null, locale: string): string | null {
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time)
    ? new Date(time).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
    : null;
}

/**
 * The stored diagram as readable text under the picture: the explanation,
 * then the components and connections behind collapsed disclosures. Rendered
 * on the server, so it is in the page's HTML for search engines and agents.
 * Hidden while the stored diagram is still being drawn and after a new run on
 * the page (readout.module.css), so the first screen is unchanged.
 */
export async function RepositoryReadout({
  repository,
  readout,
  markdownPath,
}: {
  repository: string;
  readout: DiagramReadout;
  markdownPath: string;
}) {
  const t = await getTranslations("generation.readout");
  const locale = await getLocale();
  const date = formatDate(readout.lastSuccessfulAt, locale);
  return (
    <section
      className={`${theme.controlsTheme} ${styles.readout}`}
      aria-labelledby="repository-readout-title"
      data-repository-readout
    >
      <h2 id="repository-readout-title" className={styles.title}>
        {t("howWorks", { repository })}
      </h2>
      {readout.explanation && (
        <div className={styles.prose}>
          {architectureLines(readout.explanation, styles.subheading)}
        </div>
      )}
      {readout.groups.length > 0 && (
        <details className={styles.details}>
          <summary>
            {t("components")}{" "}
            <span className={styles.count}>{readout.componentCount}</span>
            <ChevronDown size={12} aria-hidden="true" />
          </summary>
          <div className={styles.detailBody}>
            {readout.groups.map((group) => (
              <div key={group.id ?? "ungrouped"} className={styles.group}>
                <h3>{group.label}</h3>
                {group.description && <p>{group.description}</p>}
                <ul>
                  {group.components.map((component) => (
                    <li key={component.id}>
                      {component.href ? (
                        <a
                          href={component.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {component.label}
                        </a>
                      ) : (
                        <strong>{component.label}</strong>
                      )}
                      {component.description && <> · {component.description}</>}
                      {component.path && (
                        <>
                          {" "}
                          <code>{component.path}</code>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}
      {readout.connections.length > 0 && (
        <details className={styles.details}>
          <summary>
            {t("connections")}{" "}
            <span className={styles.count}>{readout.connections.length}</span>
            <ChevronDown size={12} aria-hidden="true" />
          </summary>
          <div className={styles.detailBody}>
            <ul>
              {readout.connections.map((connection, index) => (
                <li key={index}>
                  <strong>{connection.from}</strong>
                  <span aria-label={t("to")}> → </span>
                  <strong>{connection.to}</strong>
                  {connection.label && <>: {connection.label}</>}
                  {connection.description && <> · {connection.description}</>}
                  {connection.evidencePath && (
                    <>
                      {" "}
                      <code>{connection.evidencePath}</code>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
      <p className={styles.meta}>
        {date
          ? t.rich("metaWithDate", {
              date,
              time: (chunks) => (
                <time dateTime={readout.lastSuccessfulAt ?? undefined}>
                  {chunks}
                </time>
              ),
            })
          : t("metaNoDate")}{" "}
        <a href={markdownPath} type="text/markdown">
          {t("readAsMarkdown")}
        </a>
      </p>
    </section>
  );
}
