import { useNavigate } from "react-router-dom";

function Sidebar({ activePage }) {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");

  const initials = (user.username || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">✈️</span>
        <div>
          <h2> MedCert</h2>
          <p>Maroc</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Navigation</p>
        <a
          className={`sidebar-link${activePage === "dashboard" ? " active" : ""}`}
          onClick={() => navigate("/dashboard")}
          style={{ cursor: "pointer" }}
        >
          Tableau de bord
        </a>

        <p className="sidebar-section-label" style={{ marginTop: "12px" }}>
          Administration
        </p>
        <a
          className={`sidebar-link${activePage === "pilots" ? " active" : ""}`}
          onClick={() => navigate("/pilots")}
          style={{ cursor: "pointer" }}
        >
          Pilotes
        </a>
        <a
          className={`sidebar-link${activePage === "history" ? " active" : ""}`}
          onClick={() => navigate("/history")}
          style={{ cursor: "pointer" }}
        >
          Historique
        </a>

        <p className="sidebar-section-label" style={{ marginTop: "12px" }}>
          Certificats
        </p>
        <a
          className={`sidebar-link${activePage === "pdf1" ? " active" : ""}`}
          onClick={() => navigate("/pdf1")}
          style={{ cursor: "pointer" }}
        >
          Classe 1 — Commercial
        </a>
        <a className="sidebar-link sidebar-link-disabled">Classe 2 — Privé</a>
        <a className="sidebar-link sidebar-link-disabled">Classe 3 — Contrôleur</a>
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div>
          <p className="sidebar-user-name">{user.username || "AME"}</p>
          <p className="sidebar-user-role">Inspecteur médical</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
