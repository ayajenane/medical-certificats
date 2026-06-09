import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import api from "../utils/api";

function Login() {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.status === 200) {
        const { token, user } = response.data;
        localStorage.setItem("token", token);
        sessionStorage.setItem("currentUser", JSON.stringify(user));
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Identifiants incorrects.");
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
            Plateforme de gestion des certifications médicales
          </h2>
          <p className="auth-left-desc">
            Système institutionnel dédié au suivi des aptitudes médicales des pilotes et à la délivrance des certificats conformément aux réglementations DGAC.
          </p>

          <div className="auth-left-stats">
            <div className="auth-left-stat">
              <span className="auth-left-stat-dot" />
              Conformité aux normes OACI & AESA
            </div>
            <div className="auth-left-stat">
              <span className="auth-left-stat-dot" />
              Suivi en temps réel des dates d'expiration
            </div>
            <div className="auth-left-stat">
              <span className="auth-left-stat-dot" />
              Génération automatique des certificats officiels
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
          <p className="auth-form-eyebrow">Accès sécurisé</p>
          <h1 className="auth-form-title">Connexion</h1>
          <p className="auth-form-sub">
            Entrez vos identifiants pour accéder à la plateforme.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-field">
              <label htmlFor="email">Adresse email</label>
              <input
                id="email"
                type="email"
                placeholder="vous@dgac.ma"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="auth-form-field">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Connexion en cours…" : "Se connecter"}
            </button>
          </form>

      
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
