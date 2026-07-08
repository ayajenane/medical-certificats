import { createContext, useContext, useEffect, useState } from "react";

// contexte partagé pour le thème clair/sombre, accessible via useTheme
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // relit le thème sauvegardé au démarrage, sinon clair par défaut
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  // applique le thème sur le html (pour le CSS) et le persiste
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // bascule simple entre les deux seuls thèmes disponibles
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// hook pratique pour lire/changer le thème depuis n'importe quel composant
export function useTheme() {
  return useContext(ThemeContext);
}
