import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, X, Eye, EyeOff, CheckCircle } from "lucide-react";
import api from "../utils/api";

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

function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    if (success) setSuccess(false);
  };

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = "Requis.";
    if (!form.newPassword) e.newPassword = "Requis.";
    else if (form.newPassword.length < 6) e.newPassword = "Minimum 6 caractères.";
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = "Les mots de passe ne correspondent pas.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.put("/auth/change-password", form);
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setErrors({});
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || "Erreur lors du changement de mot de passe" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="modal-backdrop" onClick={onClose}>
        <motion.div
          className="modal"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>Changer mon mot de passe</h3>
            <button className="modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {success && (
            <div className="auth-success" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <CheckCircle size={16} />
              Mot de passe modifié avec succès.
            </div>
          )}
          {errors.submit && (
            <div className="auth-error" style={{ marginBottom: 12 }}>{errors.submit}</div>
          )}

          <form onSubmit={handleSubmit} className="modal-form">
            <PasswordField
              label="Mot de passe actuel"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              error={errors.currentPassword}
              disabled={loading}
            />
            <PasswordField
              label="Nouveau mot de passe"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              disabled={loading}
            />
            <PasswordField
              label="Confirmer le nouveau mot de passe"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              disabled={loading}
            />

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <KeyRound size={14} />
                {loading ? "Modification…" : "Confirmer"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ChangePasswordModal;
