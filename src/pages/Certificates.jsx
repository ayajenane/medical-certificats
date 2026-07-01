import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, ChevronLeft, ChevronRight, Eye, Download } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";
import Footer from "../components/Footer";
import { getCertificates } from "../utils/certificates";
import { formatDate } from "../utils/historyDisplay";

const STATUS_CONFIG = {
  active:   { label: "Actif",          cls: "badge-active"   },
  expiring: { label: "Expire bientôt", cls: "badge-expiring" },
  expired:  { label: "Expiré",         cls: "badge-expired"  },
};

const FILTERS = [
  { key: "all",      label: "Tous"             },
  { key: "active",   label: "Actifs"           },
  { key: "expiring", label: "Expirent bientôt" },
  { key: "expired",  label: "Expirés"          },
];

const SORT_OPTIONS = [
  { value: "-createdAt",  label: "Génération (plus récent)"  },
  { value: "createdAt",   label: "Génération (plus ancien)"  },
  { value: "-issueDate",  label: "Émission (plus récent)"    },
  { value: "issueDate",   label: "Émission (plus ancien)"    },
  { value: "expiryDate",  label: "Expiration (croissant)"    },
  { value: "-expiryDate", label: "Expiration (décroissant)"  },
];

const CERT_FORM_LABELS = {
  // Pdf1 — Classe 1
  certificate_number:  "Numéro de certificat",
  holder_name:         "Nom du titulaire",
  birth_details:       "Date et lieu de naissance",
  address:             "Adresse",
  nationality:         "Nationalité",
  signature:           "Signature du titulaire",
  issue_date:          "Date d'émission",
  restrictions:        "Restrictions / Limitations",
  doctor_signature:    "Signature du médecin (AME/AMC)",
  class1_expiry:       "Expiration Classe 1",
  class2_expiry:       "Expiration Classe 2",
  exam_date:           "Date d'examen",
  next_ecg:            "Prochain ECG",
  next_audiogram:      "Prochain audiogramme",
  next_ent:            "Prochain examen ORL",
  next_ophthalmology:  "Prochain examen ophtalmologique",
  // Pdf2 — Classe 2 / LAPL
  state_authority:       "État / Autorité émettrice",
  birth_date:            "Date de naissance",
  holder_signature:      "Signature du titulaire",
  expiry_class1_single:  "Expiration Cl.1 — Monopilote commercial",
  expiry_class1_other:   "Expiration Cl.1 — Autres exploitations",
  expiry_class2:         "Expiration Classe 2",
  expiry_lapl:           "Expiration LAPL",
  ame_signature:         "Signature AME / Évaluateur médical",
  stamp:                 "Cachet",
  last_medical_date:     "Dernier examen médical",
  last_ecg_date:         "Dernier ECG",
  last_audiogram_date:   "Dernier audiogramme",
};

function formatFormValue(value) {
  if (value === undefined || value === null || value === "") return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(value).toLocaleDateString("fr-FR");
  return String(value);
}

