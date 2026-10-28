"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Download,
  Image as ImageIcon,
  Link2,
  Share2,
  Smartphone,
  Code2,
  MessageSquareHeart,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  renderFileUrl,
  streamExplainerRender,
  VideoRequestError,
  watchPath,
  type RenderFormat,
} from "~/features/explainer/api";
import type {
  VideoArtifact,
  VideoRenderStep,
} from "~/features/explainer/types";
import { useCanSendFeedback } from "~/features/explainer/feedback";
import { captureVideoEvent } from "~/features/explainer/watch-analytics";
import controls from "~/components/generation/workspace.module.css";
import { SITE_URL } from "~/lib/site";
import { JobRow } from "./explainer-progress";
import styles from "./explainer-video.module.css";
import feedbackStyles from "./video-feedback.module.css";
import { VideoFeedbackForm } from "./video-feedback";

type Copied = "link" | "badge" | "picture" | null;

// Local failures are stored as message keys; a server failure keeps its text.
const RENDER_FAILED = "renderFailed";
const COPY_BLOCKED = "copyBlocked";

function jobLabel(
  t: ReturnType<typeof useTranslations>,
  format: RenderFormat,
  step: VideoRenderStep,
) {
  if (step === "starting") return t("share.starting");
  if (step === "finishing") return t("share.finishing");
  return t("share.rendering", {
    ratio: format === "vertical" ? "9:16" : "16:9",
  });
}

