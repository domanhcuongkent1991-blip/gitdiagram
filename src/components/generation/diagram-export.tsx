"use client";

import { useId, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  Code2,
  Copy,
  Download,
  Image as ImageIcon,
  ImageDown,
} from "lucide-react";
import {
  exportMermaidSvgAsPng,
  withGitDiagramCredit,
} from "~/features/diagram/export";
import { readmeMarkdown, type ReadmeEmbed } from "~/features/diagram/readme";
import { captureAnalyticsEvent } from "~/lib/analytics-client";
import { TooltipProvider } from "~/components/ui/tooltip";
import { ExportAction } from "./export-action";
import styles from "./workspace.module.css";

export function DiagramExport({
  repository,
  diagram,
  getSvg,
  disabled = false,
  readme,
}: {
  /** owner/repo: both exports link back to its page. */
  repository: string;
  diagram: string;
  getSvg: () => SVGSVGElement | null;
  disabled?: boolean;
  /** Offered only for a stored public diagram. */
  readme?: { owner: string; repo: string };
}) {
  const t = useTranslations("generation.export");
  const [open, setOpen] = useState(false);
  const [pointerMotion, setPointerMotion] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const shared = (method: string) =>
    captureAnalyticsEvent("diagram_shared", {
      method,
      repository: readme ? `${readme.owner}/${readme.repo}` : null,
    });
  const copyReadme = async (kind: ReadmeEmbed) => {
    if (!readme) return;
    await navigator.clipboard.writeText(
      readmeMarkdown(readme.owner, readme.repo, kind),
    );
    shared(`readme_${kind}`);
  };

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      )
        setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setPointerMotion(false);
      setOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div className={styles.exportControl} ref={container}>
      <button
        ref={trigger}
        type="button"
        className={styles.actionButton}
        disabled={disabled}
        aria-expanded={open}
        aria-controls={id}
        onClick={(event) => {
          setPointerMotion(event.detail !== 0);
          setOpen(!open);
        }}
      >
        <Download size={13} aria-hidden="true" /> Export{" "}
        <ChevronDown size={12} aria-hidden="true" />
      </button>
      <div
        id={id}
        className={styles.exportMenu}
        role="group"
        aria-label={t("menu")}
        data-open={open}
        data-motion={pointerMotion}
        aria-hidden={!open}
        inert={!open}
      >
        <TooltipProvider delayDuration={350} skipDelayDuration={300}>
          <div className={styles.exportOptions}>
            <ExportAction
              label={t("downloadPng")}
              successLabel={t("downloaded")}
              announcement={t("pngDownloaded")}
              description={t("pngDescription")}
              errorMessage={t("downloadFailed")}
              icon={ImageDown}
              onAction={async () => {
                const svg = getSvg();
                if (!svg) throw new Error("Diagram not ready");
                await exportMermaidSvgAsPng(
                  svg,
                  getComputedStyle(document.body).backgroundColor,
                  repository,
                );
                shared("png");
              }}
            />
            <ExportAction
              label={t("copyMermaid")}
              successLabel={t("copied")}
              announcement={t("mermaidCopied")}
              description={t("mermaidDescription")}
              errorMessage={t("copyFailed")}
              icon={Copy}
              onAction={async () => {
                await navigator.clipboard.writeText(
                  withGitDiagramCredit(diagram, repository),
                );
                shared("mermaid");
              }}
            />
            {readme && (
              <>
                <ExportAction
                  label={t("readmePicture")}
                  successLabel={t("copied")}
                  announcement={t("readmePictureCopied")}
                  description={t("readmePictureDescription")}
                  errorMessage={t("copyFailed")}
                  icon={ImageIcon}
                  onAction={() => copyReadme("picture")}
                />
                <ExportAction
                  label={t("readmeBadge")}
                  successLabel={t("copied")}
                  announcement={t("readmeBadgeCopied")}
                  description={t("readmeBadgeDescription")}
                  errorMessage={t("copyFailed")}
                  icon={Code2}
                  onAction={() => copyReadme("badge")}
                />
              </>
            )}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
