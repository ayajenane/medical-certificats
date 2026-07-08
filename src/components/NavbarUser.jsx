import { useNavigate } from "react-router-dom";

// libellés affichés selon le rôle stocké en base (admin = inspecteur médical par défaut)
const ROLE_LABELS = {
  superadmin: "Super Administrateur",
  admin:      "Inspecteur médical",
};

// bloc cliquable dans la navbar affichant l'avatar + nom de l'utilisateur connecté, mène au profil
function NavbarUser() {
  const navigate = useNavigate();
  const user  = JSON.parse(sessionStorage.getItem("currentUser") || "{}"); // utilisateur courant stocké à la connexion
  const photo = localStorage.getItem(`profile_photo_${user._id}`); // photo de profil sauvegardée localement
  // fallback avatar avec les initiales si pas de photo de profil
  const initials = (user.username || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div
      className="navbar-user"
      onClick={() => navigate("/profile")}
      title="Mon profil"
      style={{ cursor: "pointer" }}
    >
      <div className="navbar-avatar" style={{ overflow: "hidden" }}>
        {/* affiche la photo si elle existe, sinon les initiales en fallback */}
        {photo
          ? <img src={photo} alt="profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : initials
        }
      </div>
      <div>
        <p className="navbar-username">{user.username || "Admin"}</p>
        <p className="navbar-role">{ROLE_LABELS[user.role] || "Inspecteur médical"}</p>
      </div>
    </div>
  );
}

export default NavbarUser;
