import { Icon } from "../../components/Icon";
import { useTheme } from "./ThemeProvider";

const LABEL: Record<string, string> = {
  dark: "Escuro",
  light: "Claro",
};

const ICON: Record<string, string> = {
  dark: "dark_mode",
  light: "light_mode",
};

/** Alterna direto entre claro e escuro (o tema do sistema só define o valor inicial). */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="btn"
      onClick={toggleTheme}
      aria-label={`Alternar tema. Atual: ${LABEL[theme]}. Clique para trocar.`}
    >
      <Icon name={ICON[theme]} size={18} />
    </button>
  );
}
