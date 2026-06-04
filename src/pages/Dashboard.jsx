import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getPilots, initPilots, computeStatus, daysUntilExpiry } from "../utils/pilots";

const CERT_FORMS = [
  {
    id: "pdf1",
    title: "Certificat Médical — Classe 1",
    description: "Pilotes commerciaux (ATPL/CPL). Délivré par AME agréé.",
    route: "/pdf1",
  },
  {
    id: "pdf2",
    title: "Certificat Médical — Classe 2",
    description: "Pilotes privés (PPL). Renouvellement annuel requis.",
    route: null,
  },
  {
    id: "pdf3",
    title: "Certificat Médical — Classe 3",
    description: "Contrôleurs de la circulation aérienne (ATCO).",
    route: null,
  },
];

function getCurrentDate() {
  return new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [pilots, setPilots]   = useState([]);
  const [search, setSearch]   = useState("");
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("currentUser");
    if (!stored) { navigate("/login"); return; }
    setUser(JSON.parse(stored));
    initPilots();
    setPilots(getPilots());
  }, [navigate]);

  const logout = () => { sessionStorage.removeItem("currentUser"); localStorage.removeItem("token"); navigate("/login"); };

  if (!user) return null;

  const activePilots   = pilots.filter((p) => !p.archived);
  const expiringPilots = activePilots.filter((p) => computeStatus(p.expiryDate) === "expiring");
  const expiredPilots  = activePilots.filter((p) => computeStatus(p.expiryDate) === "expired");
  const validPilots    = activePilots.filter((p) => computeStatus(p.expiryDate) === "active");

  const stats = [
    { label: "Total pilotes", value: activePilots.length,   note: "Hors archivés" },
    { label: "Certificats valides",  value: validPilots.length,    note: "En cours de validité" },
    { label: "Expirations proches", value: expiringPilots.length, note: "< 30 jours" },
    { label: "Certificats expirés", value: expiredPilots.length, note: "À régulariser" },
  ];

  const showAlert = !alertDismissed && (expiringPilots.length > 0 || expiredPilots.length > 0);

  const firstName = user.username?.split(" ")[0] ?? "";

  const filteredForms = CERT_FORMS.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <Sidebar activePage="dashboard" />

      <main className="dashboard-main">
        <header className="dashboard-navbar">
          <div className="navbar-info">
            <span className="navbar-subtitle">Direction Générale de l'Aviation Civile</span>
            <h1>Gestion des certificats médicaux des pilotes</h1>
          </div>
          <div className="navbar-actions">
            <label className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Rechercher un pilote, un certificat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <button className="icon-button" type="button" aria-label="Aide">?</button>
            <button className="icon-button" type="button" aria-label="Notifications">🔔</button>
            <div className="user-chip">
              <span className="user-initials">{firstName ? firstName[0] : "I"}</span>
              <div className="user-info">
                <strong>{user.username || "Inspecteur"}</strong>
                <span>Inspecteur médical</span>
              </div>
            </div>
          </div>
        </header>

        <section className="dashboard-content">
          {/* Alerte expiration */}
          {showAlert && (
            <div className="alert-banner">
              <div className="alert-content">
                <span className="alert-icon">⚠️</span>
                <div>
                  {expiredPilots.length > 0 && (
                    <p><strong>{expiredPilots.length} certificat(s) expiré(s)</strong> — action requise immédiatement.</p>
                  )}
                  {expiringPilots.length > 0 && (
                    <p>
                      <strong>{expiringPilots.length} certificat(s)</strong> expirent dans les 30 jours :&nbsp;
                      {expiringPilots.map((p, i) => (
                        <span key={p.id}>
                          {p.name} ({daysUntilExpiry(p.expiryDate)}j){i < expiringPilots.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
                <button className="alert-action" onClick={() => navigate("/pilots")}>
                  Voir les pilotes
                </button>
              </div>
              <button className="alert-dismiss" onClick={() => setAlertDismissed(true)}>✕</button>
            </div>
          )}

          {/* Bienvenue */}
          <div className="dashboard-welcome">
            <div>
              <h2>Bienvenue, {firstName}</h2>
              <p style={{ color: "var(--muted)", marginTop: "6px" }}>
                Vue d'ensemble des certificats et rappels administratifs.
              </p>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "14px", whiteSpace: "nowrap" }}>
              Date de consultation&nbsp;: {getCurrentDate()}
            </p>
          </div>

          {/* Stats */}
          <div className="dashboard-cards">
            {stats.map((s) => (
              <div className="dashboard-card" key={s.label}>
                <h3>{s.label}</h3>
                <p>{s.value}</p>
                <span>{s.note}</span>
              </div>
            ))}
          </div>

          {/* Liste des formulaires certificats */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Formulaires de certificats</h3>
                <p>Choisissez le formulaire adapté et générez le PDF officiel.</p>
              </div>
            </div>

            <div className="pdf-list">
              {filteredForms.map((doc) => (
                <div className="pdf-card" key={doc.id}>
                  <div className="pdf-card-title">
                    <div>
                      <h4>{doc.title}</h4>
                      <p>{doc.description}</p>
                    </div>
                    <span className={`pdf-badge${doc.route ? " pdf-badge-success" : ""}`}>
                      {doc.route ? "Disponible" : "Bientôt"}
                    </span>
                  </div>
                  <div className="pdf-card-meta">
                    {doc.route && (
                      <button className="pdf-button" onClick={() => navigate(doc.route)}>
                        Ouvrir le formulaire →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
