"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { formatCompact } from "~/lib/format";
import type { AdminState, ClaudeCredit } from "~/features/admin/types";
import { ConfirmButton } from "./confirm-dialog";
import { Since, Tile } from "./ui";

/** A next-intl translator, e.g. from useTranslations("admin.budget"). */
type BudgetTranslator = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

// Today's budgets and the balances behind them, with the two actions they
// offer: starting a count over and recording the Claude balance.

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/**
 * Posts an action. Resolves to the error to show, or null and the answer.
 * Signed out meanwhile: back to the sign-in form.
 */
async function post<T = unknown>(
  path: string,
  body: unknown,
  fallback: string,
): Promise<{ error: string; answer?: undefined } | { error: null; answer: T }> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (response?.status === 401) {
    window.location.reload();
    return { error: "signed-out" };
  }
  const parsed = (await response?.json().catch(() => null)) as
    (T & { error?: string }) | null;
  if (response?.ok) return { error: null, answer: parsed as T };
  return { error: parsed?.error ?? fallback };
}

/**
 * Starts today's count over for everyone, after the operator confirms in a
 * dialog. Nothing changes until "Yes, reset" is pressed.
 */
function ResetUsage({
  target,
  used,
  onDone,
}: {
  target: "videos" | "renders";
  used: number;
  onDone: () => void;
}) {
  const t = useTranslations("admin.budget");
  const tc = useTranslations("admin.common");
  const noun = target === "videos" ? t("nounVideos") : t("nounMp4s");
  const counted =
    used === 1 ? (target === "videos" ? t("oneVideo") : t("oneMp4")) : noun;
  return (
    <ConfirmButton
      label={t("resetButton")}
      ariaLabel={t("resetAria", {
        target: target === "videos" ? t("targetVideo") : t("targetMp4"),
      })}
      title={t("resetTitle", { noun })}
      description={t("resetDescription", { used, counted, noun })}
      confirmLabel={tc("yesReset")}
      busyLabel={tc("resetting")}
      onConfirm={async () => {
        const { error } = await post(
          "/api/admin/reset",
          { target },
          t("resetFailed"),
        );
        return error === "signed-out" ? t("signedOut") : error;
      }}
      onDone={onDone}
    />
  );
}

/**
 * Records the Claude credit balance the Console shows, after a top-up. The
 * dashboard then counts down from it using the organization's spend since.
 */
function SetClaudeCredit({
  onSaved,
}: {
  onSaved: (credit: ClaudeCredit) => void;
}) {
  const t = useTranslations("admin.budget");
  const [value, setValue] = useState("");
  const usd = Number(value.replace(/[$,\s]/g, ""));
  const valid = value.trim() !== "" && Number.isFinite(usd) && usd >= 0;
  return (
    <ConfirmButton
      label={t("updateBalance")}
      ariaLabel={t("updateAria")}
      title={t("updateTitle")}
      description={t.rich("updateDescription", {
        link: (chunks) => (
          <a
            href="https://platform.cloudflare.com/settings/billing"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {chunks}
          </a>
        ),
      })}
      confirmLabel={t("saveBalance")}
      busyLabel={t("savingBalance")}
      canConfirm={valid}
      onConfirm={async () => {
        const { error, answer } = await post<{ credit?: ClaudeCredit }>(
          "/api/admin/claude-credit",
          { usd },
          t("balanceSaveFailed"),
        );
        if (answer?.credit) onSaved(answer.credit);
        return error === "signed-out" ? t("signedOut") : error;
      }}
      onDone={() => setValue("")}
    >
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {t("balanceLabel")}
        <input
          inputMode="decimal"
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="50.46"
          className="h-11 rounded-md border-2 border-black bg-white px-3 text-base font-normal text-black tabular-nums"
        />
      </label>
    </ConfirmButton>
  );
}

/**
 * How the pipeline did on Cloudflare: "Last 2 days: 41 made · 2 failed · 0
 * lost". Lost means the server was killed mid-run (run-journal.ts); the
 * operator's own runs count too, so it can exceed the budget's numbers.
 */
function healthLine(
  health: NonNullable<AdminState["videoHealth"]>["generate"] | undefined,
  t: BudgetTranslator,
): string | null {
  if (!health) return null;
  return t("healthLine", {
    complete: health.complete,
    error: health.error,
    lost: health.lost,
  });
}

