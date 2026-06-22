import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, CheckCircle, Eye, EyeOff } from "lucide-react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";

function PasswordField({ id, name, label, placeholder, value, onChange, disabled, error }) {
  const [show, setShow] = useState(false);
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
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

function Register() {
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors]   = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name = "Le nom est requis.";
    if (!form.email.trim())      e.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Adresse email invalide.";
    if (!form.password.trim())   e.password = "Le mot de passe est requis.";
    else if (form.password.length < 6)
      e.password = "Minimum 6 caractères.";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Les mots de passe ne correspondent pas.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await api.post("/auth/register", {
        username: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      if (response.status === 201) {
        setSuccess(true);
        setForm({ name: "", email: "", password: "", confirmPassword: "" });
        setErrors({});
      }
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || "Erreur lors de la création du compte." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage="create-admin" />

      <div className="main-content">
        <div className="navbar">
          <div className="navbar-left">
            <span className="navbar-eyebrow">Administration</span>
            <span className="navbar-title">Créer un administrateur</span>
          </div>
        </div>

        <div className="page-content">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ maxWidth: 520 }}
          >
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Nouveau compte administrateur</h3>
                  <p>Renseignez les informations pour créer un accès administrateur.</p>
                </div>
                <div className="stat-icon blue" style={{ width: 44, height: 44, borderRadius: 10 }}>
                  <UserPlus size={20} />
                </div>
              </div>

              {success && (
                <div className="auth-success" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <CheckCircle size={16} />
                  Compte administrateur créé avec succès.
                </div>
              )}
              {errors.submit && (
                <div className="auth-error" style={{ marginBottom: 16 }}>{errors.submit}</div>
              )}

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-field">
                  <label htmlFor="name">Nom complet</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Jean Dupont"
                    value={form.name}
                    onChange={handleChange}
                    disabled={loading}
                    className={errors.name ? "input-error" : ""}
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </div>

                <div className="form-field">
                  <label htmlFor="email">Adresse email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@dgac.ma"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                    className={errors.email ? "input-error" : ""}
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <PasswordField
                  id="password"
                  name="password"
                  label="Mot de passe"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  error={errors.password}
                />

                <PasswordField
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirmer le mot de passe"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  error={errors.confirmPassword}
                />

                <div className="modal-actions" style={{ marginTop: 8 }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ width: "100%", justifyContent: "center", height: 44 }}
                  >
                    <UserPlus size={16} />
                    {loading ? "Création en cours…" : "Créer le compte administrateur"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Register;
