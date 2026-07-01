import { useNavigate } from "react-router-dom";

const ROLE_LABELS = {
  superadmin: "Super Administrateur",
  admin:      "Inspecteur médical",
};

function NavbarUser() {
  const navigate = useNavigate();
  const user  = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const photo = localStorage.getItem(`profile_photo_${user._id}`);
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
