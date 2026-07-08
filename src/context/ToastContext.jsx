import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Toast from "../components/Toast";

const ToastContext = createContext(null);

// compteur global pour donner un id unique à chaque toast affiché
let nextId = 1;

// provider global : n'importe quel composant peut appeler toast.success/error via useToast
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // enlève le toast de la liste (fermeture manuelle ou après le délai)
  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ajoute un toast à la liste et programme sa disparition automatique
  const push = useCallback((type, message) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => remove(id), 4000); // auto-dismiss après 4s
  }, [remove]);

  // API exposée aux composants : juste success() et error()
  const value = useMemo(() => ({
    success: (message) => push("success", message),
    error: (message) => push("error", message),
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* les toasts sont rendus par-dessus le contenu, en dehors du flux normal */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} type={t.type} message={t.message} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// hook d'accès au contexte, avec garde-fou si utilisé hors provider
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans un ToastProvider");
  return ctx;
}
