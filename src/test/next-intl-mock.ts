import type { ReactNode } from "react";
import enMessages from "../../messages/en.json";

type Messages = Record<string, unknown>;

/**
 * Dot-path lookup into messages/en.json for the global test mock.
 * Missing keys return the full dot path so unnoticed gaps are visible
 * in rendered output instead of silently passing.
 */
export function lookup(namespace: string, key: string): string {
  const messages = enMessages as Messages;
  const path = [namespace, key].filter(Boolean).join(".");
  let current: unknown = messages;
  for (const segment of path.split(".")) {
    if (current === null || typeof current !== "object") {
      return path;
    }
    current = (current as Messages)[segment];
  }
  return typeof current === "string" ? current : path;
}

type MessageValues = Record<string, unknown>;

function interpolate(message: string, values?: MessageValues): ReactNode {
  if (!values) {
    return message;
  }
  // Values first so placeholders inside rich tags resolve before tag handling.
  const withValues = message.replace(/\{(\w+)\}/g, (full, valueName) => {
    const value = values[valueName];
    return value === undefined ? full : String(value);
  });
  // Render rich tags through the provided renderer, keeping its element.
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of withValues.matchAll(/<(\w+)>([^<]*)<\/\1>/g)) {
    const start = match.index;
    if (start > lastIndex) {
      parts.push(withValues.slice(lastIndex, start));
    }
    const tag = match[1];
    const renderer = tag ? values[tag] : undefined;
    if (typeof renderer === "function") {
      parts.push(renderer(match[2]));
    } else {
      parts.push(match[2]);
    }
    lastIndex = start + match[0].length;
  }
  if (lastIndex < withValues.length) {
    parts.push(withValues.slice(lastIndex));
  }
  return parts.length === 1 ? parts[0] : parts;
}

function createTranslator(namespace: string) {
  const translate = (key: string, values?: MessageValues) =>
    interpolate(lookup(namespace, key), values);
  translate.rich = translate;
  return translate;
}

// next-intl returns a stable hook value per namespace; mirror that so
// components depending on the translator in effect deps don't loop.
const translatorCache = new Map<string, ReturnType<typeof createTranslator>>();

function cachedTranslator(namespace: string) {
  let translator = translatorCache.get(namespace);
  if (!translator) {
    translator = createTranslator(namespace);
    translatorCache.set(namespace, translator);
  }
  return translator;
}

export { cachedTranslator as createTranslator };
