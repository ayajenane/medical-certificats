import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  History,
  FileText,
  LogOut,
  Shield,
  ChevronRight,
  UserPlus,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard",    label: "Tableau de bord",     icon: LayoutDashboard, path: "/dashboard"    },
  { key: "pilots",       label: "Gestion des pilotes", icon: Users,           path: "/pilots"       },
  { key: "certificates", label: "Certificats",         icon: FileText,        path: "/certificates" },
  { key: "history",      label: "Historique",          icon: History,         path: "/history"      },
];

const CERT_ITEMS = [
  { key: "pdf1", label: "Classe 1 — Commercial", icon: FileText, path: "/pdf1", available: true  },
  { key: "pdf2", label: "Classe 2 — Privé",      icon: FileText, path: null,    available: false },
  { key: "pdf3", label: "Classe 3 — Contrôleur", icon: FileText, path: null,    available: false },
];

const ROLE_LABELS = {
  superadmin: "Super Administrateur",
  admin: "Inspecteur médical",
};

function Sidebar({ activePage }) {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const isSuperAdmin = user.role === "superadmin";

  const initials = (user.username || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const logout = () => {
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Shield size={20} />
        </div>
        <div>
          <span className="sidebar-brand-name">MedCert</span>
          <span className="sidebar-brand-sub">Aviation · Maroc</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="sidebar-section">Navigation</span>
        {NAV_ITEMS.map(({ key, label, icon: Icon, path }) => (
          <button
            key={key}
            className={`sidebar-item${activePage === key ? " active" : ""}`}
            onClick={() => navigate(path)}
          >
            <Icon size={17} />
            <span>{label}</span>
            {activePage === key && <ChevronRight size={13} className="sidebar-item-arrow" />}
          </button>
        ))}

        {isSuperAdmin && (
          <>
            <span className="sidebar-section" style={{ marginTop: 8 }}>
              Administration
            </span>
            <button
              className={`sidebar-item${activePage === "create-admin" ? " active" : ""}`}
              onClick={() => navigate("/register")}
            >
              <UserPlus size={17} />
              <span>Créer un admin</span>
              {activePage === "create-admin" && <ChevronRight size={13} className="sidebar-item-arrow" />}
            </button>
          </>
        )}

        <span className="sidebar-section" style={{ marginTop: 8 }}>
          Certificats médicaux
        </span>
        {CERT_ITEMS.map(({ key, label, icon: Icon, path, available }) => (
          <button
            key={key}
            className={`sidebar-item${activePage === key ? " active" : ""}${!available ? " disabled" : ""}`}
            onClick={() => available && navigate(path)}
            disabled={!available}
          >
            <Icon size={17} />
            <span>{label}</span>
            {!available && <span className="sidebar-soon">Bientôt</span>}
          </button>
        ))}
      </nav>

      {/* Footer: user + logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.username || "AME"}</span>
            <span className="sidebar-user-role">{ROLE_LABELS[user.role] || "Inspecteur médical"}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout} title="Déconnexion">
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
