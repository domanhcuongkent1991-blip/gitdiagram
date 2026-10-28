"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, GitBranch } from "lucide-react";
import type { DiagramGraph } from "~/features/diagram/graph";
import { connectionRows, evidenceUrl } from "./connection-rows";
import notes from "./generation.module.css";
import styles from "./diagram-connections.module.css";

/**
 * Mermaid arrows are not clickable, so this list is where each arrow shows the
 * file it was read from. Arrows without a cited file say so plainly.
 */
export function DiagramConnections({
  graph,
  repository,
}: {
  graph: DiagramGraph;
  repository: string;
}) {
  const id = useId();
  const t = useTranslations("generation");
  const [expanded, setExpanded] = useState(false);
  const rows = connectionRows(graph);
  if (!rows.length) return null;
  const cited = rows.filter((row) => row.evidencePath).length;
  // Diagrams made before connections were checked have no field at all:
  // say that, instead of calling every arrow inferred.
  const unchecked = graph.edges.every(
    (edge) => edge.evidencePath === undefined,
  );
  return (
    <div className={notes.notes}>
      <button
        type="button"
        className={notes.notesToggle}
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded((value) => !value)}
      >
        <GitBranch size={15} aria-hidden="true" />
        <span>{t("connections.title")}</span>
        <span className={notes.notesState}>
          {unchecked
            ? t("connections.uncheckedCount", { count: rows.length })
            : t("connections.evidenceCount", { cited, total: rows.length })}
        </span>
        <ChevronDown size={15} className={notes.chevron} aria-hidden="true" />
      </button>
      <div id={id} hidden={!expanded}>
        {expanded && unchecked && (
          <p className={`${notes.prose} ${styles.note}`}>
            {t("connections.preCheck")}
          </p>
        )}
        {expanded && (
          <ul
            className={`${notes.notesBody} ${notes.prose} ${styles.list}`}
            aria-label={t("connections.title")}
          >
            {rows.map((row) => {
              const url = row.evidencePath
                ? evidenceUrl(repository, row.evidencePath)
                : null;
              return (
                <li key={row.key}>
                  <strong>{row.from}</strong>
                  <span aria-label={t("connections.to")}> → </span>
                  <strong>{row.to}</strong>
                  {row.label && `: ${row.label}`}
                  {row.dashed && (
                    <span className={styles.dashed}>
                      {" "}
                      {t("connections.dashed")}
                    </span>
                  )}
                  {!unchecked && (
                    <span className={styles.evidence}>
                      {" — "}
                      {row.evidencePath ? (
                        <>
                          {t("connections.evidenceLabel")}{" "}
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <code>{row.evidencePath}</code>
                            </a>
                          ) : (
                            <code>{row.evidencePath}</code>
                          )}
                        </>
                      ) : (
                        <span className={styles.unverified}>
                          {t("connections.inferred")}
                        </span>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
