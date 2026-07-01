import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      className="navbar-icon-btn"
      onClick={toggle}
      title={theme === "light" ? "Mode sombre" : "Mode clair"}
    >
      {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}

export default ThemeToggle;
