import { useTheme } from "./ThemeProvider";

const LABEL: Record<string, string> = {
  system: "Sistema",
  dark: "Escuro",
  light: "Claro",
};

const ICON: Record<string, string> = {
  system: "🌓",
  dark: "🌙",
  light: "☀️",
};

/** Ciclo de 1 clique: sistema → escuro → claro → sistema. */
export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  return (
    <button
      type="button"
      className="btn"
      onClick={cycleTheme}
      aria-label={`Alternar tema. Atual: ${LABEL[theme]}. Clique para trocar.`}
    >
      <span aria-hidden="true">{ICON[theme]}</span> {LABEL[theme]}
    </button>
  );
}
