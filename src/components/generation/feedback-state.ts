import type { DiagramStreamState } from "~/features/diagram/types";
import { hasGithubAccessTitle } from "~/features/diagram/github-access";
import type { Translate } from "~/i18n/translate";
import { generationStep } from "./progress";

function generationTitle(state: DiagramStreamState, t: Translate) {
  if (state.status === "idle") return t("titles.opening");
  if (state.status === "started")
    return state.lastActivityAt ? t("titles.reading") : t("titles.connecting");
  if (generationStep(state.status) === 1) return t("titles.understanding");
  if (state.status === "graph_retry") return t("titles.refining");
  if (state.status === "diagram_compiling" || state.status === "complete")
    return t("titles.drawing");
  return t("titles.mapping");
}

export function feedbackState(
  state: DiagramStreamState,
  active: boolean,
  renderFailed: boolean,
  seconds: number,
  now: number,
  t: Translate,
) {
  const failed = state.status === "error" || renderFailed;
  const cancelled = state.errorCode === "GENERATION_CANCELLED";
  const rendering =
    state.status === "diagram_compiling" || state.status === "complete";
  const quiet =
    active &&
    !rendering &&
    (state.lastActivityAt !== undefined
      ? now - state.lastActivityAt > 25_000
      : seconds > 25);
  if (failed)
    return {
      failed,
      cancelled,
      quiet,
      title: cancelled
        ? t("errors.cancelled")
        : renderFailed
          ? t("errors.couldntDisplay")
          : hasGithubAccessTitle(state.errorCode)
            ? t(`errors.access.${state.errorCode}`)
            : t("errors.couldntGenerate"),
      description: cancelled ? "" : state.error,
    };
  return {
    failed,
    cancelled,
    quiet,
    title: quiet ? t("quiet.title") : generationTitle(state, t),
    description: quiet
      ? t("quiet.description")
      : seconds >= 20 && state.lastActivityAt && !rendering
        ? t("stillWorking")
        : "",
  };
}
