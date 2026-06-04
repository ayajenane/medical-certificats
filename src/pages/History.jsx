import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getHistory, clearHistory } from "../utils/history";

const ACTION_CONFIG = {
  PILOT_CREATED:  { label: "Pilote ajouté",    cls: "badge-active" },
  PILOT_UPDATED:  { label: "Pilote modifié",   cls: "badge-info" },
  PILOT_ARCHIVED: { label: "Pilote archivé",   cls: "badge-expiring" },
  PILOT_RESTORED: { label: "Pilote restauré",  cls: "badge-active" },
  PILOT_DELETED:  { label: "Pilote supprimé",  cls: "badge-expired" },
};

const FILTERS = [
  { key: "all",            label: "Toutes les actions" },
  { key: "PILOT_CREATED",  label: "Ajouts" },
  { key: "PILOT_UPDATED",  label: "Modifications" },
  { key: "PILOT_ARCHIVED", label: "Archivages" },
  { key: "PILOT_DELETED",  label: "Suppressions" },
];

function formatDate(iso) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function History() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [filter, setFilter]   = useState("all");

  useEffect(() => {
    if (!sessionStorage.getItem("currentUser")) { navigate("/login"); return; }
    setEntries(getHistory());
  }, [navigate]);

  const visible = filter === "all"
    ? entries
    : entries.filter((e) => e.action === filter);

  const handleClear = () => {
    if (window.confirm("Effacer tout l'historique ?")) {
      clearHistory();
      setEntries([]);
    }
  };

  const logout = () => { sessionStorage.removeItem("currentUser"); navigate("/login"); };

  return (
    <div className="dashboard-layout">
      <Sidebar activePage="history" />

      <main className="dashboard-main">
        <header className="dashboard-navbar">
          <div className="navbar-brand">
            <span className="navbar-brand-icon">📜</span>
            <div>
              <h1>Historique des actions</h1>
              <p>Journal complet des opérations effectuées</p>
            </div>
          </div>
          <div className="navbar-actions">
            {entries.length > 0 && (
              <button className="navbar-link" onClick={handleClear}>
                🗑️ Effacer
              </button>
            )}
            <button className="logout-button" onClick={logout}>Déconnexion</button>
          </div>
        </header>

        <section className="dashboard-content">
          {/* Filter pills */}
          <div className="filter-pills">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`filter-pill${filter === f.key ? " active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                {f.key !== "all" && (
                  <span className="pill-count">
                    {entries.filter((e) => e.action === f.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="panel">
            {visible.length === 0 ? (
              <p style={{ color: "var(--muted)", textAlign: "center", padding: "32px 0" }}>
                {entries.length === 0
                  ? "Aucune action enregistrée pour le moment."
                  : "Aucune action pour ce filtre."}
              </p>
            ) : (
              <div className="history-list">
                {visible.map((entry) => {
                  const cfg = ACTION_CONFIG[entry.action] || { label: entry.action, cls: "badge-unknown" };
                  return (
                    <div className="history-row" key={entry.id}>
                      <div className="history-time">{formatDate(entry.timestamp)}</div>
                      <span className={`status-badge ${cfg.cls}`}>{cfg.label}</span>
                      <p className="history-desc">{entry.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default History;
