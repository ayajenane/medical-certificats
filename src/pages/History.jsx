import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Clock } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { getHistory, clearHistory } from "../utils/history";

const ACTION_CONFIG = {
  PILOT_CREATED:  { label: "Pilote ajouté",   cls: "badge-active"   },
  PILOT_UPDATED:  { label: "Pilote modifié",  cls: "badge-info"     },
  PILOT_ARCHIVED: { label: "Pilote archivé",  cls: "badge-expiring" },
  PILOT_RESTORED: { label: "Pilote restauré", cls: "badge-active"   },
  PILOT_DELETED:  { label: "Pilote supprimé", cls: "badge-expired"  },
};

const FILTERS = [
  { key: "all",            label: "Toutes les actions" },
  { key: "PILOT_CREATED",  label: "Ajouts"             },
  { key: "PILOT_UPDATED",  label: "Modifications"      },
  { key: "PILOT_ARCHIVED", label: "Archivages"         },
  { key: "PILOT_DELETED",  label: "Suppressions"       },
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

  return (
    <div className="app-layout">
      <Sidebar activePage="history" />

      <div className="main-content">
        {/* Navbar */}
        <header className="navbar">
          <div className="navbar-left">
            <span className="navbar-eyebrow">Administration</span>
            <h1 className="navbar-title">Historique des actions</h1>
          </div>
          <div className="navbar-right">
            {entries.length > 0 && (
              <button className="btn btn-secondary" onClick={handleClear}>
                <Trash2 size={15} />
                Effacer l'historique
              </button>
            )}
          </div>
        </header>

        <main className="page-content">
          {/* Tabs */}
          <div className="tabs">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`tab${filter === f.key ? " active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                {f.key !== "all" && (
                  <span className="tab-count">
                    {entries.filter((e) => e.action === f.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="card">
            {visible.length === 0 ? (
              <div className="empty-state">
                <Clock size={36} strokeWidth={1.5} />
                <p>
                  {entries.length === 0
                    ? "Aucune action enregistrée pour le moment."
                    : "Aucune action pour ce filtre."}
                </p>
              </div>
            ) : (
              <div className="history-list">
                {visible.map((entry) => {
                  const cfg = ACTION_CONFIG[entry.action] || {
                    label: entry.action,
                    cls: "badge-unknown",
                  };
                  return (
                    <div className="history-row" key={entry.id}>
                      <div className="history-time">{formatDate(entry.timestamp)}</div>
                      <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                      <p className="history-desc">{entry.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default History;
