"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Switch } from "~/components/ui/switch";
import {
  DEFAULT_LIMITED_COUNTRY_SHARE,
  LIMITED_COUNTRY_NAMES,
} from "~/features/admin/limited-countries";
import { setAdminTools, useAdminTools } from "~/features/admin/tools";
import type {
  AdminState,
  LimitedCountryAccess,
  LiveControls,
  PriorityPlaces,
  VideoAudience,
} from "~/features/admin/types";
import { ConfirmDialog } from "./confirm-dialog";
import { Panel, TOUCH } from "./ui";

// The live switches for video making. Each applies within about a second.
// The riskiest ones (opening video making to everyone, dropping a limit
// override back to the deployment's default) ask first.

type Change = (patch: Partial<LiveControls>) => Promise<string | null>;

/** A next-intl translator, e.g. from useTranslations("admin.controls"). */
type ControlsTranslator = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

interface Choice<T> {
  value: T;
  label: string;
  hint: string;
}

const AUDIENCES = (t: ControlsTranslator): Array<Choice<VideoAudience>> => [
  {
    value: "priority",
    label: t("controls.audiencePriority"),
    hint: t("controls.audiencePriorityHint"),
  },
  {
    value: "desktop",
    label: t("controls.audienceDesktop"),
    hint: t("controls.audienceDesktopHint"),
  },
  {
    value: "everyone",
    label: t("controls.audienceEveryone"),
    hint: t("controls.audienceEveryoneHint"),
  },
];

const PLACES = (t: ControlsTranslator): Array<Choice<PriorityPlaces>> => [
  {
    value: "cities",
    label: t("controls.placesCities"),
    hint: t("controls.placesCitiesHint"),
  },
  {
    value: "countries",
    label: t("controls.placesCountries"),
    hint: t("controls.placesCountriesHint"),
  },
];

const limitedAccessChoices = (
  share: number,
  t: ControlsTranslator,
): Array<Choice<LimitedCountryAccess>> => [
  {
    value: "blocked",
    label: t("controls.limitedBlocked"),
    hint: t("controls.limitedBlockedHint"),
  },
  {
    value: "some",
    label: t("controls.limitedSome", { share }),
    hint: t("controls.limitedSomeHint", { share }),
  },
  {
    value: "open",
    label: t("controls.limitedOpen"),
    hint: t("controls.limitedOpenHint"),
  },
];

/**
 * A live setting as a radio group. Arrow keys, Home and End move between
 * the choices; Space or Enter picks one. (Moving does not pick, as it would
 * in a form, because each pick goes live at once.)
 */
