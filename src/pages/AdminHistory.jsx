import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Search, ChevronLeft, ChevronRight, ArrowUpDown, Eye,
  UserPlus, Pencil, KeyRound, Trash2, Shield,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";
import Footer from "../components/Footer";
import { getAdminHistory } from "../utils/adminHistory";
import { formatDate } from "../utils/historyDisplay";

const ACTION_CONFIG = {
  ADMIN_CREATED:        { label: "Admin créé",         cls: "badge-active",   icon: UserPlus  },
  ADMIN_UPDATED:        { label: "Infos modifiées",     cls: "badge-info",     icon: Pencil    },
  ADMIN_PASSWORD_RESET: { label: "Mot de passe reset",  cls: "badge-expiring", icon: KeyRound  },
  ADMIN_DELETED:        { label: "Admin supprimé",      cls: "badge-expired",  icon: Trash2    },
};

const FILTERS = [
  { key: "all",                  label: "Toutes les actions"   },
  { key: "ADMIN_CREATED",        label: "Créations"            },
  { key: "ADMIN_UPDATED",        label: "Modifications"        },
  { key: "ADMIN_PASSWORD_RESET", label: "Réinitialisations MDP" },
  { key: "ADMIN_DELETED",        label: "Suppressions"         },
];

const FIELD_LABELS = { username: "Nom", email: "Email" };

function getFieldChanges(oldData, newData) {
  if (!oldData && !newData) return [];
  const source = newData || oldData || {};
  const fields = Object.keys(source).filter((f) => FIELD_LABELS[f]);

  if (oldData && newData) {
    return fields
      .map((f) => ({ field: f, label: FIELD_LABELS[f], oldValue: oldData[f], newValue: newData[f] }))
      .filter(({ oldValue, newValue }) => String(oldValue) !== String(newValue));
  }

  return fields.map((f) => ({
    field: f, label: FIELD_LABELS[f],
    oldValue: oldData ? oldData[f] : undefined,
    newValue: newData ? newData[f] : undefined,
  }));
}

function AdminHistory() {
  const [entries, setEntries]       = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [filter, setFilter]         = useState("all");
  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort]             = useState("desc");
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filtersRef = useRef({ filter, sort, debouncedSearch });

  useEffect(() => {
    const filtersChanged =
      filtersRef.current.filter !== filter ||
      filtersRef.current.sort !== sort ||
      filtersRef.current.debouncedSearch !== debouncedSearch;
    filtersRef.current = { filter, sort, debouncedSearch };
    const targetPage = filtersChanged ? 1 : page;

    let cancelled = false;
    setLoading(true);
    getAdminHistory({ page: targetPage, limit: 10, sort, action: filter, search: debouncedSearch })
      .then((res) => {
        if (cancelled) return;
        setEntries(res.data);
        setPagination(res.pagination);
        if (filtersChanged) setPage(1);
      })
      .catch(() => { if (!cancelled) setEntries([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, filter, sort, debouncedSearch]);

  const fieldChanges = selected ? getFieldChanges(selected.oldData, selected.newData) : [];

  return (
    <div className="app-layout">
      <Sidebar activePage="admin-history" />

      <div className="main-content">
        <header className="navbar">
          <div className="navbar-left">
            <span className="navbar-eyebrow">Administration</span>
            <h1 className="navbar-title">Historique des administrateurs</h1>
          </div>
          <div className="navbar-right">
            <ThemeToggle />
          </div>
        </header>

        <main className="page-content">
          <div className="search-bar">
            <Search size={15} className="search-bar-icon" />
            <input
              className="search-bar-input"
              type="text"
              placeholder="Rechercher par nom ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="tabs">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`tab${filter === f.key ? " active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
            <button
              className="tab"
              onClick={() => setSort((s) => (s === "desc" ? "asc" : "desc"))}
              title="Inverser le tri par date"
            >
              <ArrowUpDown size={13} />
              {sort === "desc" ? "Plus récent d'abord" : "Plus ancien d'abord"}
            </button>
          </div>

          <div className="card">
            {loading ? (
              <div className="empty-state">
                <Clock size={36} strokeWidth={1.5} />
                <p>Chargement de l'historique…</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="empty-state">
                <Shield size={36} strokeWidth={1.5} />
                <p>Aucune action trouvée.</p>
              </div>
            ) : (
              <div className="history-table">
                <div className="history-table-head">
                  <span>Date</span>
                  <span>Administrateur</span>
                  <span>Action</span>
                  <span>Effectué par</span>
                  <span></span>
                </div>

                {entries.map((entry) => {
                  const cfg = ACTION_CONFIG[entry.action] || { label: entry.action, cls: "badge-unknown" };
                  return (
                    <div
                      className="history-table-row"
                      key={entry.id}
                      onClick={() => setSelected(entry)}
                    >
                      <span className="history-time">{formatDate(entry.createdAt)}</span>
                      <span className="pilot-name">
                        {entry.adminName}
                        {entry.adminEmail && (
                          <span className="pilot-sub" style={{ display: "block", fontSize: 11 }}>
                            {entry.adminEmail}
                          </span>
                        )}
                      </span>
                      <span><span className={`badge ${cfg.cls}`}>{cfg.label}</span></span>
                      <span className="pilot-sub">{entry.performedBy?.username || "Système"}</span>
                      <button
                        className="action-btn"
                        title="Voir le détail"
                        onClick={(e) => { e.stopPropagation(); setSelected(entry); }}
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && entries.length > 0 && (
              <div className="pagination">
                <span className="pagination-info">
                  Page {pagination.page} / {pagination.pages} · {pagination.total} action(s)
                </span>
                <div className="pagination-btns">
                  <button
                    className="action-btn"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    className="action-btn"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="modal-title">Détail de l'action</h3>

              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Administrateur</span>
                  <span className="detail-value">{selected.adminName}</span>
                </div>
                {selected.adminEmail && (
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{selected.adminEmail}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Action</span>
                  <span className="detail-value">
                    <span className={`badge ${(ACTION_CONFIG[selected.action] || {}).cls || "badge-unknown"}`}>
                      {(ACTION_CONFIG[selected.action] || {}).label || selected.action}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{formatDate(selected.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Effectué par</span>
                  <span className="detail-value">
                    {selected.performedBy?.username || "Système"}
                    {selected.performedBy?.email ? ` (${selected.performedBy.email})` : ""}
                  </span>
                </div>
              </div>

              {fieldChanges.length > 0 && (
                <>
                  <h3 className="modal-title" style={{ marginTop: 24, marginBottom: 12, fontSize: 14 }}>
                    Champs modifiés
                  </h3>
                  <div className="detail-grid">
                    {fieldChanges.map(({ field, label, oldValue, newValue }) => (
                      <div className="detail-row" key={field}>
                        <span className="detail-label">{label}</span>
                        <span className="detail-value">
                          {selected.oldData && selected.newData ? (
                            <>
                              {oldValue || "—"}
                              <span className="detail-arrow"> → </span>
                              {newValue || "—"}
                            </>
                          ) : (
                            newValue ?? oldValue ?? "—"
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button className="btn btn-secondary" onClick={() => setSelected(null)}>
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminHistory;
