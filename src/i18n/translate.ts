/** Minimal translator contract shared by server .ts helpers that render UI strings. */
export type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;
