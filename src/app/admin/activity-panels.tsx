"use client";

import { memo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  describeEvent,
  eventTopic,
  type FeedTopic,
} from "~/features/admin/events";
import { clock } from "~/features/admin/format";
import type { LiveFeedEvent, LiveJob } from "~/features/admin/types";
import { Panel, Since, TOUCH } from "./ui";

const FILTERS: Array<{ value: FeedTopic | "all"; key: string }> = [
  { value: "all", key: "all" },
  { value: "diagrams", key: "diagrams" },
  { value: "videos", key: "videos" },
];

/** Diagrams, videos and MP4s being made right now, and for how long. */
export const RunningPanel = memo(function RunningPanel({
  jobs,
}: {
  jobs: LiveJob[];
}) {
  const count = (kind: string) =>
    jobs.filter((job) => job.kind === kind).length;
  const t = useTranslations("admin.running");
  return (
    <Panel
      title={t("title")}
      className="lg:col-span-2"
      aside={t("jobsAside", {
        jobs: jobs.length,
        diagrams: count("diagram"),
        videos: count("video"),
        renders: count("render"),
      })}
    >
      {jobs.length ? (
        <ul className="flex flex-col gap-2">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex items-center justify-between gap-3 rounded-md border-2 border-black bg-white/70 px-3 py-2 text-sm dark:bg-black/20"
            >
              <span className="min-w-0 truncate">
                <span className="mr-2 text-xs font-bold uppercase">
                  {job.kind}
                </span>
                <span className="font-mono">{job.label}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                <Since ms={job.started} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[hsl(var(--neo-soft-text))]">
          {t("nothing")}
        </p>
      )}
    </Panel>
  );
});

export const LiveFeed = memo(function LiveFeed({
  events,
}: {
  events: LiveFeedEvent[];
}) {
  const [filter, setFilter] = useState<FeedTopic | "all">("all");
  const t = useTranslations("admin.feed");
  const tEvents = useTranslations("admin.events");
  const shown =
    filter === "all"
      ? events
      : events.filter((event) => eventTopic(event.kind) === filter);
  return (
    <Panel
      title={t("title")}
      aside={
        <div
          role="group"
          aria-label={t("showAbout")}
          className="flex items-center gap-1.5"
        >
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={`h-7 rounded-md border-2 border-black px-2.5 text-xs font-semibold text-[hsl(var(--foreground))] ${TOUCH} ${
                filter === option.value
                  ? "bg-purple-400 dark:bg-[hsl(var(--neo-button))] dark:text-black"
                  : "bg-white hover:bg-purple-100 dark:bg-black/20 dark:hover:bg-black/30"
              }`}
            >
              {t(option.key)}
            </button>
          ))}
        </div>
      }
    >
      {shown.length ? (
        <ol className="flex flex-col divide-y-2 divide-black/10 sm:max-h-[32rem] sm:overflow-y-auto dark:divide-white/10">
          {shown.map((event) => {
            const { title, tone, detail } = describeEvent(event, tEvents);
            const repo = typeof event.repo === "string" ? event.repo : "";
            // Phones stack each event (what and when, then the details,
            // wrapped); wider screens keep one line per event.
            return (
              <li
                key={event.id}
                className="flex flex-col gap-1 py-2.5 text-sm sm:grid sm:grid-cols-[4.5rem_10rem_1fr] sm:gap-x-3 sm:gap-y-0 sm:py-2"
              >
                <div className="flex items-baseline justify-between gap-3 sm:contents">
                  <time className="order-2 shrink-0 font-mono text-xs leading-5 text-[hsl(var(--neo-soft-text))] tabular-nums sm:order-none">
                    {clock(event.at)}
                  </time>
                  <span className={`font-semibold ${tone}`}>{title}</span>
                </div>
                {repo || detail ? (
                  <span className="min-w-0 [overflow-wrap:anywhere] sm:col-start-3 sm:truncate">
                    {repo && repo.includes("/") ? (
                      <a
                        href={`/${repo}`}
                        target="_blank"
                        rel="noreferrer"
                        className="neo-link font-mono"
                      >
                        {repo}
                      </a>
                    ) : (
                      <span className="font-mono">{repo}</span>
                    )}
                    {detail ? (
                      <span className="text-[hsl(var(--neo-soft-text))]">
                        {repo ? " · " : ""}
                        {detail}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-[hsl(var(--neo-soft-text))]">
          {filter === "all"
            ? t("waiting")
            : t("noneKind", {
                kind: filter === "diagrams" ? t("kindDiagram") : t("kindVideo"),
              })}
        </p>
      )}
    </Panel>
  );
});
