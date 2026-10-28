"use client";

import { useId, useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import type {
  CredentialKind,
  CredentialStatus,
} from "~/features/credentials/api";
import { useCredentialSetting } from "~/hooks/use-credential-setting";
import { GITHUB_REPO_URL } from "~/lib/site";

import controls from "./generation/workspace.module.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";

interface CredentialDialogProps {
  credential: CredentialKind;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
  title: string;
  description: string;
  setup: {
    instructions: ReactNode;
    url: string;
    linkLabel: string;
    aiPrompt: string;
  };
  dataUsage: ReactNode;
  /**
   * A preferred way in, shown above the pasted-credential steps, which then
   * stay folded behind `alternativeLabel` until opened (or while a pasted
   * credential is saved).
   */
  primary?: (context: CredentialDialogPrimaryContext) => ReactNode;
  alternativeLabel?: string;
}

export interface CredentialDialogPrimaryContext {
  status: CredentialStatus | null;
  disconnectGitHub: () => Promise<boolean>;
  isPending: boolean;
  pendingAction: ReturnType<typeof useCredentialSetting>["pendingAction"];
}

export function CredentialDialog({
  credential,
  isOpen,
  onClose,
  onSaved,
  title,
  description,
  setup,
  dataUsage,
  primary,
  alternativeLabel,
}: CredentialDialogProps) {
  const inputId = useId();
  const hintId = useId();
  const t = useTranslations("dialogs.credentials");
  const labels = {
    noun: t(`${credential}.noun`),
    name: t(`${credential}.name`),
    inputLabel: t(`${credential}.inputLabel`),
    placeholder: t(`${credential}.placeholder`),
    saved: t(`${credential}.saved`),
  };
  const [showAlternative, setShowAlternative] = useState(false);
  const {
    clear,
    disconnectGitHub,
    error,
    isConfigured,
    isPending,
    pendingAction,
    save,
    setValue,
    status,
    value,
  } = useCredentialSetting({ credential, isOpen });
  const errors = {
    load: t("errorLoad", { noun: labels.noun }),
    save: t("errorSave", { name: labels.name }),
    clear: t("errorClear", { name: labels.name }),
    disconnect: t("errorDisconnect"),
  };
  const showForm = !primary || showAlternative || isConfigured;
  const errorAlert = error && (
    <p
      role="alert"
      className="text-sm font-medium text-red-700 dark:text-red-300"
    >
      {errors[error]}
    </p>
  );
  const dataUsageDetails = (
    <details className="text-xs text-neutral-700 dark:text-neutral-300">
      <summary className="neo-link w-fit cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-offset-4">
        {t("howDataUsed")}
      </summary>
      <p className="mt-2 leading-relaxed">
        {dataUsage}{" "}
        {t.rich("alsoSelfHost", {
          link: (chunks) => (
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="neo-link underline"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
    </details>
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isPending || !value.trim()) return;
    if (await save()) {
      onClose();
      await onSaved?.();
    }
  };

  const handleClear = async () => {
    if (await clear()) {
      if (onSaved) {
        onClose();
        await onSaved();
      }
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={`neo-panel ${controls.controlsTheme} max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-lg p-5 sm:max-w-md sm:p-6`}
        onOpenAutoFocus={(event) => {
          // Radix skips links when it picks what to focus; a primary action
          // that is a link marks itself so it still gets the first focus.
          const target = (
            event.currentTarget as HTMLElement | null
          )?.querySelector<HTMLElement>("[data-dialog-autofocus]");
          if (target) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="pr-6 text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-sm text-neutral-700 dark:text-neutral-300">
            {description}
          </DialogDescription>
        </DialogHeader>
        {primary?.({ status, disconnectGitHub, isPending, pendingAction })}
        {!showForm && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowAlternative(true)}
              className="neo-link min-h-10 text-sm font-medium underline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {alternativeLabel}
            </button>
            {dataUsageDetails}
            {errorAlert}
          </div>
        )}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-sm font-bold">{t("createNoun", { noun: labels.noun })}</h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {setup.instructions}
              </p>
              <a
                href={setup.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${controls.actionButton} ${controls.primary} w-full`}
              >
                {setup.linkLabel}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
              <CopySetupPrompt prompt={setup.aiPrompt} />
            </div>
            <div className="space-y-2">
              <label htmlFor={inputId} className="block text-sm font-bold">
                {t("pasteNoun", { noun: labels.noun })}
              </label>
              <Input
                id={inputId}
                type="password"
                aria-label={labels.inputLabel}
                aria-describedby={hintId}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={
                  isConfigured
                    ? t("pasteReplacement", { noun: labels.noun })
                    : labels.placeholder
                }
                value={value}
                onChange={(event) => setValue(event.target.value)}
                disabled={isPending}
                className="ph-no-capture neo-input h-11 rounded-md px-3 py-2 text-base placeholder:font-normal placeholder:text-gray-600 dark:placeholder:text-neutral-400"
                required
              />
              <p
                id={hintId}
                className="pt-1 text-xs text-neutral-700 dark:text-neutral-300"
              >
                {isConfigured
                  ? labels.saved
                  : t("savedNotice")}
              </p>
            </div>
            {dataUsageDetails}
            {errorAlert}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {isConfigured && (
                <button
                  type="button"
                  onClick={() => void handleClear()}
                  disabled={isPending}
                  className="neo-link min-h-10 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pendingAction === "clear"
                    ? t("clearing")
                    : t("clearNoun", { noun: labels.noun })}
                </button>
              )}
              <div className="ml-auto grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className={controls.actionButton}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={!value.trim() || isPending}
                  className={`${controls.actionButton} ${controls.primary}`}
                >
                  {pendingAction === "save"
                    ? t("saving")
                    : onSaved
                      ? t("saveRetry")
                      : t("saveNoun", { noun: labels.noun })}
                </button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CopySetupPrompt({ prompt }: { prompt: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const t = useTranslations("dialogs.credentials");

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void copyPrompt()}
        className={`${controls.actionButton} w-full`}
      >
        {status === "copied" ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Copy size={16} aria-hidden="true" />
        )}
        <span aria-live="polite">
          {status === "copied" ? t("copied") : t("copyPrompt")}
        </span>
      </button>
      {status === "failed" && (
        <div className="space-y-2">
          <p role="alert" className="text-sm">
            {t("copyFailed")}
          </p>
          <textarea
            aria-label={t("aiPromptLabel")}
            readOnly
            value={prompt}
            onFocus={(event) => event.currentTarget.select()}
            className="neo-input min-h-28 w-full rounded-md p-3 text-sm"
          />
        </div>
      )}
    </>
  );
}
