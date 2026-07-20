import { Icon } from "../../components/Icon";
import { useTheme } from "./ThemeProvider";

const LABEL: Record<string, string> = {
  system: "Sistema",
  dark: "Escuro",
  light: "Claro",
};

const ICON: Record<string, string> = {
  system: "brightness_auto",
  dark: "dark_mode",
  light: "light_mode",
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
      <Icon name={ICON[theme]} size={18} /> {LABEL[theme]}
    </button>
  );
}