export function BudgetTiles({
  state,
  onChanged,
  onCredit,
}: {
  state: AdminState | null;
  onChanged: () => void;
  /** A Claude balance was just saved: show it without waiting for a read. */
  onCredit: (credit: ClaudeCredit) => void;
}) {
  const video = state?.video;
  const t = useTranslations("admin.budget");
  const videosHealth = healthLine(state?.videoHealth?.generate, t);
  const rendersHealth = healthLine(state?.videoHealth?.render, t);
  const quota = state?.diagramQuota;
  const mcp = state?.mcp;
  const credit =
    typeof state?.claudeCredit === "object" ? state.claudeCredit : null;
  const creditSet = credit?.setUsd != null && credit.setAt != null;
  return (
    <div className="grid grid-cols-2 gap-3 lg:col-span-2">
      <Tile
        label={t("videosToday")}
        value={video ? `${video.videos.used} / ${video.videos.limit}` : "–"}
        meter={
          video ? video.videos.used / Math.max(1, video.videos.limit) : null
        }
        sub={
          video ? (
            <>
              {t("perPerson", { count: video.videos.personLimit })} ·{" "}
              {t("perConnection", { count: video.videos.networkLimit })}
              {videosHealth ? <div>{videosHealth}</div> : null}
            </>
          ) : undefined
        }
        action={
          video ? (
            <ResetUsage
              target="videos"
              used={video.videos.used}
              onDone={onChanged}
            />
          ) : null
        }
      />
      <Tile
        label={t("mp4sToday")}
        value={video ? `${video.renders.used} / ${video.renders.limit}` : "–"}
        meter={
          video ? video.renders.used / Math.max(1, video.renders.limit) : null
        }
        sub={rendersHealth ?? undefined}
        action={
          video ? (
            <ResetUsage
              target="renders"
              used={video.renders.used}
              onDone={onChanged}
            />
          ) : null
        }
      />
      <div className="col-span-2">
        <Tile
          label={t("voiceBalance")}
          value={
            state?.voiceCreditUsd == null
              ? "–"
              : `$${state.voiceCreditUsd.toFixed(2)}`
          }
          sub={
            state?.voicePausedUntil
              ? t("voiceRanOut", {
                  time: new Date(state.voicePausedUntil).toLocaleTimeString(
                    [],
                    { hour: "numeric", minute: "2-digit" },
                  ),
                })
              : state?.voiceCreditUsd == null
                ? t("balanceUnreadable")
                : t("prepaid")
          }
        />
      </div>
      <div className="col-span-2">
        <Tile
          label={quota?.enabled ? t("tokensToday") : t("tokensCapOff")}
          value={
            quota
              ? `${formatCompact(quota.usedTokens)} / ${formatCompact(quota.limitTokens)}`
              : "–"
          }
          meter={
            quota?.enabled
              ? quota.usedTokens / Math.max(1, quota.limitTokens)
              : null
          }
          sub={
            quota
              ? t("reserved", {
                  count: formatCompact(quota.reservedTokens),
                })
              : undefined
          }
        />
      </div>
      <div className="col-span-2">
        <Tile
          label={t("agentCalls")}
          value={mcp ? formatCompact(mcp.today) : "–"}
          sub={
            mcp
              ? [
                  t("last7", { count: formatCompact(mcp.week) }),
                  mcp.clients.length
                    ? t("sessions", {
                        list: mcp.clients
                          .slice(0, 4)
                          .map(([name, count]) => `${name} ${count}`)
                          .join(", "),
                      })
                    : "",
                ]
                  .filter(Boolean)
                  .join(" · ")
              : state
                ? t("countsUnreadable")
                : undefined
          }
        />
      </div>
      <div className="col-span-2">
        <Tile
          label={t("creditBalance")}
          value={
            credit && creditSet
              ? dollars.format(credit.setUsd! - credit.spentUsd)
              : "–"
          }
          meter={
            credit && creditSet
              ? credit.spentUsd / Math.max(0.01, credit.setUsd!)
              : null
          }
          sub={
            !state ? undefined : state.claudeCredit === "no-key" ? (
              t("creditNoKey")
            ) : !credit ? (
              t("creditUnreadable")
            ) : creditSet ? (
              <>
                {t("creditSpentSince", {
                  spent: dollars.format(credit.spentUsd),
                  entered: dollars.format(credit.setUsd!),
                })}{" "}
                <Since ms={credit.setAt!} /> · {t("creditEachMinute")}
              </>
            ) : (
              t("enterBalance")
            )
          }
          action={
            state && state.claudeCredit !== "no-key" ? (
              <SetClaudeCredit onSaved={onCredit} />
            ) : null
          }
        />
      </div>
    </div>
  );
}
