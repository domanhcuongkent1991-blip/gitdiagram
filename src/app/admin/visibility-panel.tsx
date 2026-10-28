"use client";

import { useCallback, useEffect, useState } from "react";

import {
  AI_AGENT_FAMILIES,
  AI_VARIANT_LABELS,
  AI_VARIANTS,
  type AgentFetchDay,
  type AiAnswer,
  type AiVariant,
  type AiVisibilitySummary,
  percent,
  type VisibilityReport,
} from "~/features/admin/visibility";
import { useTranslations } from "next-intl";
import { BarList, number, Panel, Tile, TOUCH } from "./ui";

// How visible GitDiagram is to AI assistants and crawlers. Read once when the
// dashboard opens (and on Refresh): it changes once a day, so it is not part
// of the 5-second poll.

const SOFT = "text-[hsl(var(--neo-soft-text))]";

const MARKS: Record<string, { symbol: string; labelKey: string }> = {
  "2": { symbol: "●", labelKey: "markNamedLinked" },
  "1": { symbol: "◐", labelKey: "markNamed" },
  "0": { symbol: "·", labelKey: "markUnnamed" },
  "-": { symbol: "–", labelKey: "markFailed" },
};

function rate(summary: AiVisibilitySummary | undefined, variant: AiVariant) {
  const stats = summary?.variants[variant];
  return stats && stats.answered ? stats.mentioned / stats.answered : null;
}

/** Mention rate over the days shown, oldest on the left. */
function Trend({
  summaries,
  variant,
}: {
  summaries: AiVisibilitySummary[];
  variant: AiVariant;
}) {
  const points = summaries
    .slice()
    .reverse()
    .map((summary) => rate(summary, variant) ?? 0);
  const t = useTranslations("admin.visibility");
  if (points.length < 2)
    return <span className={`text-xs ${SOFT}`}>{t("lineAfterTwo")}</span>;
  const width = 120;
  const height = 24;
  const x = (index: number) => (index / (points.length - 1)) * width;
  const y = (value: number) => height - 2 - value * (height - 4);
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-6 w-28"
      role="img"
      aria-label={t("runsAria", {
        variant: AI_VARIANT_LABELS[variant],
        count: points.length,
      })}
    >
      <path
        d={points
          .map((value, index) => `${index ? "L" : "M"}${x(index)},${y(value)}`)
          .join(" ")}
        fill="none"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        className="stroke-purple-600 dark:stroke-purple-400"
      />
    </svg>
  );
}

function VariantTiles({ summaries }: { summaries: AiVisibilitySummary[] }) {
  const [today, previous] = summaries;
  const t = useTranslations("admin.visibility");
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {AI_VARIANTS.map((variant) => {
        const stats = today?.variants[variant];
        const before = rate(previous, variant);
        return (
          <Tile
            key={variant}
            label={AI_VARIANT_LABELS[variant]}
            value={stats ? percent(stats.mentioned, stats.answered) : "–"}
            meter={rate(today, variant)}
            sub={
              stats ? (
                <>
                  {t("namedIn", {
                    mentioned: stats.mentioned,
                    answered: stats.answered,
                    cited: stats.cited,
                  })}
                  {stats.mentioned
                    ? t("avgPlace", {
                        position: (stats.positionSum / stats.mentioned).toFixed(
                          1,
                        ),
                      })
                    : ""}
                  {before !== null
                    ? t("before", { percent: Math.round(before * 100) })
                    : ""}
                </>
              ) : (
                t("noRunYet")
              )
            }
          />
        );
      })}
    </div>
  );
}

