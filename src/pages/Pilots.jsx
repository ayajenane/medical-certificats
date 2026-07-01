import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Archive, RotateCcw, RefreshCw, Trash2, Plus, Search, Users,
  Pencil, Eye, ChevronLeft, ChevronRight, Clock,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";
import Footer from "../components/Footer";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../context/ToastContext";
import {
  getPilots, addPilot, updatePilot, archivePilot, restorePilot,
  deletePilot, renewPilot, computeStatus, daysUntilExpiry,
} from "../utils/pilots";
import { getCertificatesByPilot } from "../utils/certificates";
import { getPilotHistory } from "../utils/pilotHistory";
import { ACTION_CONFIG, formatDate } from "../utils/historyDisplay";

const STATUS_CONFIG = {
  active:   { label: "Actif",          cls: "badge-active"   },
  expiring: { label: "Expire bientôt", cls: "badge-expiring" },
  expired:  { label: "Expiré",         cls: "badge-expired"  },
  unknown:  { label: "Inconnu",        cls: "badge-unknown"  },
};


const SORT_OPTIONS = [
  { value: "-createdAt", label: "Plus récents d'abord" },
  { value: "createdAt",  label: "Plus anciens d'abord" },
  { value: "name",       label: "Nom (A → Z)" },
  { value: "-name",      label: "Nom (Z → A)" },
  { value: "expiryDate", label: "Expiration (croissant)" },
  { value: "-expiryDate", label: "Expiration (décroissant)" },
];

const EMPTY_FORM = {
  name: "", email: "", licenseNumber: "", certificateNumber: "",
  nationality: "", medicalClass: "1", expiryDate: "",
};

const FORM_FIELDS = [
  { name: "name",              label: "Nom complet *",         type: "text",  placeholder: "Jean Dupont"        },
  { name: "email",             label: "Email",                 type: "email", placeholder: "pilote@example.com" },
  { name: "licenseNumber",     label: "N° Licence",            type: "text",  placeholder: "FR-ATPL-001"        },
  { name: "certificateNumber", label: "N° Certificat médical", type: "text",  placeholder: "CM-2026-001"        },
  { name: "nationality",       label: "Nationalité",           type: "text",  placeholder: "Française"          },
  { name: "expiryDate",        label: "Date d'expiration *",   type: "date",  placeholder: ""                   },
];

