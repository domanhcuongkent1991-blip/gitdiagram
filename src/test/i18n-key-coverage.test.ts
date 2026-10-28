import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lookup } from "./next-intl-mock";

/**
 * Every static `t("key")` / `t("ns.key")` call site must resolve to a real
 * message. A missing key renders the dot path itself ("admin.budget.yesReset"),
 * which a per-component test can miss; this scans the whole tree instead.
 *
 * Template keys (`t(`stage.${x}`)`) are dynamic and checked by the
 * components' own tests.
 */

const root = join(process.cwd(), "src");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) out.push(path);
  }
  return out;
}

const namespaceRe =
  /useTranslations\("([^"]+)"\)|getTranslations\(\s*"([^"]+)"/g;
const callRe = /\bt\(\s*"([A-Za-z0-9_.]+)"/g;
const scopedRe = /\b(?:tc|tv|jobLabelT)\(\s*"([A-Za-z0-9_.]+)"/g;

describe("i18n key coverage", () => {
  it("resolves every static translation key to a message", () => {
    const leaks: string[] = [];
    for (const file of walk(root)) {
      const source = readFileSync(file, "utf8");
      const namespaces = [...source.matchAll(namespaceRe)]
        .map((match) => match[1] ?? match[2])
        .filter((value): value is string => Boolean(value));
      if (!namespaces.length) continue;
      const keys = [
        ...[...source.matchAll(callRe)].map((match) => match[1]!),
        ...[...source.matchAll(scopedRe)].map((match) => match[1]!),
      ];
      for (const key of keys) {
        // A file may scope more than one namespace; the key must resolve
        // under at least one of them.
        const resolved = namespaces.some(
          (namespace) => lookup(namespace, key) !== `${namespace}.${key}`,
        );
        if (!resolved) {
          leaks.push(
            `${file.replace(process.cwd() + "\\", "")}: ${namespaces
              .map((namespace) => `${namespace}.${key}`)
              .join(" | ")}`,
          );
        }
      }
    }
    expect(leaks).toEqual([]);
  });
});