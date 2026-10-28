import { flag } from "./format";
import type { LiveFeedEvent } from "./types";

export type FeedTopic = "diagrams" | "videos";

// How the live feed on /admin reads each event the site sends
// (src/server/admin/live-events.ts), in plain words. The words come from the
// caller's translator (next-intl), so the feed matches the site's language.

/** A next-intl translator, e.g. from useTranslations("admin.events"). */
export type EventTranslator = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

/** Why a visitor could not make a video. */
const HELD_BACK = [
  "mobile",
  "place",
  "country",
  "audience",
  "paused",
  "daily",
  "person",
  "network",
  "voice",
  "busy",
  "attempts",
] as const;

/** What an agent asked the MCP server (/mcp) for, and how it went. */
const MCP_TOOLS = [
  "get_repository_diagram",
  "find_repository_diagrams",
  "get_explainer_video",
] as const;
const MCP_OUTCOMES = ["missing", "invalid", "limited", "error"] as const;

const FAILED = "text-red-700 dark:text-red-400";
const DONE = "text-green-700 dark:text-green-400";

export interface EventLine {
  title: string;
  /** Text colour classes. */
  tone: string;
  detail: string;
}

const joined = (parts: unknown[]) => parts.filter(Boolean).join(" · ");

export function describeEvent(
  event: LiveFeedEvent,
  t: EventTranslator,
): EventLine {
  const where = [event.city, event.region, event.country]
    .filter((part) => typeof part === "string" && part)
    .join(", ");
  const place = where ? `${flag(String(event.country ?? ""))} ${where}` : "";
  const seconds =
    typeof event.ms === "number" ? `${(event.ms / 1000).toFixed(1)}s` : "";
  const cost =
    typeof event.costUsd === "number" ? `$${event.costUsd.toFixed(3)}` : "";
  const outcome = String(event.outcome ?? "");
  const failed = outcome === "error" || outcome === "lost";
  switch (event.kind) {
    case "diagram.started":
      return {
        title: t("kinds.diagramStarted"),
        tone: "text-sky-700 dark:text-sky-300",
        detail: joined([place, event.ownKey ? t("ownKey") : ""]),
      };
    case "diagram.finished":
      return {
        title:
          outcome === "complete"
            ? t("kinds.diagramMade")
            : outcome === "cancelled"
              ? t("kinds.diagramCancelled")
              : t("kinds.diagramFailed"),
        tone: failed ? FAILED : DONE,
        detail: joined([
          seconds,
          cost,
          failed ? String(event.errorCode ?? "") : "",
        ]),
      };
    case "video.started":
      return {
        title: event.bought
          ? t("kinds.paidVideoStarted")
          : t("kinds.videoStarted"),
        tone: "text-purple-700 dark:text-purple-300",
        detail: joined([place, event.operator ? t("you") : ""]),
      };
    case "video.checkout":
      return {
        title: t("kinds.checkoutOpened"),
        tone: "text-emerald-700 dark:text-emerald-300",
        detail: place,
      };
    case "video.finished":
      return {
        // "lost": its server was killed mid-run (see run-journal.ts).
        title:
          outcome === "lost"
            ? t("kinds.videoLost")
            : failed
              ? t("kinds.videoFailed")
              : t("kinds.videoMade"),
        tone: failed ? FAILED : DONE,
        detail: joined([seconds, outcome === "lost" ? t("lost") : ""]),
      };
    case "video.gated": {
      const reason = String(event.reason ?? "");
      const known = HELD_BACK.find((key) => key === reason);
      return {
        title: t("kinds.videoHeldBack"),
        tone: "text-amber-700 dark:text-amber-300",
        detail: joined([
          known ? t(`heldBack.${reason}`) : reason,
          event.step === "start" ? t("afterPressing") : "",
          place,
          String(event.device ?? ""),
        ]),
      };
    }
    case "video.feedback":
      return {
        title: t("kinds.videoFeedback"),
        tone: "text-pink-700 dark:text-pink-300",
        detail: joined([place, String(event.note ?? "")]),
      };
    case "render.started":
      return {
        title: t("kinds.mp4Started"),
        tone: "text-purple-700 dark:text-purple-300",
        detail: String(event.format ?? ""),
      };
    case "render.finished":
      return {
        title:
          outcome === "lost"
            ? t("kinds.mp4Lost")
            : failed
              ? t("kinds.mp4Failed")
              : t("kinds.mp4Made"),
        tone: failed ? FAILED : DONE,
        detail: joined([
          String(event.format ?? ""),
          seconds,
          outcome === "lost" ? t("lost") : "",
        ]),
      };
    case "limits.reset":
      return {
        title: t("kinds.countReset"),
        tone: "text-[hsl(var(--foreground))]",
        // `cleared`: how many the public had started today before the reset.
        detail: t("kinds.limitsReset", {
          target: t(event.target === "renders" ? "kinds.mp4s" : "kinds.videos"),
          cleared: String(event.cleared ?? 0),
        }),
      };
    case "control.changed":
      return {
        title: t("kinds.settingChanged"),
        tone: "text-[hsl(var(--foreground))]",
        detail: JSON.stringify(event.changes ?? {})
          .replace(/[{}"]/g, "")
          .replace(/,/g, ", "),
      };
    case "mcp.call": {
      const tool = String(event.tool ?? "");
      const knownTool = MCP_TOOLS.find((key) => key === tool);
      const knownOutcome = MCP_OUTCOMES.find((key) => key === outcome);
      return {
        title: t("kinds.mcpCall"),
        tone:
          outcome === "limited" || outcome === "error"
            ? FAILED
            : "text-teal-700 dark:text-teal-300",
        detail: joined([
          knownTool ? t(`mcpTools.${tool}`) : tool,
          knownOutcome ? t(`mcpOutcomes.${outcome}`) : outcome,
          String(event.client ?? ""),
          place,
        ]),
      };
    }
    case "admin.signed_in":
      return { title: t("kinds.youSignedIn"), tone: "", detail: place };
    case "admin.signed_out_everywhere":
      return {
        title: t("kinds.signedOutEverywhere"),
        tone: "",
        detail: place,
      };
    case "admin.sign_in_failed":
      return {
        title: t("kinds.failedSignIn"),
        tone: FAILED,
        detail: joined([place, event.via === "bearer" ? t("apiToken") : ""]),
      };
    default:
      return {
        title: String(event.kind ?? "Event"),
        tone: "",
        detail: String(event.note ?? ""),
      };
  }
}

/**
 * Events that move a counter the dashboard polls, so it re-reads soon. Not a
 * visitor held back (nothing was counted), nor a switch flipped (only the
 * operator does that, and the dashboard re-reads after each change).
 */
export function movesCounters(kind: string): boolean {
  return /^(video\.(started|finished)|render\.|diagram\.finished|limits\.|mcp\.)/.test(
    kind,
  );
}

export function eventTopic(kind: string): FeedTopic | null {
  if (/^(diagram|diagrams)\./.test(kind)) return "diagrams";
  if (/^(video|render|checkout|limits)\./.test(kind)) return "videos";
  return null;
}
