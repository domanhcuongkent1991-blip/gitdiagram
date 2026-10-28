"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { clock } from "~/features/admin/format";
import { nextExpiry } from "~/features/admin/presence";
import type { LiveVisitor, VideoAudience } from "~/features/admin/types";
import { number, Panel } from "./ui";

/** A next-intl translator, e.g. from useTranslations("admin.people"). */
export type PriorityTranslator = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

const HISTORY_POINTS = 600; // ten minutes, one point a second

/**
 * The moment to count people at. Counts change on their own only when a
 * background tab passes two minutes, so instead of re-rendering every second
 * this moves to the last message's arrival, or to that expiry when it comes.
 */
export function usePeopleClock(tabs: LiveVisitor[], lastMessageAt: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const now = Date.now();
    const next = nextExpiry(tabs, now);
    if (next === null) return;
    const timer = setTimeout(() => setTick(Date.now()), next - now + 50);
    return () => clearTimeout(timer);
  }, [tabs, tick]);
  return Math.max(lastMessageAt, tick);
}

function Sparkline({ points }: { points: number[] }) {
  const t = useTranslations("admin.people");
  const [hover, setHover] = useState<number | null>(null);
  const width = 600;
  const height = 72;
  if (points.length < 2)
    return (
      <div className="flex h-[72px] items-center text-xs text-[hsl(var(--neo-soft-text))]">
        {t("drawing")}
      </div>
    );
  const max = Math.max(1, ...points);
  const x = (index: number) => (index / (points.length - 1)) * width;
  const y = (value: number) => height - 4 - (value / max) * (height - 8);
  const line = points
    .map((value, index) => `${index ? "L" : "M"}${x(index)},${y(value)}`)
    .join(" ");
  const shown = hover ?? points.length - 1;
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-[72px] w-full"
        role="img"
        aria-label={t("sparkTitle", {
          seconds: points.length,
          peak: number.format(max),
        })}
        onPointerMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - box.left) / box.width;
          setHover(Math.round(ratio * (points.length - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <path
          d={`${line} L${width},${height} L0,${height} Z`}
          className="fill-purple-500/15"
        />
        <path
          d={line}
          fill="none"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          className="stroke-purple-600 dark:stroke-purple-400"
        />
        <line
          x1={x(shown)}
          x2={x(shown)}
          y1={0}
          y2={height}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          className={
            hover === null
              ? "stroke-transparent"
              : "stroke-black/40 dark:stroke-white/40"
          }
        />
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-[hsl(var(--neo-soft-text))] tabular-nums">
        <span>
          {t("minAgo", {
            minutes: Math.round(points.length / 60) || t("lessThan1"),
          })}
        </span>
        <span>
          {hover === null
            ? t("now")
            : t("sAgo", {
                seconds: points.length - 1 - hover,
                count: number.format(points[hover] ?? 0),
              })}
        </span>
      </div>
    </div>
  );
}

/** Samples the count once a second, here only, so nothing else re-renders. */
function History({ here }: { here: number }) {
  const [points, setPoints] = useState<number[]>([]);
  const latest = useRef(here);
  useEffect(() => {
    latest.current = here;
  }, [here]);
  useEffect(() => {
    const sample = setInterval(
      () =>
        setPoints((current) =>
          [...current, latest.current].slice(-HISTORY_POINTS),
        ),
      1_000,
    );
    return () => clearInterval(sample);
  }, []);
  return <Sparkline points={points} />;
}

/** What being in a priority place means, under the current audience switch. */
export function priorityHint(
  audience: VideoAudience | undefined,
  t: PriorityTranslator,
): string {
  const perks = t("perks");
  switch (audience) {
    case "priority":
      return `${t("hintPriority")} ${perks}`;
    case "desktop":
      return `${t("hintDesktop")} ${perks}`;
    case "everyone":
      return `${t("hintEveryone")} ${perks}`;
    default:
      return perks;
  }
}

export function PeoplePanel({
  people,
  tabs,
  peak,
  stats,
  audience,
}: {
  people: LiveVisitor[];
  tabs: LiveVisitor[];
  peak: { count: number; at: number } | null;
  stats: { priority: number; mismatched: number };
  /** Who may make new videos now (the live switch); unknown until read. */
  audience: VideoAudience | undefined;
}) {
  const inView = people.filter((person) => person.v === 1).length;
  const mobile = people.filter((person) => person.d === "m").length;
  const withTabOpen = new Set(tabs.map((tab) => tab.b)).size;
  const t = useTranslations("admin.people");
  return (
    <Panel
      title={t("title")}
      className="lg:col-span-3"
      aside={
        peak
          ? peak.at
            ? t("peakAt", {
                count: number.format(peak.count),
                time: clock(peak.at),
              })
            : t("peak", { count: number.format(peak.count) })
          : null
      }
    >
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div className="text-6xl leading-none font-bold tabular-nums">
          {number.format(people.length)}
        </div>
        <dl className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm sm:grid-cols-5">
          {(
            [
              [t("looking"), inView, undefined],
              [t("mobile"), mobile, undefined],
              [t("priorityPlaces"), stats.priority, priorityHint(audience, t)],
              [t("tabsOpen"), tabs.length, undefined],
              [t("mismatch"), stats.mismatched, t("mismatchTitle")],
            ] as const
          ).map(([label, value, title]) => (
            <div key={label} title={title}>
              <dt className="text-[hsl(var(--neo-soft-text))]">{label}</dt>
              <dd className="font-semibold tabular-nums">
                {number.format(value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-3 text-xs text-[hsl(var(--neo-soft-text))]">
        {t("explanation", { tabs: number.format(withTabOpen) })}
      </p>
      <div className="mt-4">
        <History here={people.length} />
      </div>
    </Panel>
  );
}
