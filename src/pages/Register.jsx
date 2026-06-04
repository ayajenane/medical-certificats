import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import api from "../utils/api";

function Register() {
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors]   = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        setTimeout(() => navigate("/login"), 1600);
      }
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || "Erreur lors de l'inscription." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <Shield size={22} />
          </div>
          <div>
            <span className="auth-brand-name">MedCert</span>
            <span className="auth-brand-sub">Aviation · Maroc</span>
          </div>
        </div>

        <div className="auth-left-body">
          <h2 className="auth-left-title">
            Rejoignez la plateforme officielle de certification médicale
          </h2>
          <p className="auth-left-desc">
            Créez votre compte pour accéder au système de gestion des certifications médicales aéronautiques et assurer la conformité réglementaire de votre flotte.
          </p>

          <div className="auth-left-stats">
            <div className="auth-left-stat">
              <span className="auth-left-stat-dot" />
              Accès sécurisé et chiffré
            </div>
            <div className="auth-left-stat">
              <span className="auth-left-stat-dot" />
              Tableau de bord personnalisé
            </div>
            <div className="auth-left-stat">
              <span className="auth-left-stat-dot" />
              Alertes automatiques d'expiration
            </div>
          </div>
        </div>

        <div className="auth-left-footer">
          © 2025 Direction Générale de l'Aviation Civile · v2.0
        </div>
      </div>

      {/* Right panel */}
      <motion.div
        className="auth-right"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="auth-form-box">
          <p className="auth-form-eyebrow">Nouveau compte</p>
          <h1 className="auth-form-title">Inscription</h1>
          <p className="auth-form-sub">
            Renseignez vos informations pour créer votre accès.
          </p>

          {success && (
            <div className="auth-success">
              Compte créé avec succès. Redirection vers la connexion…
            </div>
          )}
          {errors.submit && <div className="auth-error">{errors.submit}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-field">
              <label htmlFor="name">Nom complet</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Jean Dupont"
                value={form.name}
                onChange={handleChange}
                disabled={loading || success}
                className={errors.name ? "input-error" : ""}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="auth-form-field">
              <label htmlFor="email">Adresse email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="vous@dgac.ma"
                value={form.email}
                onChange={handleChange}
                disabled={loading || success}
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="auth-form-field">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                disabled={loading || success}
                className={errors.password ? "input-error" : ""}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="auth-form-field">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                disabled={loading || success}
                className={errors.confirmPassword ? "input-error" : ""}
              />
              {errors.confirmPassword && (
                <span className="field-error">{errors.confirmPassword}</span>
              )}
            </div>

            <button type="submit" className="auth-submit" disabled={loading || success}>
              {loading ? "Création du compte…" : "Créer mon compte"}
            </button>
          </form>

          <div className="auth-divider">ou</div>

          <p className="auth-footer">
            Déjà inscrit ?{" "}
            <Link to="/login" className="auth-link">
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Register;