function Pilots() {
  const navigate = useNavigate();
  const toast = useToast();

  const [pilots, setPilots]         = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [counts, setCounts]         = useState({ all: 0, active: 0, expiring: 0, expired: 0 });

  const [search, setSearch]                 = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter]                 = useState("all");
  const [showArchived, setShowArchived]     = useState(false);
  const [sort, setSort]                     = useState("-createdAt");
  const [page, setPage]                     = useState(1);
  const [loading, setLoading]               = useState(true);
  const [refreshTick, setRefreshTick]       = useState(0);

  const [showModal, setShowModal]   = useState(false);
  const [editingPilot, setEditingPilot] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState("");

  const [viewTarget, setViewTarget]         = useState(null);
  const [viewCertificates, setViewCertificates] = useState([]);
  const [viewHistory, setViewHistory]       = useState([]);
  const [viewLoading, setViewLoading]       = useState(false);

  const [renewTarget, setRenewTarget] = useState(null);
  const [renewDate, setRenewDate]     = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  const refresh = () => setRefreshTick((t) => t + 1);

  // Débounce de la recherche
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Revient à la page 1 lorsque les filtres/tri/recherche changent
  const filtersRef = useRef({ filter, showArchived, sort, debouncedSearch });

  useEffect(() => {
    if (!sessionStorage.getItem("currentUser")) { navigate("/login"); return; }

    const filtersChanged =
      filtersRef.current.filter !== filter ||
      filtersRef.current.showArchived !== showArchived ||
      filtersRef.current.sort !== sort ||
      filtersRef.current.debouncedSearch !== debouncedSearch;
    filtersRef.current = { filter, showArchived, sort, debouncedSearch };
    const targetPage = filtersChanged ? 1 : page;

    let cancelled = false;
    setLoading(true);
    getPilots({ search: debouncedSearch, status: filter, archived: showArchived, sort, page: targetPage, limit: 10 })
      .then((res) => {
        if (cancelled) return;
        setPilots(res.data);
        setPagination(res.pagination);
        setCounts(res.counts);
        if (filtersChanged) setPage(1);
      })
      .catch(() => { if (!cancelled) toast.error("Impossible de charger les pilotes."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [navigate, page, filter, showArchived, sort, debouncedSearch, refreshTick, toast]);

  // Charge certificats + historique récent du pilote consulté
  useEffect(() => {
    if (!viewTarget) return;
    let cancelled = false;
    setViewLoading(true);
    Promise.all([
      getCertificatesByPilot(viewTarget.id),
      getPilotHistory({ pilotId: viewTarget.id, limit: 5 }),
    ])
      .then(([certs, hist]) => {
        if (cancelled) return;
        setViewCertificates(certs);
        setViewHistory(hist.data);
      })
      .catch(() => { if (!cancelled) toast.error("Impossible de charger les détails du pilote."); })
      .finally(() => { if (!cancelled) setViewLoading(false); });
    return () => { cancelled = true; };
  }, [viewTarget, toast]);

  const closeFormModal = () => {
    setShowModal(false);
    setEditingPilot(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const openAddModal = () => {
    setEditingPilot(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (pilot) => {
    setEditingPilot(pilot);
    setForm({
      name: pilot.name || "",
      email: pilot.email || "",
      licenseNumber: pilot.licenseNumber || "",
      certificateNumber: pilot.certificateNumber || "",

      nationality: pilot.nationality || "",
      medicalClass: pilot.medicalClass || "1",
      expiryDate: pilot.expiryDate ? pilot.expiryDate.slice(0, 10) : "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmitForm = async () => {
    if (!form.name.trim() || !form.expiryDate) {
      setFormError("Le nom et la date d'expiration sont requis.");
      return;
    }
    try {
      if (editingPilot) {
        await updatePilot(editingPilot.id, form);
        toast.success("Pilote modifié avec succès.");
      } else {
        await addPilot(form);
        toast.success("Pilote ajouté avec succès.");
      }
      closeFormModal();
      refresh();
    } catch (err) {
      setFormError(err.response?.data?.message || "Erreur lors de l'enregistrement du pilote.");
    }
  };

  const handleArchive = async (id) => {
    try {
      await archivePilot(id);
      toast.success("Pilote archivé.");
      refresh();
    } catch {
      toast.error("Erreur lors de l'archivage du pilote.");
    }
  };

  const handleRestore = async (id) => {
    try {
      await restorePilot(id);
      toast.success("Pilote restauré.");
      refresh();
    } catch {
      toast.error("Erreur lors de la restauration du pilote.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePilot(deleteTarget.id);
      toast.success("Pilote supprimé avec succès.");
      if (pilots.length === 1 && pagination.page > 1) {
        setPage((p) => p - 1);
      } else {
        refresh();
      }
    } catch {
      toast.error("Erreur lors de la suppression du pilote.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const openRenew = (pilot) => {
    setRenewTarget(pilot);
    setRenewDate(pilot.expiryDate ? pilot.expiryDate.slice(0, 10) : "");
  };

  const handleRenew = async () => {
    if (!renewDate) return;
    try {
      await renewPilot(renewTarget.id, renewDate);
      toast.success("Certificat renouvelé avec succès.");
      setRenewTarget(null);
      setRenewDate("");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors du renouvellement.");
    }
  };

  const closeView = () => {
    setViewTarget(null);
    setViewCertificates([]);
    setViewHistory([]);
  };

  return (
    <div className="app-layout">
      <Sidebar activePage="pilots" />

      <div className="main-content">
        {/* Navbar */}
        <header className="navbar">
          <div className="navbar-left">
            <span className="navbar-eyebrow">Administration</span>
            <h1 className="navbar-title">Gestion des pilotes</h1>
          </div>
          <div className="navbar-right">
            <ThemeToggle />
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={16} />
              Ajouter un pilote
            </button>
          </div>
        </header>

        <main className="page-content">
          {/* Toolbar : recherche + tri */}
          <div className="toolbar">
            <div className="search-bar">
              <Search size={15} className="search-bar-icon" />
              <input
                className="search-bar-input"
                type="text"
                placeholder="Rechercher par nom, licence, nationalité, classe ou n° certificat…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {[
              { key: "all",      label: "Tous"             },
              { key: "active",   label: "Actifs"           },
              { key: "expiring", label: "Expirent bientôt" },
              { key: "expired",  label: "Expirés"          },
            ].map((f) => (
              <button
                key={f.key}
                className={`tab${filter === f.key && !showArchived ? " active" : ""}`}
                onClick={() => { setFilter(f.key); setShowArchived(false); }}
              >
                {f.label}
                <span className="tab-count">{counts[f.key] ?? 0}</span>
              </button>
            ))}
            <button
              className={`tab${showArchived ? " active" : ""}`}
              onClick={() => { setShowArchived((v) => !v); setFilter("all"); }}
            >
              <Archive size={13} />
              Archivés
            </button>
          </div>

          {/* Table */}
          <div className="card">
            {loading ? (
              <div className="empty-state">
                <Users size={36} strokeWidth={1.5} />
                <p>Chargement des pilotes…</p>
              </div>
            ) : pilots.length === 0 ? (
              <div className="empty-state">
                <Users size={36} strokeWidth={1.5} />
                <p>Aucun pilote trouvé.</p>
              </div>
            ) : (
              <div className="data-table">
                <div className="data-table-head">
                  <span>Pilote</span>
                  <span>Classe</span>
                  <span>Expiration</span>
                  <span>Statut</span>
                  <span>Actions</span>
                </div>

                {pilots.map((p) => {
                  const days   = daysUntilExpiry(p.expiryDate);
                  const status = computeStatus(p.expiryDate);
                  const cfg    = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;

                  return (
                    <div className="data-table-row" key={p.id}>
                      <div>
                        <p className="pilot-name">{p.name}</p>
                        <p className="pilot-sub">{p.email}</p>
                      </div>
                      <div>
                        <span className="class-badge">Classe {p.medicalClass}</span>
                      </div>
                      <div>
                        <p className="pilot-name">
                          {p.expiryDate
                            ? new Date(p.expiryDate).toLocaleDateString("fr-FR")
                            : "—"}
                        </p>
                        {days !== null && (
                          <p className={`pilot-sub${days <= 30 ? " text-warning" : ""}`}>
                            {days < 0
                              ? `Expiré il y a ${Math.abs(days)}j`
                              : `Dans ${days}j`}
                          </p>
                        )}
                      </div>
                      <div>
                        <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                      </div>
                      <div className="action-btns" style={{ justifyContent: "flex-end" }}>
                        <button className="action-btn" title="Voir les détails" onClick={() => setViewTarget(p)}>
                          <Eye size={14} />
                        </button>
                        <button className="action-btn" title="Modifier" onClick={() => openEditModal(p)}>
                          <Pencil size={14} />
                        </button>
                        {!p.archived ? (
                          <>
                            <button
                              className="action-btn"
                              title="Générer un certificat"
                              onClick={() => navigate(p.medicalClass === "2" ? "/pdf2" : "/pdf1", { state: { pilot: p } })}
                            >
                              <FileText size={14} />
                            </button>
                            <button className="action-btn" title="Renouveler" onClick={() => openRenew(p)}>
                              <RefreshCw size={14} />
                            </button>
                            <button className="action-btn" title="Archiver" onClick={() => handleArchive(p.id)}>
                              <Archive size={14} />
                            </button>
                          </>
                        ) : (
                          <button className="action-btn" title="Restaurer" onClick={() => handleRestore(p.id)}>
                            <RotateCcw size={14} />
                          </button>
                        )}
                        <button className="action-btn danger" title="Supprimer" onClick={() => setDeleteTarget(p)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && pilots.length > 0 && (
              <div className="pagination">
                <span className="pagination-info">
                  Page {pagination.page} / {pagination.pages} · {pagination.total} pilote(s)
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

      {/* Modal Ajouter / Modifier */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="modal-title">{editingPilot ? "Modifier le pilote" : "Ajouter un pilote"}</h3>

              {formError && <p className="error-inline">{formError}</p>}

              <div className="modal-form">
                {FORM_FIELDS.map((f) => (
                  <div className="form-field" key={f.name}>
                    <label>{f.label}</label>
                    <input
                      type={f.type}
                      name={f.name}
                      value={form[f.name]}
                      placeholder={f.placeholder}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
                        setFormError("");
                      }}
                    />
                  </div>
                ))}

                <div className="form-field">
                  <label>Classe médicale</label>
                  <select
                    name="medicalClass"
                    value={form.medicalClass}
                    onChange={(e) => setForm((prev) => ({ ...prev, medicalClass: e.target.value }))}
                  >
                    {["1", "2"].map((c) => (
                      <option key={c} value={c}>Classe {c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={closeFormModal}>
                  Annuler
                </button>
                <button className="btn btn-primary" onClick={handleSubmitForm}>
                  {editingPilot ? "Enregistrer les modifications" : "Ajouter le pilote"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Renouveler */}
      <AnimatePresence>
        {renewTarget && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="modal-title">Renouveler le certificat</h3>
              <p className="pilot-sub">
                Pilote : <strong>{renewTarget.name}</strong>
              </p>

              <div className="modal-form">
                <div className="form-field">
                  <label>Nouvelle date d'expiration *</label>
                  <input
                    type="date"
                    value={renewDate}
                    onChange={(e) => setRenewDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => { setRenewTarget(null); setRenewDate(""); }}
                >
                  Annuler
                </button>
                <button className="btn btn-primary" onClick={handleRenew}>
                  Renouveler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Détails du pilote */}
      <AnimatePresence>
        {viewTarget && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeView}
          >
            <motion.div
              className="modal modal-lg"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="modal-title">Détails du pilote</h3>

              <div className="detail-section">
                <div className="detail-section-title">Informations générales</div>
                <div className="detail-grid">
                  <div className="detail-row">
                    <span className="detail-label">Nom complet</span>
                    <span className="detail-value">{viewTarget.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{viewTarget.email || "—"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Nationalité</span>
                    <span className="detail-value">{viewTarget.nationality || "—"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Licence</span>
                    <span className="detail-value">{viewTarget.licenseNumber || "—"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Classe médicale</span>
                    <span className="detail-value">Classe {viewTarget.medicalClass}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">N° Certificat</span>
                    <span className="detail-value">{viewTarget.certificateNumber || "—"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date d'expiration</span>
                    <span className="detail-value">
                      {viewTarget.expiryDate ? new Date(viewTarget.expiryDate).toLocaleDateString("fr-FR") : "—"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Statut</span>
                    <span className="detail-value">
                      {(() => {
                        const s = STATUS_CONFIG[computeStatus(viewTarget.expiryDate)] || STATUS_CONFIG.unknown;
                        return <span className={`badge ${s.cls}`}>{s.label}</span>;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Certificats médicaux ({viewCertificates.length})</div>
                {viewLoading ? (
                  <p className="pilot-sub">Chargement…</p>
                ) : viewCertificates.length === 0 ? (
                  <p className="pilot-sub">Aucun certificat enregistré pour ce pilote.</p>
                ) : (
                  <div className="mini-table">
                    <div className="mini-table-row mini-table-head">
                      <span>N° Certificat</span>
                      <span>Classe</span>
                      <span>Émis le</span>
                      <span>Expire le</span>
                    </div>
                    {viewCertificates.map((c) => (
                      <div className="mini-table-row" key={c.id}>
                        <span>{c.certificateNumber}</span>
                        <span>Classe {c.medicalClass}</span>
                        <span>{new Date(c.issueDate).toLocaleDateString("fr-FR")}</span>
                        <span>{new Date(c.expiryDate).toLocaleDateString("fr-FR")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Historique récent</div>
                {viewLoading ? (
                  <p className="pilot-sub">Chargement…</p>
                ) : viewHistory.length === 0 ? (
                  <p className="pilot-sub">Aucune activité enregistrée.</p>
                ) : (
                  <div className="activity-feed">
                    {viewHistory.map((h) => {
                      const cfg = ACTION_CONFIG[h.action] || { label: h.action, cls: "badge-unknown", icon: Clock };
                      const Icon = cfg.icon;
                      return (
                        <div className="activity-item" key={h.id}>
                          <div className="activity-icon"><Icon size={16} /></div>
                          <div className="activity-body">
                            <p className="activity-title">{cfg.label}</p>
                            <p className="activity-sub">{formatDate(h.createdAt)} · {h.performedBy?.username || "Système"}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button className="btn btn-secondary" onClick={closeView}>Fermer</button>
                <button className="btn btn-primary" onClick={() => { closeView(); openEditModal(viewTarget); }}>
                  Modifier ce pilote
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation de suppression */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer ce pilote ?"
        message={`Cette action est irréversible. Le pilote "${deleteTarget?.name}" et son dossier seront définitivement supprimés.`}
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default Pilots;
