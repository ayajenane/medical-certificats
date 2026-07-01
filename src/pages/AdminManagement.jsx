import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Pencil, Trash2, KeyRound, X, Eye, EyeOff, UserPlus } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";
import Footer from "../components/Footer";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../context/ToastContext";
import api from "../utils/api";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function PasswordField({ label, name, value, onChange, error, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div className="form-field">
      <label>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          name={name}
          placeholder="••••••••"
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={error ? "input-error" : ""}
          style={{ paddingRight: 40 }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", padding: 0, display: "flex",
          }}
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

function AdminManagement() {
  const toast = useToast();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", email: "" });
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const [resetTarget, setResetTarget] = useState(null);
  const [resetForm, setResetForm] = useState({ newPassword: "", confirmPassword: "" });
  const [resetErrors, setResetErrors] = useState({});
  const [resetLoading, setResetLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [createErrors, setCreateErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/admins");
      setAdmins(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors du chargement des administrateurs");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (admin) => {
    setEditTarget(admin);
    setEditForm({ username: admin.username, email: admin.email });
    setEditErrors({});
  };

  const validateEdit = () => {
    const e = {};
    if (!editForm.username.trim()) e.username = "Le nom est requis.";
    if (!editForm.email.trim()) e.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) e.email = "Email invalide.";
    setEditErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEdit()) return;
    setEditLoading(true);
    try {
      const res = await api.put(`/auth/admins/${editTarget._id}`, editForm);
      setAdmins((prev) => prev.map((a) => (a._id === editTarget._id ? res.data.data : a)));
      setEditTarget(null);
      toast.success("Administrateur modifié avec succès");
    } catch (err) {
      setEditErrors({ submit: err.response?.data?.message || "Erreur lors de la modification" });
    } finally {
      setEditLoading(false);
    }
  };

  const openReset = (admin) => {
    setResetTarget(admin);
    setResetForm({ newPassword: "", confirmPassword: "" });
    setResetErrors({});
  };

  const validateReset = () => {
    const e = {};
    if (!resetForm.newPassword) e.newPassword = "Requis.";
    else if (resetForm.newPassword.length < 6) e.newPassword = "Minimum 6 caractères.";
    if (resetForm.newPassword !== resetForm.confirmPassword) e.confirmPassword = "Les mots de passe ne correspondent pas.";
    setResetErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!validateReset()) return;
    setResetLoading(true);
    try {
      await api.put(`/auth/admins/${resetTarget._id}/reset-password`, resetForm);
      setResetTarget(null);
      toast.success(`Mot de passe de ${resetTarget.username} réinitialisé`);
    } catch (err) {
      setResetErrors({ submit: err.response?.data?.message || "Erreur lors de la réinitialisation" });
    } finally {
      setResetLoading(false);
    }
  };

  const openCreate = () => {
    setCreateForm({ username: "", email: "", password: "", confirmPassword: "" });
    setCreateErrors({});
    setShowCreate(true);
  };

  const validateCreate = () => {
    const e = {};
    if (!createForm.username.trim()) e.username = "Le nom est requis.";
    if (!createForm.email.trim()) e.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) e.email = "Email invalide.";
    if (!createForm.password) e.password = "Le mot de passe est requis.";
    else if (createForm.password.length < 6) e.password = "Minimum 6 caractères.";
    if (createForm.password !== createForm.confirmPassword) e.confirmPassword = "Les mots de passe ne correspondent pas.";
    setCreateErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateCreate()) return;
    setCreateLoading(true);
    try {
      const res = await api.post("/auth/register", {
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        confirmPassword: createForm.confirmPassword,
      });
      if (res.status === 201) {
        await fetchAdmins();
        setShowCreate(false);
        toast.success("Administrateur créé avec succès");
      }
    } catch (err) {
      setCreateErrors({ submit: err.response?.data?.message || "Erreur lors de la création" });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/auth/admins/${deleteTarget._id}`);
      setAdmins((prev) => prev.filter((a) => a._id !== deleteTarget._id));
      setDeleteTarget(null);
      toast.success("Administrateur supprimé");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage="admin-management" />

      <div className="main-content">
        <div className="navbar">
          <div className="navbar-left">
            <span className="navbar-eyebrow">Administration</span>
            <span className="navbar-title">Gestion des administrateurs</span>
          </div>
          <div className="navbar-right">
            <ThemeToggle />
          </div>
        </div>

        <div className="page-content">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "20px 24px", borderBottom: "1px solid var(--border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="stat-icon blue" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Administrateurs</h3>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {admins.length} compte{admins.length !== 1 ? "s" : ""} enregistré{admins.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={openCreate} style={{ gap: 6, fontSize: 13 }}>
                  <UserPlus size={14} />
                  Nouvel admin
                </button>
              </div>

              {/* Body */}
              {loading ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: 14 }}>
                  Chargement…
                </div>
              ) : admins.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: 14 }}>
                  Aucun administrateur créé.
                </div>
              ) : (
                <div>
                  {admins.map((admin, i) => {
                    const initials = (admin.username || "?")
                      .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <div
                        key={admin._id}
                        className="admin-row"
                        style={{
                          display: "flex", alignItems: "center",
                          padding: "14px 24px",
                          borderBottom: i < admins.length - 1 ? "1px solid var(--border)" : "none",
                          gap: 16,
                        }}
                      >
                        {/* Avatar */}
                        <div className="sidebar-avatar" style={{ width: 40, height: 40, fontSize: 13, flexShrink: 0 }}>
                          {initials}
                        </div>

                        {/* Nom + badge */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {admin.username}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                            {admin.email}
                          </div>
                        </div>

                        {/* Date */}
                        <div className="admin-row-date" style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>
                          {formatDate(admin.createdAt)}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "6px 10px", fontSize: 12, gap: 4 }}
                            onClick={() => openEdit(admin)}
                            title="Modifier"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "6px 10px", fontSize: 12, gap: 4 }}
                            onClick={() => openReset(admin)}
                            title="Réinitialiser le mot de passe"
                          >
                            <KeyRound size={13} />
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "6px 10px", fontSize: 12, color: "var(--red)" }}
                            onClick={() => setDeleteTarget(admin)}
                            title="Supprimer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

        </div>
        <Footer />
      </div>

      {/* Create admin modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Créer un administrateur</h3>
                <button className="modal-close" onClick={() => setShowCreate(false)}>
                  <X size={18} />
                </button>
              </div>

              {createErrors.submit && (
                <div className="auth-error" style={{ marginBottom: 12 }}>{createErrors.submit}</div>
              )}

              <form onSubmit={handleCreateSubmit} className="modal-form">
                <div className="form-field">
                  <label>Nom complet</label>
                  <input
                    type="text"
                    placeholder="Nom de l'administrateur"
                    value={createForm.username}
                    onChange={(e) => {
                      setCreateForm((p) => ({ ...p, username: e.target.value }));
                      if (createErrors.username) setCreateErrors((p) => ({ ...p, username: "" }));
                    }}
                    disabled={createLoading}
                    className={createErrors.username ? "input-error" : ""}
                  />
                  {createErrors.username && <span className="field-error">{createErrors.username}</span>}
                </div>

                <div className="form-field">
                  <label>Adresse email</label>
                  <input
                    type="email"
                    placeholder="admin@dgac.ma"
                    value={createForm.email}
                    onChange={(e) => {
                      setCreateForm((p) => ({ ...p, email: e.target.value }));
                      if (createErrors.email) setCreateErrors((p) => ({ ...p, email: "" }));
                    }}
                    disabled={createLoading}
                    className={createErrors.email ? "input-error" : ""}
                  />
                  {createErrors.email && <span className="field-error">{createErrors.email}</span>}
                </div>

                <PasswordField
                  label="Mot de passe"
                  name="password"
                  value={createForm.password}
                  onChange={(e) => {
                    setCreateForm((p) => ({ ...p, password: e.target.value }));
                    if (createErrors.password) setCreateErrors((p) => ({ ...p, password: "" }));
                  }}
                  error={createErrors.password}
                  disabled={createLoading}
                />

                <PasswordField
                  label="Confirmer le mot de passe"
                  name="confirmPassword"
                  value={createForm.confirmPassword}
                  onChange={(e) => {
                    setCreateForm((p) => ({ ...p, confirmPassword: e.target.value }));
                    if (createErrors.confirmPassword) setCreateErrors((p) => ({ ...p, confirmPassword: "" }));
                  }}
                  error={createErrors.confirmPassword}
                  disabled={createLoading}
                />

                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={createLoading}>
                    <UserPlus size={14} />
                    {createLoading ? "Création…" : "Créer le compte"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editTarget && (
          <div className="modal-backdrop" onClick={() => setEditTarget(null)}>
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Modifier l'administrateur</h3>
                <button className="modal-close" onClick={() => setEditTarget(null)}>
                  <X size={18} />
                </button>
              </div>

              {editErrors.submit && (
                <div className="auth-error" style={{ marginBottom: 12 }}>{editErrors.submit}</div>
              )}

              <form onSubmit={handleEditSubmit} className="modal-form">
                <div className="form-field">
                  <label>Nom complet</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => {
                      setEditForm((p) => ({ ...p, username: e.target.value }));
                      if (editErrors.username) setEditErrors((p) => ({ ...p, username: "" }));
                    }}
                    disabled={editLoading}
                    className={editErrors.username ? "input-error" : ""}
                  />
                  {editErrors.username && <span className="field-error">{editErrors.username}</span>}
                </div>

                <div className="form-field">
                  <label>Adresse email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => {
                      setEditForm((p) => ({ ...p, email: e.target.value }));
                      if (editErrors.email) setEditErrors((p) => ({ ...p, email: "" }));
                    }}
                    disabled={editLoading}
                    className={editErrors.email ? "input-error" : ""}
                  />
                  {editErrors.email && <span className="field-error">{editErrors.email}</span>}
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setEditTarget(null)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={editLoading}>
                    <Pencil size={14} />
                    {editLoading ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset password modal */}
      <AnimatePresence>
        {resetTarget && (
          <div className="modal-backdrop" onClick={() => setResetTarget(null)}>
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Réinitialiser le mot de passe</h3>
                <button className="modal-close" onClick={() => setResetTarget(null)}>
                  <X size={18} />
                </button>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
                Définir un nouveau mot de passe pour <strong>{resetTarget.username}</strong>.
              </p>

              {resetErrors.submit && (
                <div className="auth-error" style={{ marginBottom: 12 }}>{resetErrors.submit}</div>
              )}

              <form onSubmit={handleResetSubmit} className="modal-form">
                <PasswordField
                  label="Nouveau mot de passe"
                  name="newPassword"
                  value={resetForm.newPassword}
                  onChange={(e) => {
                    setResetForm((p) => ({ ...p, newPassword: e.target.value }));
                    if (resetErrors.newPassword) setResetErrors((p) => ({ ...p, newPassword: "" }));
                  }}
                  error={resetErrors.newPassword}
                  disabled={resetLoading}
                />
                <PasswordField
                  label="Confirmer le mot de passe"
                  name="confirmPassword"
                  value={resetForm.confirmPassword}
                  onChange={(e) => {
                    setResetForm((p) => ({ ...p, confirmPassword: e.target.value }));
                    if (resetErrors.confirmPassword) setResetErrors((p) => ({ ...p, confirmPassword: "" }));
                  }}
                  error={resetErrors.confirmPassword}
                  disabled={resetLoading}
                />

                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setResetTarget(null)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                    <KeyRound size={14} />
                    {resetLoading ? "Réinitialisation…" : "Réinitialiser"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer l'administrateur"
        message={deleteTarget ? `Êtes-vous sûr de vouloir supprimer le compte de "${deleteTarget.username}" ? Cette action est irréversible.` : ""}
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default AdminManagement;
