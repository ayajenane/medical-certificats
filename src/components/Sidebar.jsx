import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  History,
  FileText,
  LogOut,
  ChevronRight,
  Settings,
  KeyRound,
  Menu,
  X,
} from "lucide-react";
import ChangePasswordModal from "./ChangePasswordModal";

// liens de navigation principaux, visibles par tous les utilisateurs connectés
const NAV_ITEMS = [
  { key: "dashboard",    label: "Tableau de bord",     icon: LayoutDashboard, path: "/dashboard"    },
  { key: "pilots",       label: "Gestion des pilotes", icon: Users,           path: "/pilots"       },
  { key: "certificates", label: "Certificats",         icon: FileText,        path: "/certificates" },
  { key: "history",      label: "Historique",          icon: History,         path: "/history"      },
];

// modèles de certificats disponibles; path: null + available: false = fonctionnalité pas encore prête
const CERT_ITEMS = [
  { key: "pdf1", label: "Classe 1 — Commercial", icon: FileText, path: "/pdf1", available: true  },
  { key: "pdf2", label: "Classe 2 — Privé",      icon: FileText, path: "/pdf2", available: true  },
  { key: "pdf3", label: "Classe 3 — Contrôleur", icon: FileText, path: null,    available: false },
];

const ROLE_LABELS = {
  superadmin: "Super Administrateur",
  admin: "Inspecteur médical",
};

// menu latéral principal: navigation, section admin réservée aux superadmins, et bloc utilisateur/déconnexion
function Sidebar({ activePage }) {
  const navigate = useNavigate();
  const [showChangePw, setShowChangePw] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // sidebar repliée en tiroir sur mobile
  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const isSuperAdmin = user.role === "superadmin"; // conditionne l'affichage de la section Administration

  const initials = (user.username || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  // bloque le scroll du body derrière le menu mobile ouvert
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // navigue et referme automatiquement le tiroir mobile
  const goTo = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  // vire la session et redirige vers le login
  const logout = () => {
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      {/* bouton hamburger visible uniquement quand le menu mobile est fermé */}
      {!mobileOpen && (
        <button
          className="sidebar-mobile-toggle"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* fond semi-transparent derrière le menu mobile, clic dessus = fermer */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar${mobileOpen ? " sidebar-open" : ""}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="sidebar-brand-name">Medical Certification</span>
            <span className="sidebar-brand-sub">Aviation · Maroc</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <span className="sidebar-section">Navigation</span>
          {NAV_ITEMS.map(({ key, label, icon: Icon, path }) => (
            <button
              key={key}
              className={`sidebar-item${activePage === key ? " active" : ""}`}
              onClick={() => goTo(path)}
            >
              <Icon size={17} />
              <span>{label}</span>
              {activePage === key && <ChevronRight size={13} className="sidebar-item-arrow" />}
            </button>
          ))}

          {/* section Administration réservée aux comptes superadmin */}
          {isSuperAdmin && (
            <>
              <span className="sidebar-section" style={{ marginTop: 8 }}>
                Administration
              </span>
              <button
                className={`sidebar-item${activePage === "admin-management" ? " active" : ""}`}
                onClick={() => goTo("/admin-management")}
              >
                <Settings size={17} />
                <span>Gestion des admins</span>
                {activePage === "admin-management" && <ChevronRight size={13} className="sidebar-item-arrow" />}
              </button>
              <button
                className={`sidebar-item${activePage === "admin-history" ? " active" : ""}`}
                onClick={() => goTo("/admin-history")}
              >
                <History size={17} />
                <span>Historique admins</span>
                {activePage === "admin-history" && <ChevronRight size={13} className="sidebar-item-arrow" />}
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
              onClick={() => available && goTo(path)} // clic ignoré si le certificat n'est pas encore disponible
              disabled={!available}
            >
              <Icon size={17} />
              <span>{label}</span>
              {!available && <span className="sidebar-soon">Bientôt</span>}
            </button>
          ))}
        </nav>

        {/* Footer: avatar utilisateur, changement de mot de passe, déconnexion */}
        <div className="sidebar-footer">
          <div
            className="sidebar-user"
            onClick={() => goTo("/profile")}
            title="Mon profil"
            style={{ cursor: "pointer" }}
          >
            <div className="sidebar-avatar" style={{ overflow: "hidden" }}>
              {(() => {
                const p = localStorage.getItem(`profile_photo_${user._id}`);
                return p
                  ? <img src={p} alt="profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : initials;
              })()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.username || "AME"}</span>
              <span className="sidebar-user-role">{ROLE_LABELS[user.role] || "Inspecteur médical"}</span>
            </div>
          </div>
          <button
            className="sidebar-logout"
            onClick={() => setShowChangePw(true)}
            title="Changer mon mot de passe"
          >
            <KeyRound size={17} />
          </button>
          <button className="sidebar-logout" onClick={logout} title="Déconnexion">
            <LogOut size={17} />
          </button>
        </div>

        {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
      </aside>
    </>
  );
}

export default Sidebar;
