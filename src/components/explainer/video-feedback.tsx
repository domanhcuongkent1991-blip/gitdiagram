"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Check, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { sendFeedback } from "~/features/explainer/feedback";
import controls from "~/components/generation/workspace.module.css";
import styles from "./video-feedback.module.css";

/**
 * What someone thought of a video, sent straight to the operator's inbox.
 * `position` reads how far into the film they are, so the email says which
 * moment they mean.
 */
export function VideoFeedbackForm({
  username,
  repo,
  position,
  onClose,
}: {
  username: string;
  repo: string;
  position?: () => number | undefined;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("explainer");
  const field = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  useEffect(() => {
    field.current?.focus({ preventScroll: true });
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await sendFeedback({
        username,
        repo,
        message: message.trim(),
        email: email.trim(),
        at: position?.(),
      });
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "sendFailed");
    } finally {
      setSending(false);
    }
  };

  if (sent)
    return (
      <div className={styles.form} role="status">
        <p className={styles.sent}>
          <Check size={16} aria-hidden="true" />
          {t("feedback.sent")}
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={controls.actionButton}
            onClick={onClose}
          >
            {t("feedback.close")}
          </button>
        </div>
      </div>
    );

  return (
    <form className={styles.form} onSubmit={(event) => void submit(event)}>
      <label className={styles.label} htmlFor={`${id}-message`}>
        {t("feedback.prompt")}
      </label>
      <p className={styles.hint}>{t("feedback.hint")}</p>
      <textarea
        ref={field}
        id={`${id}-message`}
        className={styles.input}
        rows={4}
        maxLength={4000}
        required
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <label className={styles.label} htmlFor={`${id}-email`}>
        {t("feedback.email")}{" "}
        <span className={styles.optional}>{t("feedback.emailOptional")}</span>
      </label>
      <input
        id={`${id}-email`}
        className={styles.input}
        type="email"
        autoComplete="email"
        maxLength={254}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      {error && (
        <p className={styles.error} role="alert">
          {error === "sendFailed" ? t("feedback.sendFailed") : error}
        </p>
      )}
      <div className={styles.actions}>
        <button
          type="submit"
          className={`${controls.actionButton} ${controls.primary}`}
          disabled={sending || !message.trim()}
        >
          <Send size={15} aria-hidden="true" />
          {sending ? t("feedback.sending") : t("feedback.send")}
        </button>
        <button
          type="button"
          className={controls.actionButton}
          onClick={onClose}
        >
          {t("feedback.cancel")}
        </button>
      </div>
    </form>
  );
}
