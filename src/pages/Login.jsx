import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { decryptData } from "../utils/crypto";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);

    setTimeout(async () => {
      const encryptedUser = localStorage.getItem("user");

      if (!encryptedUser) {
        setError("Aucun utilisateur trouvé. Inscrivez-vous d'abord.");
        setLoading(false);
        return;
      }

      try {
        const user = await decryptData(encryptedUser, password);

        if (user.email === email) {
          navigate("/dashboard");
        } else {
          setError("Email ou mot de passe incorrect");
        }
      } catch (err) {
        setError("Email ou mot de passe incorrect");
      }

      setLoading(false);
    }, 500);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-icon">🔐</div>

        <h1>Connexion</h1>

        <p className="auth-subtitle">
          Accédez à votre tableau de bord personnel
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
            <input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div className="auth-divider">ou</div>

        <p className="auth-footer">
          Pas encore inscrit ? <Link to="/register" className="auth-link">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;