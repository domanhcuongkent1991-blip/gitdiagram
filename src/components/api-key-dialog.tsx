"use client";

import { useTranslations } from "next-intl";

import { CredentialDialog } from "./credential-dialog";

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
}

const API_KEYS_URL = "https://platform.openai.com/api-keys";
const AI_PROMPT = [
  "Help me set up an OpenAI API key for GitDiagram.",
  `Use my browser to open ${API_KEYS_URL} and help me create a secret key named GitDiagram in my chosen project.`,
  "Explain that diagram generations using this key are billed to my OpenAI API account. If billing needs setup, walk me through it and ask before adding payment details or buying credits.",
  "Help me paste the key directly into GitDiagram's OpenAI API key dialog and save it. Do not put the key in chat, logs, or files.",
  "If you cannot use my browser, walk me through these steps briefly.",
].join("\n\n");

export function ApiKeyDialog(props: ApiKeyDialogProps) {
  const t = useTranslations("dialogs.apiKey");
  return (
    <CredentialDialog
      {...props}
      credential="openai_api_key"
      title={t("title")}
      description={t("description")}
      setup={{
        instructions: t("instructions"),
        url: API_KEYS_URL,
        linkLabel: t("linkLabel"),
        aiPrompt: AI_PROMPT,
      }}
      dataUsage={t("dataUsage")}
    />
  );
}
