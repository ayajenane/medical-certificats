import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User, Mail, Calendar, Shield, Camera, LogOut,
  KeyRound, ChevronLeft, ChevronRight, Save, X,
  Pencil, Clock, Trash2,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import ThemeToggle from "../components/ThemeToggle";
import { useToast } from "../context/ToastContext";
import { getPilotHistory } from "../utils/pilotHistory";
import { ACTION_CONFIG, formatRelativeTime } from "../utils/historyDisplay";
import api from "../utils/api";

const ROLE_LABELS = {
  superadmin: "Super Administrateur",
  admin:      "Inspecteur médical",
};

function Profile() {
  const navigate = useNavigate();
  const toast    = useToast();

  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("currentUser") || "{}"); }
    catch { return {}; }
  });

  const photoKey = `profile_photo_${user._id}`;
  const [photo, setPhoto] = useState(() => localStorage.getItem(photoKey) || null);
  const fileRef = useRef(null);

  // Édition du profil
  const [editMode,    setEditMode]    = useState(false);
  const [editForm,    setEditForm]    = useState({ username: user.username || "", email: user.email || "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError,   setEditError]   = useState("");

  // Changement de mot de passe
  const [pwOpen,    setPwOpen]    = useState(false);
  const [pwForm,    setPwForm]    = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwErrors,  setPwErrors]  = useState({});
  const [pwLoading, setPwLoading] = useState(false);

  // Réalisations (historique piloté par cet admin)
  const [history,         setHistory]         = useState([]);
  const [histPage,        setHistPage]        = useState(1);
  const [histPagination,  setHistPagination]  = useState({ pages: 1, total: 0 });
  const [histLoading,     setHistLoading]     = useState(true);

  useEffect(() => {
    if (!user._id) { navigate("/login"); return; }
    loadHistory(1);
  }, []);

  const loadHistory = (page) => {
    setHistLoading(true);
    getPilotHistory({ page, limit: 8, performedById: user._id })
      .then((res) => {
        setHistory(res.data || []);
        setHistPagination(res.pagination || { pages: 1, total: 0 });
        setHistPage(page);
      })
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  };

  /* ── Photo ── */
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      localStorage.setItem(photoKey, ev.target.result);
      setPhoto(ev.target.result);
      toast.success("Photo de profil mise à jour");
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    localStorage.removeItem(photoKey);
    setPhoto(null);
    toast.success("Photo supprimée");
  };

  /* ── Edit profil ── */
  const openEdit = () => {
    setEditForm({ username: user.username || "", email: user.email || "" });
    setEditError("");
    setEditMode(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.username.trim() || !editForm.email.trim()) {
      setEditError("Tous les champs sont requis");
      return;
    }
    setEditLoading(true);
    setEditError("");
    try {
      const { data } = await api.put("/auth/me", editForm);
      const updated = { ...user, username: data.data.username, email: data.data.email };
      sessionStorage.setItem("currentUser", JSON.stringify(updated));
      setUser(updated);
      setEditMode(false);
      toast.success("Profil mis à jour");
    } catch (err) {
      setEditError(err.response?.data?.message || "Erreur lors de la mise à jour");
    } finally {
      setEditLoading(false);
    }
  };

  /* ── Mot de passe ── */
  const validatePw = () => {
    const errs = {};
    if (!pwForm.currentPassword)                        errs.currentPassword = "Requis";
    if (!pwForm.newPassword)                            errs.newPassword     = "Requis";
    else if (pwForm.newPassword.length < 6)             errs.newPassword     = "Minimum 6 caractères";
    if (pwForm.newPassword !== pwForm.confirmPassword)  errs.confirmPassword = "Les mots de passe ne correspondent pas";
    return errs;
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    const errs = validatePw();
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwLoading(true);
    setPwErrors({});
    try {
      await api.put("/auth/change-password", pwForm);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwOpen(false);
      toast.success("Mot de passe modifié avec succès");
    } catch (err) {
      setPwErrors({ global: err.response?.data?.message || "Erreur" });
    } finally {
      setPwLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const initials = (user.username || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <div className="app-layout">
      <Sidebar activePage="profile" />

      <div className="main-content">
        {/* Navbar */}
        <header className="navbar">
          <div className="navbar-left">
            <span className="navbar-eyebrow">Compte</span>
            <h1 className="navbar-title">Mon profil</h1>
          </div>
          <div className="navbar-right">
            <ThemeToggle />
          </div>
        </header>

        <main className="page-content">

          {/* ── Hero card ── */}
          <motion.div
            className="card profile-hero"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Photo */}
            <div className="profile-photo-wrapper">
              <div className="profile-photo">
                {photo
                  ? <img src={photo} alt="profil" className="profile-photo-img" />
                  : <span className="profile-photo-initials">{initials}</span>
                }
                <button
                  className="profile-photo-btn"
                  onClick={() => fileRef.current?.click()}
                  title="Changer la photo"
                >
                  <Camera size={13} />
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoChange}
              />
              {photo && (
                <button
                  className="profile-photo-remove"
                  onClick={removePhoto}
                  title="Supprimer la photo"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="profile-hero-info">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h2 className="profile-name">{user.username}</h2>
                  <p className="profile-email">
                    <Mail size={12} style={{ marginRight: 5, verticalAlign: "middle" }} />
                    {user.email}
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <span className={`badge ${user.role === "superadmin" ? "badge-info" : "badge-active"}`}>
                      <Shield size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      {ROLE_LABELS[user.role] || "Admin"}
                    </span>
                    <span className="badge badge-unknown">
                      <Calendar size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      Membre depuis {memberSince}
                    </span>
                    <span className="badge badge-unknown">
                      <Clock size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      {histPagination.total} action{histPagination.total !== 1 ? "s" : ""} effectuée{histPagination.total !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <button className="btn btn-danger" onClick={logout} style={{ flexShrink: 0 }}>
                  <LogOut size={15} />
                  Déconnexion
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── Grid : infos + sécurité | réalisations ── */}
          <div className="profile-grid">

            {/* Colonne gauche */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Informations personnelles */}
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <div className="card-header">
                  <div>
                    <h3>Informations personnelles</h3>
                    <p>Modifiez votre nom et votre adresse email</p>
                  </div>
                  {!editMode && (
                    <button className="btn btn-secondary" onClick={openEdit}>
                      <Pencil size={13} /> Modifier
                    </button>
                  )}
                </div>

                {editMode ? (
                  <form onSubmit={handleEditSubmit}>
                    {editError && (
                      <div className="error-inline" style={{ marginBottom: 14 }}>{editError}</div>
                    )}
                    <div className="modal-form">
                      <div className="form-field">
                        <label>Nom d'utilisateur</label>
                        <input
                          value={editForm.username}
                          onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                          placeholder="Nom d'utilisateur"
                        />
                      </div>
                      <div className="form-field">
                        <label>Adresse email</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="email@exemple.com"
                        />
                      </div>
                    </div>
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => { setEditMode(false); setEditError(""); }}
                      >
                        <X size={13} /> Annuler
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={editLoading}>
                        <Save size={13} /> {editLoading ? "Enregistrement…" : "Enregistrer"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="detail-grid">
                    <div className="detail-row">
                      <span className="detail-label">
                        <User size={12} style={{ marginRight: 6, verticalAlign: "middle" }} />Nom
                      </span>
                      <span className="detail-value">{user.username}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">
                        <Mail size={12} style={{ marginRight: 6, verticalAlign: "middle" }} />Email
                      </span>
                      <span className="detail-value">{user.email}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">
                        <Shield size={12} style={{ marginRight: 6, verticalAlign: "middle" }} />Rôle
                      </span>
                      <span className="detail-value">{ROLE_LABELS[user.role] || user.role}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">
                        <Calendar size={12} style={{ marginRight: 6, verticalAlign: "middle" }} />Membre depuis
                      </span>
                      <span className="detail-value">{memberSince}</span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Sécurité */}
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="card-header">
                  <div>
                    <h3>Sécurité</h3>
                    <p>Modifiez votre mot de passe de connexion</p>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => { setPwOpen((v) => !v); setPwErrors({}); setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }}
                  >
                    <KeyRound size={13} /> {pwOpen ? "Annuler" : "Changer"}
                  </button>
                </div>

                {pwOpen && (
                  <form onSubmit={handlePwSubmit}>
                    {pwErrors.global && (
                      <div className="error-inline" style={{ marginBottom: 14 }}>{pwErrors.global}</div>
                    )}
                    <div className="modal-form">
                      <div className="form-field">
                        <label>Mot de passe actuel</label>
                        <input
                          type="password"
                          value={pwForm.currentPassword}
                          onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                          placeholder="••••••••"
                        />
                        {pwErrors.currentPassword && <span className="field-error">{pwErrors.currentPassword}</span>}
                      </div>
                      <div className="form-field">
                        <label>Nouveau mot de passe</label>
                        <input
                          type="password"
                          value={pwForm.newPassword}
                          onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                          placeholder="••••••••"
                        />
                        {pwErrors.newPassword && <span className="field-error">{pwErrors.newPassword}</span>}
                      </div>
                      <div className="form-field">
                        <label>Confirmer le mot de passe</label>
                        <input
                          type="password"
                          value={pwForm.confirmPassword}
                          onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                          placeholder="••••••••"
                        />
                        {pwErrors.confirmPassword && <span className="field-error">{pwErrors.confirmPassword}</span>}
                      </div>
                    </div>
                    <div className="modal-actions">
                      <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                        <Save size={13} /> {pwLoading ? "Enregistrement…" : "Enregistrer"}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>

            </div>

            {/* Colonne droite — réalisations */}
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.07 }}
            >
              <div className="card-header">
                <div>
                  <h3>Mes réalisations</h3>
                  <p>
                    {histPagination.total > 0
                      ? `${histPagination.total} action${histPagination.total > 1 ? "s" : ""} effectuée${histPagination.total > 1 ? "s" : ""}`
                      : "Aucune action enregistrée"}
                  </p>
                </div>
              </div>

              {histLoading ? (
                <div className="empty-state">
                  <Clock size={28} strokeWidth={1.5} />
                  <p>Chargement…</p>
                </div>
              ) : history.length === 0 ? (
                <div className="empty-state">
                  <Clock size={28} strokeWidth={1.5} />
                  <p>Aucune action enregistrée pour ce compte.</p>
                </div>
              ) : (
                <>
                  <div className="activity-feed">
                    {history.map((h) => {
                      const cfg = ACTION_CONFIG[h.action] || { label: h.action, cls: "badge-unknown", icon: Clock };
                      const Icon = cfg.icon;
                      return (
                        <div className="activity-item" key={h.id}>
                          <div className="activity-icon">
                            <Icon size={15} />
                          </div>
                          <div className="activity-body">
                            <p className="activity-title">{cfg.label}</p>
                            <p className="activity-sub">{h.pilotName}</p>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                            <span className={`badge ${cfg.cls}`} style={{ fontSize: 10 }}>{cfg.label}</span>
                            <span className="activity-time">{formatRelativeTime(h.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {histPagination.pages > 1 && (
                    <div className="pagination">
                      <span className="pagination-info">
                        Page {histPage} / {histPagination.pages}
                      </span>
                      <div className="pagination-btns">
                        <button
                          className="action-btn"
                          onClick={() => loadHistory(histPage - 1)}
                          disabled={histPage === 1}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => loadHistory(histPage + 1)}
                          disabled={histPage >= histPagination.pages}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>

          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default Profile;
