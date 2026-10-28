"use client";

import { memo, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ChevronDown, FileText } from "lucide-react";
import { architectureLines } from "./architecture-prose";
import styles from "./generation.module.css";

export const ArchitectureNotes = memo(function ArchitectureNotes({
  text = "",
  streaming,
  initiallyExpanded = false,
}: {
  text?: string;
  streaming: boolean;
  initiallyExpanded?: boolean;
}) {
  const id = useId();
  const t = useTranslations("generation");
  const paneRef = useRef<HTMLDivElement>(null);
  const followingRef = useRef(true);
  const [following, setFollowing] = useState(true);
  const [expanded, setExpanded] = useState(initiallyExpanded);

  useEffect(() => {
    if (!streaming || !followingRef.current || !expanded) return;
    const frame = requestAnimationFrame(() => {
      const pane = paneRef.current;
      if (pane) pane.scrollTop = pane.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [text, expanded, streaming]);

  return (
    <div className={styles.notes} data-streaming={streaming && Boolean(text)}>
      <button
        type="button"
        className={styles.notesToggle}
        aria-label={t("notes.title")}
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded((value) => !value)}
      >
        <FileText size={15} aria-hidden="true" />
        <span>{t("notes.title")}</span>
        <span className={styles.notesState}>
          {text
            ? streaming
              ? t("notes.live")
              : t("notes.read")
            : t("notes.upNext")}
        </span>
        <ChevronDown size={15} className={styles.chevron} aria-hidden="true" />
      </button>
      <div id={id} hidden={!expanded}>
        {expanded && (
          <div
            ref={paneRef}
            className={styles.notesBody}
            data-testid="generation-stream"
            role="region"
            aria-label={t("notes.title")}
            tabIndex={text ? 0 : -1}
            onScroll={(event) => {
              const pane = event.currentTarget;
              const atBottom =
                pane.scrollHeight - pane.scrollTop - pane.clientHeight < 40;
              followingRef.current = atBottom;
              setFollowing(atBottom);
            }}
          >
            {text ? (
              <div className={styles.prose}>
                {architectureLines(text, styles.noteHeading)}
                {streaming && (
                  <span className={styles.cursor} aria-hidden="true" />
                )}
              </div>
            ) : (
              <div className={styles.notesEmpty}>
                <p>{t("notes.empty")}</p>
              </div>
            )}
          </div>
        )}
        {expanded && !following && streaming && (
          <button
            type="button"
            className={styles.followButton}
            onClick={() => {
              followingRef.current = true;
              setFollowing(true);
              if (paneRef.current)
                paneRef.current.scrollTop = paneRef.current.scrollHeight;
            }}
          >
            <ArrowDown size={13} aria-hidden="true" /> {t("notes.follow")}
          </button>
        )}
      </div>
    </div>
  );
});
