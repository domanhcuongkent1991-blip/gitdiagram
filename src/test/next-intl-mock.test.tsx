import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { useLocale, useTranslations } from "next-intl";
import { lookup } from "./next-intl-mock";

function Probe() {
  const t = useTranslations("home.mainCard");
  return <p>{t("tryExamples")}</p>;
}

function LocaleProbe() {
  const locale = useLocale();
  return <p data-testid="locale">{locale}</p>;
}

test("global next-intl mock returns en message by dot path", () => {
  render(<Probe />);
  expect(screen.getByText("Try these example repositories:")).toBeInTheDocument();
});

test("useLocale resolves to the default locale", () => {
  render(<LocaleProbe />);
  expect(screen.getByTestId("locale")).toHaveTextContent("vi");
});

test("mock resolves credential input label exactly", () => {
  function LabelProbe() {
    const t = useTranslations("dialogs.credentials");
    return <input aria-label={t("openai_api_key.inputLabel")} />;
  }
  render(<LabelProbe />);
  const expected = lookup("dialogs.credentials", "openai_api_key.inputLabel");
  const input = screen.getByLabelText(expected, {
    selector: "input",
  });
  expect(input).toHaveAttribute("aria-label", expected);
});
