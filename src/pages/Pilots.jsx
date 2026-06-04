import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  getPilots,
  addPilot,
  archivePilot,
  restorePilot,
  deletePilot,
  initPilots,
  computeStatus,
  daysUntilExpiry,
} from "../utils/pilots";

const STATUS_CONFIG = {
  active:   { label: "Actif",           cls: "badge-active" },
  expiring: { label: "Expire bientôt",  cls: "badge-expiring" },
  expired:  { label: "Expiré",          cls: "badge-expired" },
  unknown:  { label: "Inconnu",         cls: "badge-unknown" },
};

const LICENSE_TYPES = ["ATPL", "CPL", "PPL", "ATCO", "Autre"];

const EMPTY_FORM = {
  name: "", email: "", licenseNumber: "",
  licenseType: "ATPL", nationality: "", medicalClass: "1", expiryDate: "",
};

function Pilots() {
  const navigate = useNavigate();
  const [pilots, setPilots] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
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

  const logout = () => { sessionStorage.removeItem("currentUser"); navigate("/login"); };

  return (
    <div className="dashboard-layout">
      <Sidebar activePage="pilots" />

      <main className="dashboard-main">
        <header className="dashboard-navbar">
          <div className="navbar-brand">
            <span className="navbar-brand-icon">👥</span>
            <div>
              <h1>Gestion des pilotes</h1>
              <p>Suivi des aptitudes médicales par pilote</p>
            </div>
          </div>
          <div className="navbar-actions">
            <button className="pdf-button" onClick={() => setShowModal(true)}>
              + Ajouter un pilote
            </button>
            <button className="logout-button" onClick={logout}>Déconnexion</button>
          </div>
        </header>

        <section className="dashboard-content">
          {/* Search */}
          <div className="search-bar-wrapper">
            <input
              className="search-input"
              type="text"
              placeholder="🔍  Rechercher par nom, licence ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter pills */}
          <div className="filter-pills">
            {[
              { key: "all",      label: "Tous" },
              { key: "active",   label: "Actifs" },
              { key: "expiring", label: "Expirent bientôt" },
              { key: "expired",  label: "Expirés" },
            ].map((f) => (
              <button
                key={f.key}
                className={`filter-pill${filter === f.key ? " active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label} <span className="pill-count">{counts[f.key]}</span>
              </button>
            ))}
            <button
              className={`filter-pill${showArchived ? " active" : ""}`}
              onClick={() => { setShowArchived((v) => !v); setFilter("all"); }}
            >
              📦 Archivés
            </button>
          </div>

          {/* Table */}
          <div className="panel">
            {visible.length === 0 ? (
              <p style={{ color: "var(--muted)", textAlign: "center", padding: "32px 0" }}>
                Aucun pilote trouvé.
              </p>
            ) : (
              <div className="pilots-table">
                <div className="pilots-table-head">
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
                    <div className="pilots-table-row" key={p.id}>
                      <div>
                        <p className="pilot-name">{p.name}</p>
                        <p className="pilot-sub">{p.email}</p>
                      </div>
                      <div>
                        <p className="pilot-name">{p.licenseNumber || "—"}</p>
                        <p className="pilot-sub">{p.licenseType}</p>
                      </div>
                      <div>
                        <span className="pilot-class-badge">Classe {p.medicalClass}</span>
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
                        <span className={`status-badge ${cfg.cls}`}>{cfg.label}</span>
                      </div>
                      <div className="pilot-actions">
                        {!p.archived ? (
                          <>
                            <button
                              className="action-btn"
                              title="Ouvrir certificat"
                              onClick={() => navigate("/pdf1")}
                            >📋</button>
                            <button
                              className="action-btn"
                              title="Archiver"
                              onClick={() => handleArchive(p.id)}
                            >📦</button>
                          </>
                        ) : (
                          <button
                            className="action-btn"
                            title="Restaurer"
                            onClick={() => handleRestore(p.id)}
                          >♻️</button>
                        )}
                        <button
                          className="action-btn action-delete"
                          title="Supprimer"
                          onClick={() => handleDelete(p.id)}
                        >🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modal ajout pilote */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3 style={{ margin: "0 0 16px" }}>Ajouter un pilote</h3>
            {formError && <p className="error-message">{formError}</p>}
            <div className="modal-form">
              {[
                { name: "name",          label: "Nom complet *",       type: "text",  placeholder: "Jean Dupont" },
                { name: "email",         label: "Email",               type: "email", placeholder: "pilote@example.com" },
                { name: "licenseNumber", label: "N° Licence",          type: "text",  placeholder: "FR-ATPL-001" },
                { name: "nationality",   label: "Nationalité",         type: "text",  placeholder: "Française" },
                { name: "expiryDate",    label: "Date d'expiration *", type: "date",  placeholder: "" },
              ].map((f) => (
                <div className="modal-row" key={f.name}>
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
              <div className="modal-row">
                <label>Type de licence</label>
                <select
                  name="licenseType"
                  value={form.licenseType}
                  onChange={(e) => setForm((prev) => ({ ...prev, licenseType: e.target.value }))}
                >
                  {LICENSE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="modal-row">
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
                className="modal-cancel"
                onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setFormError(""); }}
              >Annuler</button>
              <button className="modal-submit" onClick={handleAdd}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pilots;
