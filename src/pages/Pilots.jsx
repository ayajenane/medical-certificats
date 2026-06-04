import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Archive, RotateCcw, Trash2, Plus, Search, Users } from "lucide-react";
import Sidebar from "../components/Sidebar";
import {
  getPilots, addPilot, archivePilot, restorePilot,
  deletePilot, initPilots, computeStatus, daysUntilExpiry,
} from "../utils/pilots";

const STATUS_CONFIG = {
  active:   { label: "Actif",          cls: "badge-active"   },
  expiring: { label: "Expire bientôt", cls: "badge-expiring" },
  expired:  { label: "Expiré",         cls: "badge-expired"  },
  unknown:  { label: "Inconnu",        cls: "badge-unknown"  },
};

const LICENSE_TYPES = ["ATPL", "CPL", "PPL", "ATCO", "Autre"];

const EMPTY_FORM = {
  name: "", email: "", licenseNumber: "",
  licenseType: "ATPL", nationality: "", medicalClass: "1", expiryDate: "",
};

function Pilots() {
  const navigate = useNavigate();
  const [pilots, setPilots]       = useState([]);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!sessionStorage.getItem("currentUser")) { navigate("/login"); return; }
    initPilots();
    setPilots(getPilots());
  }, [navigate]);

  const refresh = () => setPilots(getPilots());

  const visible = pilots
    .filter((p) => (showArchived ? p.archived : !p.archived))
    .filter((p) => {
      const s = computeStatus(p.expiryDate);
      return filter === "all" || s === filter;
    })
    .filter((p) => {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.licenseNumber || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q)
      );
    });

  const counts = {
    all:      pilots.filter((p) => !p.archived).length,
    active:   pilots.filter((p) => !p.archived && computeStatus(p.expiryDate) === "active").length,
    expiring: pilots.filter((p) => !p.archived && computeStatus(p.expiryDate) === "expiring").length,
    expired:  pilots.filter((p) => !p.archived && computeStatus(p.expiryDate) === "expired").length,
  };

  const handleAdd = () => {
    if (!form.name.trim() || !form.expiryDate) {
      setFormError("Le nom et la date d'expiration sont requis.");
      return;
    }
    addPilot(form);
    refresh();
    setShowModal(false);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleArchive = (id) => { archivePilot(id); refresh(); };
  const handleRestore = (id) => { restorePilot(id); refresh(); };
  const handleDelete  = (id) => {
    if (window.confirm("Supprimer définitivement ce pilote ?")) {
      deletePilot(id); refresh();
    }
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
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <Plus size={16} />
              Ajouter un pilote
            </button>
          </div>
        </header>

        <main className="page-content">
          {/* Search */}
          <div className="search-bar">
            <Search size={15} className="search-bar-icon" />
            <input
              className="search-bar-input"
              type="text"
              placeholder="Rechercher par nom, numéro de licence ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                <span className="tab-count">{counts[f.key]}</span>
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
            {visible.length === 0 ? (
              <div className="empty-state">
                <Users size={36} strokeWidth={1.5} />
                <p>Aucun pilote trouvé.</p>
              </div>
            ) : (
              <div className="data-table">
                <div className="data-table-head">
                  <span>Pilote</span>
                  <span>Licence</span>
                  <span>Classe</span>
                  <span>Expiration</span>
                  <span>Statut</span>
                  <span>Actions</span>
                </div>

                {visible.map((p) => {
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
                        <p className="pilot-name">{p.licenseNumber || "—"}</p>
                        <p className="pilot-sub">{p.licenseType}</p>
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
                      <div className="action-btns">
                        {!p.archived ? (
                          <>
                            <button
                              className="action-btn"
                              title="Ouvrir certificat"
                              onClick={() => navigate("/pdf1")}
                            >
                              <FileText size={14} />
                            </button>
                            <button
                              className="action-btn"
                              title="Archiver"
                              onClick={() => handleArchive(p.id)}
                            >
                              <Archive size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            className="action-btn"
                            title="Restaurer"
                            onClick={() => handleRestore(p.id)}
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        <button
                          className="action-btn danger"
                          title="Supprimer"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
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
              <h3 className="modal-title">Ajouter un pilote</h3>

              {formError && <p className="error-inline">{formError}</p>}

              <div className="modal-form">
                {[
                  { name: "name",          label: "Nom complet *",        type: "text",  placeholder: "Jean Dupont"        },
                  { name: "email",         label: "Email",                type: "email", placeholder: "pilote@example.com" },
                  { name: "licenseNumber", label: "N° Licence",           type: "text",  placeholder: "FR-ATPL-001"        },
                  { name: "nationality",   label: "Nationalité",          type: "text",  placeholder: "Française"          },
                  { name: "expiryDate",    label: "Date d'expiration *",  type: "date",  placeholder: ""                   },
                ].map((f) => (
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
                  <label>Type de licence</label>
                  <select
                    name="licenseType"
                    value={form.licenseType}
                    onChange={(e) => setForm((prev) => ({ ...prev, licenseType: e.target.value }))}
                  >
                    {LICENSE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-field">
                  <label>Classe médicale</label>
                  <select
                    name="medicalClass"
                    value={form.medicalClass}
                    onChange={(e) => setForm((prev) => ({ ...prev, medicalClass: e.target.value }))}
                  >
                    {["1", "2", "3", "4"].map((c) => (
                      <option key={c} value={c}>Classe {c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setFormError(""); }}
                >
                  Annuler
                </button>
                <button className="btn btn-primary" onClick={handleAdd}>
                  Ajouter le pilote
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Pilots;
