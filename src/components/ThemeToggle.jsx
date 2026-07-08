import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

// bouton de la navbar pour basculer entre thème clair et sombre
function ThemeToggle() {
  const { theme, toggle } = useTheme(); // theme/toggle viennent du contexte global
  return (
    <button
      className="navbar-icon-btn"
      onClick={toggle}
      // le tooltip annonce le thème qu'on va activer, pas celui en cours
      title={theme === "light" ? "Mode sombre" : "Mode clair"}
    >
      {/* icône inversée: lune pour passer en sombre, soleil pour repasser en clair */}
      {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}

export default ThemeToggle;