function Certificates() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [filter, setFilter]         = useState("all");
  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort]             = useState("-createdAt");
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);

  useEffect(() => {
    if (!sessionStorage.getItem("currentUser")) navigate("/login");
  }, [navigate]);

  // Débounce de la recherche
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Revient à la page 1 lorsque la recherche, le filtre ou le tri changent
  const filtersRef = useRef({ filter, sort, debouncedSearch });

  useEffect(() => {
    if (!sessionStorage.getItem("currentUser")) return;

    const filtersChanged =
      filtersRef.current.filter !== filter ||
      filtersRef.current.sort !== sort ||
      filtersRef.current.debouncedSearch !== debouncedSearch;
    filtersRef.current = { filter, sort, debouncedSearch };
    const targetPage = filtersChanged ? 1 : page;

    let cancelled = false;
    setLoading(true);
    getCertificates({ page: targetPage, limit: 10, sort, status: filter, search: debouncedSearch })
      .then((res) => {
        if (cancelled) return;
        setCertificates(res.data);
        setPagination(res.pagination);
        if (filtersChanged) setPage(1);
      })
      .catch(() => { if (!cancelled) setCertificates([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, filter, sort, debouncedSearch]);

  const formEntries = selected?.formData ? Object.entries(selected.formData) : [];

  const handleRegenerate = (cert) => {
    const route = cert.medicalClass === "2" ? "/pdf2" : "/pdf1";
    navigate(route, { state: { certificate: cert } });
  };

  return (
    <div className="app-layout">
      <Sidebar activePage="certificates" />

      <div className="main-content">
        {/* Navbar */}
        <header className="navbar">
          <div className="navbar-left">
            <span className="navbar-eyebrow">Administration</span>
            <h1 className="navbar-title">Certificats médicaux</h1>
          </div>
          <div className="navbar-right">
            <ThemeToggle />
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
                placeholder="Rechercher par pilote ou n° de certificat…"
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

          {/* Tabs / Filters */}
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
          </div>

          {/* Table */}
          <div className="card">
            {loading ? (
              <div className="empty-state">
                <FileText size={36} strokeWidth={1.5} />
                <p>Chargement des certificats…</p>
              </div>
            ) : certificates.length === 0 ? (
              <div className="empty-state">
                <FileText size={36} strokeWidth={1.5} />
                <p>Aucun certificat trouvé.</p>
              </div>
            ) : (
              <div className="history-table">
                <div className="history-table-head">
                  <span>Émis le</span>
                  <span>Pilote</span>
                  <span>Statut</span>
                  <span>Expire le</span>
                  <span></span>
                </div>

                {certificates.map((c) => {
                  const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.active;
                  return (
                    <div
                      className="history-table-row"
                      key={c.id}
                      onClick={() => setSelected(c)}
                    >
                      <span className="history-time">
                        {new Date(c.issueDate).toLocaleDateString("fr-FR")}
                      </span>
                      <div>
                        <p className="pilot-name">{c.pilotName}</p>
                        <p className="pilot-sub">N° {c.certificateNumber} · Classe {c.medicalClass}</p>
                      </div>
                      <span><span className={`badge ${cfg.cls}`}>{cfg.label}</span></span>
                      <span className="pilot-sub">{new Date(c.expiryDate).toLocaleDateString("fr-FR")}</span>
                      <div className="action-btns" style={{ justifyContent: "flex-end", gap: 6 }}>
                        <button
                          className="action-btn"
                          title="Voir le détail"
                          onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="action-btn"
                          title="Régénérer le PDF"
                          onClick={(e) => { e.stopPropagation(); handleRegenerate(c); }}
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && certificates.length > 0 && (
              <div className="pagination">
                <span className="pagination-info">
                  Page {pagination.page} / {pagination.pages} · {pagination.total} certificat(s)
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
              className="modal modal-lg"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="modal-title">Détail du certificat</h3>

              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">N° Certificat</span>
                  <span className="detail-value">{selected.certificateNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Pilote</span>
                  <span className="detail-value">{selected.pilotName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Classe médicale</span>
                  <span className="detail-value">Classe {selected.medicalClass}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Statut</span>
                  <span className="detail-value">
                    {(() => {
                      const cfg = STATUS_CONFIG[selected.status] || { label: selected.status, cls: "badge-unknown" };
                      return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
                    })()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date d'émission</span>
                  <span className="detail-value">{new Date(selected.issueDate).toLocaleDateString("fr-FR")}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date d'expiration</span>
                  <span className="detail-value">{new Date(selected.expiryDate).toLocaleDateString("fr-FR")}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Généré par</span>
                  <span className="detail-value">{selected.generatedBy?.username || "Système"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Généré le</span>
                  <span className="detail-value">{formatDate(selected.createdAt)}</span>
                </div>
              </div>

              {formEntries.length > 0 && (
                <>
                  <h3 className="modal-title" style={{ marginTop: 24, marginBottom: 12, fontSize: 14 }}>
                    Détails du formulaire
                  </h3>
                  <div className="detail-grid">
                    {formEntries.map(([key, value]) => (
                      <div className="detail-row" key={key}>
                        <span className="detail-label">{CERT_FORM_LABELS[key] || key}</span>
                        <span className="detail-value">{formatFormValue(value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => { setSelected(null); handleRegenerate(selected); }}
                >
                  <Download size={14} style={{ marginRight: 6 }} />
                  Régénérer le PDF
                </button>
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

export default Certificates;