function triggerDownload(href: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = "";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Everything a viewer needs to pass a video on: the MP4 for feeds (landscape
 * and 9:16, captions burned in), the watch link, the phone's share sheet, and
 * a README badge or picture. People in the priority places can also send
 * feedback on it.
 */
export function ExplainerShare({
  video,
  position,
}: {
  video: VideoArtifact;
  /** How far into the film the viewer is, in seconds. */
  position?: () => number;
}) {
  const { owner, repo } = video.meta;
  const t = useTranslations("explainer");
  const jobLabelT = (format: RenderFormat, step: VideoRenderStep) =>
    jobLabel(t, format, step);
  const [job, setJob] = useState<{
    format: RenderFormat;
    progress: number;
    step: VideoRenderStep;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The video was replaced after this page loaded; its MP4 is no longer made.
  const [stale, setStale] = useState(false);
  const [copied, setCopied] = useState<Copied>(null);
  const canFeedback = useCanSendFeedback();
  const [feedback, setFeedback] = useState(false);
  const render = useRef<AbortController | null>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  // Copied links point at the live site, even from a preview or localhost.
  const url = `${SITE_URL}${watchPath(owner, repo)}`;
  const canShare = typeof navigator.share === "function";

  // Leaving the video stops waiting for its MP4 (and its download).
  useEffect(
    () => () => {
      render.current?.abort();
      window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const download = async (format: RenderFormat) => {
    captureVideoEvent("video_shared", video, { method: `mp4_${format}` });
    const controller = new AbortController();
    render.current = controller;
    setError(null);
    setJob({ format, progress: 0, step: "starting" });
    let finished = false;
    try {
      await streamExplainerRender(
        owner,
        repo,
        format,
        video.createdAt,
        (event) => {
          if (event.status === "rendering")
            setJob({
              format,
              progress: event.progress,
              step: event.step ?? "rendering",
            });
          else if (event.status === "complete") finished = true;
          else throw new Error(event.error);
        },
        controller.signal,
      );
      if (!finished) throw new Error(RENDER_FAILED);
      if (!controller.signal.aborted)
        triggerDownload(renderFileUrl(video, format));
    } catch (caught) {
      if (controller.signal.aborted) return;
      if (caught instanceof VideoRequestError && caught.stale) setStale(true);
      else setError(caught instanceof Error ? caught.message : RENDER_FAILED);
    } finally {
      if (!controller.signal.aborted) setJob(null);
      if (render.current === controller) render.current = null;
    }
  };

  const copy = async (text: string, what: Exclude<Copied, null>) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      captureVideoEvent("video_shared", video, { method: what });
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setError(COPY_BLOCKED);
    }
  };

  const badge = `[![Watch a one-minute video tour of ${repo}](${SITE_URL}/video-badge.svg)](${url})`;
  // The latest video's poster (a play button on the title card), so the
  // picture stays right when the video is made again.
  const poster = `${SITE_URL}/api/video/file?${new URLSearchParams({ username: owner, repo, format: "poster" }).toString()}`;
  const picture = `[![${owner}/${repo}, explained in a one-minute video](${poster})](${url})`;
  const label = (format: RenderFormat, idle: string) =>
    job?.format === format ? t("share.makingMp4") : idle;

  return (
    <div className={styles.share}>
      <div className={styles.shareRow}>
        <button
          type="button"
          className={`${controls.actionButton} ${controls.primary}`}
          onClick={() => void download("landscape")}
          disabled={job !== null || stale}
        >
          <Download size={15} aria-hidden="true" />
          {label("landscape", t("share.download"))}
        </button>
        <button
          type="button"
          className={controls.actionButton}
          onClick={() => void download("vertical")}
          disabled={job !== null || stale}
          title={t("share.verticalTitle")}
        >
          <Smartphone size={15} aria-hidden="true" />
          {label("vertical", t("share.vertical"))}
        </button>
        {canShare ? (
          <button
            type="button"
            className={controls.actionButton}
            onClick={() =>
              void navigator
                .share({
                  title: `${owner}/${repo}, explained in a minute`,
                  url,
                })
                .then(() =>
                  captureVideoEvent("video_shared", video, {
                    method: "native",
                  }),
                )
                .catch(() => undefined)
            }
          >
            <Share2 size={15} aria-hidden="true" />
            {t("share.share")}
          </button>
        ) : (
          <button
            type="button"
            className={controls.actionButton}
            onClick={() => void copy(url, "link")}
          >
            {copied === "link" ? (
              <Check size={15} aria-hidden="true" />
            ) : (
              <Link2 size={15} aria-hidden="true" />
            )}
            {copied === "link" ? t("share.linkCopied") : t("share.copyLink")}
          </button>
        )}
        <button
          type="button"
          className={controls.actionButton}
          onClick={() => void copy(badge, "badge")}
          title={t("share.badgeTitle")}
        >
          {copied === "badge" ? (
            <Check size={15} aria-hidden="true" />
          ) : (
            <Code2 size={15} aria-hidden="true" />
          )}
          {copied === "badge" ? t("share.badgeCopied") : t("share.readmeBadge")}
        </button>
        <button
          type="button"
          className={controls.actionButton}
          onClick={() => void copy(picture, "picture")}
          title={t("share.pictureTitle")}
        >
          {copied === "picture" ? (
            <Check size={15} aria-hidden="true" />
          ) : (
            <ImageIcon size={15} aria-hidden="true" />
          )}
          {copied === "picture"
            ? t("share.pictureCopied")
            : t("share.readmePicture")}
        </button>
        {canFeedback && (
          <button
            type="button"
            className={`${controls.actionButton} ${feedbackStyles.button}`}
            onClick={() => setFeedback((value) => !value)}
            aria-expanded={feedback}
          >
            <MessageSquareHeart size={15} aria-hidden="true" />
            {t("share.sendFeedback")}
          </button>
        )}
      </div>
      {feedback && (
        <VideoFeedbackForm
          username={owner}
          repo={repo}
          position={position}
          onClose={() => setFeedback(false)}
        />
      )}
      {/* Announces each step once; the percentage beside it is not read out. */}
      <span className="sr-only" role="status">
        {job ? jobLabelT(job.format, job.step) : ""}
      </span>
      {job && (
        <div className={styles.shareJob}>
          <JobRow
            label={jobLabelT(job.format, job.step)}
            fraction={job.progress}
          />
          <div className={styles.shareNote}>{t("share.firstDownload")}</div>
        </div>
      )}
      {stale ? (
        <div className={styles.error} role="alert">
          {t("share.stale")}{" "}
          <button
            type="button"
            className={styles.metaButton}
            onClick={() => window.location.reload()}
          >
            {t("share.reloadNew")}
          </button>
        </div>
      ) : (
        error && (
          <div className={styles.error} role="alert">
            {error === "renderFailed"
              ? t("share.renderFailed")
              : error === "copyBlocked"
                ? t("share.copyBlocked")
                : error}
          </div>
        )
      )}
    </div>
  );
}