function TrendTable({ summaries }: { summaries: AiVisibilitySummary[] }) {
  const week = summaries.slice(0, 7);
  const t = useTranslations("admin.visibility");
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className={`text-left text-xs ${SOFT}`}>
          <th className="py-1 font-semibold">{t("assistant")}</th>
          <th className="py-1 font-semibold">
            {t("runs", { count: summaries.length })}
          </th>
          <th className="py-1 text-right font-semibold">{t("week")}</th>
        </tr>
      </thead>
      <tbody>
        {AI_VARIANTS.map((variant) => {
          const named = week.reduce(
            (sum, s) => sum + s.variants[variant].mentioned,
            0,
          );
          const answered = week.reduce(
            (sum, s) => sum + s.variants[variant].answered,
            0,
          );
          return (
            <tr key={variant} className="border-t-2 border-black/10">
              <td className="py-1.5 pr-2">{AI_VARIANT_LABELS[variant]}</td>
              <td className="py-1.5 pr-2">
                <Trend summaries={summaries} variant={variant} />
              </td>
              <td className="py-1.5 text-right font-semibold tabular-nums">
                {percent(named, answered)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function AnswerText({ answer }: { answer: AiAnswer }) {
  const t = useTranslations("admin.visibility");
  return (
    <div className="rounded-md border-2 border-black bg-white/70 p-3 dark:bg-black/20">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-xs font-semibold">
        <span>{AI_VARIANT_LABELS[answer.variant]}</span>
        <span className={`${SOFT} tabular-nums`}>
          {answer.error
            ? answer.error
            : `${answer.mentioned ? t("position", { position: answer.position ?? "?" }) : t("noGitDiagram")}${answer.inSources ? t("inSources") : ""} · $${answer.costUsd.toFixed(3)}`}
        </span>
      </div>
      {answer.text ? (
        <p className="max-h-72 overflow-y-auto text-[13px] leading-5 whitespace-pre-wrap">
          {answer.text}
        </p>
      ) : null}
      {answer.citations.length ? (
        <p className={`mt-2 text-xs [overflow-wrap:anywhere] ${SOFT}`}>
          {t("cites", { list: answer.citations.join(" · ") })}
        </p>
      ) : null}
    </div>
  );
}

/** Each question with a mark per assistant; open one to read the answers. */
function Questions({
  summary,
  answers,
}: {
  summary: AiVisibilitySummary;
  answers: AiAnswer[];
}) {
  const t = useTranslations("admin.visibility");
  return (
    <ul className="flex flex-col divide-y-2 divide-black/10 dark:divide-white/10">
      {summary.prompts.map((id, index) => {
        const theirs = answers.filter((answer) => answer.promptId === id);
        return (
          <li key={id}>
            <details className="group py-1.5">
              <summary className="flex cursor-pointer list-none items-center gap-3 text-sm pointer-coarse:min-h-11">
                <span className="flex shrink-0 gap-1 font-mono">
                  {AI_VARIANTS.map((variant) => {
                    const mark = MARKS[summary.marks[variant][index] ?? "-"]!;
                    return (
                      <span
                        key={variant}
                        title={`${AI_VARIANT_LABELS[variant]}: ${t(mark.labelKey)}`}
                        className="w-3 text-center"
                      >
                        {mark.symbol}
                      </span>
                    );
                  })}
                </span>
                <span className="min-w-0 flex-1 truncate group-open:whitespace-normal">
                  {theirs[0]?.prompt ?? id}
                </span>
              </summary>
              <div className="mt-2 grid gap-2 lg:grid-cols-2">
                {theirs.map((answer) => (
                  <AnswerText key={answer.variant} answer={answer} />
                ))}
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

/** Fetches by bot family over the days read, AI agents first. */
function agentRows(days: AgentFetchDay[]) {
  const totals = new Map<string, number>();
  for (const day of days)
    for (const [family, count] of Object.entries(day.families))
      totals.set(family, (totals.get(family) ?? 0) + count);
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  return {
    ai: sorted.filter(([family]) => AI_AGENT_FAMILIES.has(family)),
    other: sorted.filter(([family]) => !AI_AGENT_FAMILIES.has(family)),
  };
}

function Crawlers({ days }: { days: AgentFetchDay[] | null }) {
  const t = useTranslations("admin.visibility");
  if (!days)
    return <p className={`text-sm ${SOFT}`}>{t("countsUnreadable")}</p>;
  const { ai, other } = agentRows(days);
  const today = Object.values(days[0]?.families ?? {}).reduce(
    (sum, count) => sum + count,
    0,
  );
  return (
    <div className="flex flex-col gap-3">
      <p className={`text-xs ${SOFT}`}>
        {t("todayCount", { count: number.format(today) })}
      </p>
      <div>
        <h3 className="mb-1.5 text-xs font-bold uppercase">{t("aiAgents")}</h3>
        {ai.length ? (
          <BarList rows={ai} />
        ) : (
          <p className={`text-sm ${SOFT}`}>{t("noneYet")}</p>
        )}
      </div>
      <div>
        <h3 className="mb-1.5 text-xs font-bold uppercase">
          {t("searchEngines")}
        </h3>
        {other.length ? (
          <BarList rows={other} />
        ) : (
          <p className={`text-sm ${SOFT}`}>{t("noneYet")}</p>
        )}
      </div>
    </div>
  );
}

export function VisibilityPanel() {
  const [report, setReport] = useState<VisibilityReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("admin.visibility");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/visibility", {
        cache: "no-store",
      });
      const body = (await response.json().catch(() => null)) as
        (VisibilityReport & { error?: string }) | null;
      if (!response.ok || !body || !Array.isArray(body.summaries))
        throw new Error(body?.error ?? t("loadFailed"));
      setReport(body);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const latest = report?.summaries[0];
  return (
    <Panel
      title={t("title")}
      aside={
        <span className="flex items-center gap-2">
          {latest
            ? t("asked", {
                date: latest.date,
                openai: latest.models.openai,
                anthropic: latest.models.anthropic,
                cost: latest.costUsd.toFixed(2),
              })
            : t("askedDaily")}
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className={`neo-button-muted h-7 rounded-md px-2 text-xs font-semibold ${TOUCH}`}
          >
            {t("refresh")}
          </button>
        </span>
      }
    >
      {error ? (
        <p role="alert" className="mb-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-5">
        <div>
          <p className={`mb-2 text-xs ${SOFT}`}>{t("intro")}</p>
          <VariantTiles summaries={report?.summaries ?? []} />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="mb-1.5 text-xs font-bold uppercase">{t("trend")}</h3>
            <TrendTable summaries={report?.summaries ?? []} />
          </div>
          <div>
            <h3 className="mb-1.5 text-xs font-bold uppercase">
              {t("otherTools")}
            </h3>
            <BarList rows={latest?.competitors.slice(0, 10) ?? []} />
          </div>
        </div>
        {latest && report?.latest?.date === latest.date ? (
          <div>
            <h3 className="mb-1.5 text-xs font-bold uppercase">
              {t("questions")}
            </h3>
            <Questions summary={latest} answers={report.latest.answers} />
          </div>
        ) : null}
        <div>
          <h3 className="mb-1.5 text-xs font-bold uppercase">
            {t("crawlersHeading")}
          </h3>
          <Crawlers days={report ? report.agents : []} />
        </div>
      </div>
    </Panel>
  );
}