function ChoicePicker<T extends string>({
  label,
  options,
  value,
  disabled,
  onPick,
}: {
  label: string;
  options: Array<Choice<T>>;
  value: T;
  disabled: boolean;
  onPick: (value: T) => void;
}) {
  const [focused, setFocused] = useState<number | null>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = options.findIndex((option) => option.value === value);
  const tabStop = focused ?? selected;

  const move = (event: React.KeyboardEvent, index: number) => {
    const last = options.length - 1;
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? index === last
          ? 0
          : index + 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? index === 0
            ? last
            : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setFocused(next);
    buttons.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`grid gap-2 ${options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setFocused(null);
      }}
    >
      {options.map((option, index) => {
        const checked = index === selected;
        return (
          <button
            key={option.value}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={index === tabStop ? 0 : -1}
            disabled={disabled}
            onClick={() => {
              if (option.value !== value) onPick(option.value);
            }}
            onKeyDown={(event) => move(event, index)}
            onFocus={() => setFocused(index)}
            className={`rounded-md border-[3px] border-black p-3 text-left transition-transform active:scale-[0.98] ${
              checked
                ? "bg-purple-400 shadow-[4px_4px_0_0_#000] dark:bg-[hsl(var(--neo-button))] dark:text-black"
                : "bg-white hover:bg-purple-100 dark:bg-black/20 dark:hover:bg-black/30"
            }`}
          >
            <div className="font-bold">{option.label}</div>
            <div className="text-xs opacity-80">{option.hint}</div>
          </button>
        );
      })}
    </div>
  );
}

/** Who can make new videos; opening it to everyone asks first. */
function AudiencePicker({
  value,
  disabled,
  change,
}: {
  value: VideoAudience;
  disabled: boolean;
  change: Change;
}) {
  const [confirming, setConfirming] = useState(false);
  const t = useTranslations("admin");
  return (
    <>
      <ChoicePicker
        label={t("controls.audienceLabel")}
        options={AUDIENCES(t)}
        value={value}
        disabled={disabled}
        onPick={(option) => {
          if (option === "everyone") setConfirming(true);
          else void change({ videoAudience: option });
        }}
      />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("controls.confirmEveryoneTitle")}
        description={t("controls.confirmEveryoneDescription")}
        confirmLabel={t("controls.confirmEveryone")}
        busyLabel={t("common.saving")}
        onConfirm={() => change({ videoAudience: "everyone" })}
      />
    </>
  );
}

// The highest overrides the server accepts (api/admin/controls).
const MAX_DAILY = 10_000;
const MAX_PER_PERSON = 1_000;

/** How limited the limited countries are; opening them fully asks first. */
function LimitedCountriesPicker({
  value,
  share,
  disabled,
  change,
}: {
  value: LimitedCountryAccess;
  share: number;
  disabled: boolean;
  change: Change;
}) {
  const [confirming, setConfirming] = useState(false);
  const t = useTranslations("admin");
  return (
    <>
      <ChoicePicker
        label={t("controls.limitedLabel")}
        options={limitedAccessChoices(share, t)}
        value={value}
        disabled={disabled}
        onPick={(option) => {
          if (option === "open") setConfirming(true);
          else void change({ limitedCountryAccess: option });
        }}
      />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("controls.confirmLimitedTitle")}
        description={t("controls.confirmLimitedDescription", {
          countries: LIMITED_COUNTRY_NAMES,
        })}
        confirmLabel={t("controls.confirmLimited")}
        busyLabel={t("common.saving")}
        onConfirm={() => change({ limitedCountryAccess: "open" })}
      />
    </>
  );
}

// Countries to preview video pages from (see server/admin/view-as.ts): one
// outside the priority places, and one of the limited countries.
const VIEW_AS = (t: ControlsTranslator): Array<Choice<string>> => [
  {
    value: "",
    label: t("controls.viewAsOff"),
    hint: t("controls.viewAsOffHint"),
  },
  {
    value: "DE",
    label: t("controls.viewAsGermany"),
    hint: t("controls.viewAsGermanyHint"),
  },
  {
    value: "IN",
    label: t("controls.viewAsIndia"),
    hint: t("controls.viewAsIndiaHint"),
  },
  {
    value: "BR",
    label: t("controls.viewAsBrazil"),
    hint: t("controls.viewAsBrazilHint"),
  },
];

/**
 * Sees video pages as a visitor from another country does, in this browser,
 * without a VPN. It lasts 12 hours.
 */
function ViewAsPicker() {
  const [country, setCountry] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("admin.controls");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/view-as", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => response.json() as Promise<{ country?: string }>)
      .then((body) => setCountry(body.country ?? ""))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  const pick = (next: string) => {
    setError(null);
    fetch("/api/admin/view-as", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: next || null }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(t("viewAsFailed"));
        setCountry(next);
      })
      .catch((failure: unknown) =>
        setError(
          failure instanceof Error ? failure.message : t("viewAsFailed"),
        ),
      );
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-semibold">{t("viewAsLabel")}</div>
      <p className="text-xs text-[hsl(var(--neo-soft-text))]">
        {t("viewAsNote")}
      </p>
      <ChoicePicker
        label={t("viewAsLabel")}
        options={VIEW_AS(t)}
        value={country ?? ""}
        disabled={country === null}
        onPick={pick}
      />
      {error && (
        <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

function LimitField({
  label,
  override,
  effective,
  max,
  disabled,
  onSave,
}: {
  label: string;
  override: number | null;
  effective: number | undefined;
  max: number;
  disabled: boolean;
  onSave: (value: number | null) => Promise<string | null>;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("admin");
  const parsed = Number.parseInt(draft, 10);
  const tooHigh = Number.isSafeInteger(parsed) && parsed > max;
  const valid =
    draft !== "" && Number.isSafeInteger(parsed) && parsed >= 0 && !tooHigh;
  const save = async (value: number | null) => {
    setError(null);
    const failure = await onSave(value);
    setError(failure);
    return failure;
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-sm font-semibold">{label}</div>
      <div className="flex items-center gap-2">
        <input
          inputMode="numeric"
          aria-invalid={tooHigh}
          value={draft}
          placeholder={effective === undefined ? "" : String(effective)}
          onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))}
          className={`neo-input h-10 w-24 rounded-md bg-white px-3 font-mono tabular-nums ${TOUCH}`}
          aria-label={label}
        />
        <button
          type="button"
          disabled={!valid || disabled}
          aria-label={t("controls.setAria", { label: label.toLowerCase() })}
          onClick={() => {
            void save(parsed);
            setDraft("");
          }}
          className={`neo-button h-10 rounded-md px-3 text-sm font-semibold disabled:opacity-50 ${TOUCH}`}
        >
          {t("controls.set")}
        </button>
        {override !== null ? (
          <ResetLimit
            label={label}
            override={override}
            disabled={disabled}
            onReset={() => save(null)}
          />
        ) : null}
      </div>
      {tooHigh || error ? (
        <div role="alert" className="text-xs text-red-700 dark:text-red-400">
          {tooHigh
            ? t("controls.atMost", { max: max.toLocaleString("en-US") })
            : error}
        </div>
      ) : (
        <div className="text-xs text-[hsl(var(--neo-soft-text))]">
          {override !== null
            ? t("controls.setHere")
            : t("controls.defaultFrom")}
        </div>
      )}
    </div>
  );
}

function ResetLimit({
  label,
  override,
  disabled,
  onReset,
}: {
  label: string;
  override: number;
  disabled: boolean;
  onReset: () => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("admin");
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label={t("controls.resetAria", { label: label.toLowerCase() })}
        onClick={() => setOpen(true)}
        className={`neo-button-muted h-10 rounded-md px-3 text-sm font-semibold disabled:opacity-50 ${TOUCH}`}
      >
        {t("controls.reset")}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("controls.resetTitle")}
        description={t("controls.resetDescription", { label, override })}
        confirmLabel={t("controls.confirmReset")}
        busyLabel={t("common.saving")}
        onConfirm={onReset}
      />
    </>
  );
}

export function ControlsPanel({
  state,
  saving,
  saveError,
  change,
}: {
  state: AdminState | null;
  saving: boolean;
  saveError: string | null;
  change: Change;
}) {
  const adminTools = useAdminTools();
  const controls = state?.controls;
  const video = state?.video;
  const t = useTranslations("admin");
  return (
    <Panel
      title={t("controls.title")}
      className="lg:col-span-3"
      aside={
        saving ? (
          t("common.saving")
        ) : saveError ? (
          <span className="text-red-700 dark:text-red-400">{saveError}</span>
        ) : (
          t("controls.liveNote")
        )
      }
    >
      {controls ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold">
              {t("controls.audienceLabel")}
            </div>
            <AudiencePicker
              value={controls.videoAudience}
              disabled={saving}
              change={change}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold">
              {t("controls.placesLabel")}
            </div>
            <p className="text-xs text-[hsl(var(--neo-soft-text))]">
              {t("controls.placesNote")}
            </p>
            <ChoicePicker
              label={t("controls.placesLabel")}
              options={PLACES(t)}
              value={controls.priorityPlaces}
              disabled={saving}
              onPick={(option) => void change({ priorityPlaces: option })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold">
              {t("controls.limitedLabel")}
            </div>
            <p className="text-xs text-[hsl(var(--neo-soft-text))]">
              {t("controls.limitedNote", {
                countries: LIMITED_COUNTRY_NAMES,
              })}
            </p>
            <LimitedCountriesPicker
              value={controls.limitedCountryAccess}
              share={
                controls.limitedCountryShare ?? DEFAULT_LIMITED_COUNTRY_SHARE
              }
              disabled={saving}
              change={change}
            />
            <LimitField
              label={t("controls.shareDaily")}
              override={controls.limitedCountryShare}
              effective={DEFAULT_LIMITED_COUNTRY_SHARE}
              max={100}
              disabled={saving}
              onSave={(value) => change({ limitedCountryShare: value })}
            />
          </div>
          <label className="flex items-center justify-between gap-4 rounded-md border-2 border-black bg-white/70 p-3 dark:bg-black/20">
            <span>
              <span className="block font-semibold">
                {t("controls.pauseTitle")}
              </span>
              <span className="block text-xs text-[hsl(var(--neo-soft-text))]">
                {t("controls.pauseDescription")}
              </span>
            </span>
            <Switch
              checked={controls.videosPaused}
              disabled={saving}
              onCheckedChange={(checked) =>
                void change({ videosPaused: checked })
              }
              aria-label={t("controls.pauseAria")}
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-md border-2 border-black bg-white/70 p-3 dark:bg-black/20">
            <span>
              <span className="block font-semibold">
                {t("controls.sellTitle")}
              </span>
              <span className="block text-xs text-[hsl(var(--neo-soft-text))]">
                {t("controls.sellDescription")}
              </span>
            </span>
            <Switch
              checked={controls.paidVideos}
              disabled={saving}
              onCheckedChange={(checked) =>
                void change({ paidVideos: checked })
              }
              aria-label={t("controls.sellAria")}
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-md border-2 border-black bg-white/70 p-3 dark:bg-black/20">
            <span>
              <span className="block font-semibold">
                {t("controls.adminControlsTitle")}
              </span>
              <span className="block text-xs text-[hsl(var(--neo-soft-text))]">
                {t("controls.adminControlsDescription")}
              </span>
            </span>
            <Switch
              checked={adminTools}
              onCheckedChange={setAdminTools}
              aria-label={t("controls.adminControlsAria")}
            />
          </label>
          <ViewAsPicker />
          <div className="grid gap-4 sm:grid-cols-2">
            <LimitField
              label={t("controls.limitDaily")}
              override={controls.videoDailyLimit}
              effective={video?.videos.limit}
              max={MAX_DAILY}
              disabled={saving}
              onSave={(value) => change({ videoDailyLimit: value })}
            />
            <LimitField
              label={t("controls.limitPerson")}
              override={controls.videoPersonDailyLimit}
              effective={video?.videos.personLimit}
              max={MAX_PER_PERSON}
              disabled={saving}
              onSave={(value) => change({ videoPersonDailyLimit: value })}
            />
            <LimitField
              label={t("controls.limitPriority")}
              override={controls.videoPriorityPersonDailyLimit}
              effective={video?.videos.priorityPersonLimit}
              max={MAX_PER_PERSON}
              disabled={saving}
              onSave={(value) =>
                change({ videoPriorityPersonDailyLimit: value })
              }
            />
            <LimitField
              label={t("controls.limitConnection")}
              override={controls.videoNetworkDailyLimit}
              effective={video?.videos.networkLimit}
              max={MAX_PER_PERSON}
              disabled={saving}
              onSave={(value) => change({ videoNetworkDailyLimit: value })}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-[hsl(var(--neo-soft-text))]">
          {t("loading")}
        </p>
      )}
    </Panel>
  );
}
