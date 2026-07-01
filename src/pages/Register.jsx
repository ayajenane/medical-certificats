// ============================================================
// Sahifa dyal "Créer un admin" — ghir super admin lli kayder
// ============================================================

// Imports dyal React o les outils li khassna
import { useState } from "react";
import { motion } from "framer-motion"; // bach ndirou animation f l'entrée
import { UserPlus, CheckCircle, Eye, EyeOff } from "lucide-react"; // icônes
import api from "../utils/api"; // connexion m3a le serveur
import Sidebar from "../components/Sidebar"; // le menu dyal lysar
import Footer from "../components/Footer"; // le pied de page

// ============================================================
// Composant PasswordField — champ dyal le mot de passe
// kayn zr fiha bouton bach twari/tban le mot de passe
// ============================================================
function PasswordField({ id, name, label, placeholder, value, onChange, disabled, error }) {
  // show: wach le mot de passe ban wla maghyarsh (*** aw text)
  const [show, setShow] = useState(false);

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div style={{ position: "relative" }}>
        {/* ila show=true katban les caractères, ila la katban *** */}
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

        {/* bouton l'œil bach tbadel bin tban o ma tbanch */}
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
          {/* ila show=true: wri icône EyeOff, ila la: wri Eye */}
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* ila kayn error, wrih taht l'input */}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

// ============================================================
// Composant principal Register — formulaire dyal créer admin
// ============================================================
function Register() {
  // form: kayhfed les valeurs li ktbhom f l'utilisateur
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
  });

  // errors: les messages dyal l'erreur li kaybano taht kol champ
  const [errors, setErrors] = useState({});

  // success: wach l'admin tkhleq b nejah wla la
  const [success, setSuccess] = useState(false);

  // loading: wach l'application katsennak jawab mn serveur
  const [loading, setLoading] = useState(false);

  // ============================================================
  // validate — katcheck les champs qbel ma nsifto l serveur
  // ============================================================
  const validate = () => {
    const e = {};

    // ila l'isem khawi
    if (!form.name.trim())       e.name = "Le nom est requis.";

    // ila l'email khawi
    if (!form.email.trim())      e.email = "L'email est requis.";
    // ila l'email machi b forma sahiha (regex katcheck)
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Adresse email invalide.";

    // ila le mot de passe khawi
    if (!form.password.trim())   e.password = "Le mot de passe est requis.";
    // ila le mot de passe qsir bzaf (khasso 6 caractères)
    else if (form.password.length < 6)
      e.password = "Minimum 6 caractères.";

    // ila les 2 mots de passe ma kaynch mchi nfs chi
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Les mots de passe ne correspondent pas.";

    setErrors(e);
    // ila ma kayn ta erreur,ترجع true bach nkmlo
    return Object.keys(e).length === 0;
  };

  // ============================================================
  // handleChange — ktayeb mn bach tbadel valeur f form
  // o tmsah l'erreur dyal dak champ ila bda ykteb
  // ============================================================
  const handleChange = (e) => {
    // kanbadlo ghir le champ li tbadel, ma nmsahch les autres
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    // ila kayn erreur f dak champ, msahha mn badi bda ykteb
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: "" }));

    // ila kanet message dyal nejah, msahha ila bda ybdel
    if (success) setSuccess(false);
  };

  // ============================================================
  // handleSubmit — katayeb mn bach nsifto le formulaire
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault(); // manakhliw page ma trecargiwch

    // ila les champs ma kamloch, wqef hna
    if (!validate()) return;

    setLoading(true); // kan-affichew "Création en cours..."
    try {
      // nsifto les données l serveur bach nkhlqo admin jdid
      const response = await api.post("/auth/register", {
        username: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      // ila serveur qbal o rja3 201 (Created)
      if (response.status === 201) {
        setSuccess(true);                                          // wri message dyal nejah
        setForm({ name: "", email: "", password: "", confirmPassword: "" }); // saffi form
        setErrors({});                                             // msah les erreurs
      }
    } catch (err) {
      // ila kayn mochkil (email mawjoud, serveur kharab...)
      setErrors({ submit: err.response?.data?.message || "Erreur lors de la création du compte." });
    } finally {
      setLoading(false); // wqef loading fi kol l'ahwal
    }
  };

  // ============================================================
  // Affichage dyal la page
  // ============================================================
  return (
    <div className="app-layout">
      {/* Sidebar dyal lysar, active page = "create-admin" */}
      <Sidebar activePage="create-admin" />

      <div className="main-content">
        {/* Navbar dyal fuq — katban isem le page */}
        <div className="navbar">
          <div className="navbar-left">
            <span className="navbar-eyebrow">Administration</span>
            <span className="navbar-title">Créer un administrateur</span>
          </div>
        </div>

        {/* Contenu principal — le formulaire */}
        <div className="page-content">
          {/* motion.div bach ndirou animation dyal entrée (fade + slide mn taht) */}
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
                {/* icône dyal l'entête */}
                <div className="stat-icon blue" style={{ width: 44, height: 44, borderRadius: 10 }}>
                  <UserPlus size={20} />
                </div>
              </div>

              {/* ila l'admin tkhleq b nejah, wri message vert */}
              {success && (
                <div className="auth-success" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <CheckCircle size={16} />
                  Compte administrateur créé avec succès.
                </div>
              )}

              {/* ila kayn erreur mn serveur, wriyha f rouge */}
              {errors.submit && (
                <div className="auth-error" style={{ marginBottom: 16 }}>{errors.submit}</div>
              )}

              {/* Le formulaire dyal l'inscription */}
              <form onSubmit={handleSubmit} className="modal-form">

                {/* Champ dyal l'isem */}
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

                {/* Champ dyal l'email */}
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

                {/* Champ dyal le mot de passe — kayn bouton l'œil */}
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

                {/* Champ dyal tأكيد le mot de passe */}
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

                {/* Bouton dyal submit */}
                <div className="modal-actions" style={{ marginTop: 8 }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading} // mabloch ila katsennak serveur
                    style={{ width: "100%", justifyContent: "center", height: 44 }}
                  >
                    <UserPlus size={16} />
                    {/* ila loading: wri "en cours", ila la: wri le texte normal */}
                    {loading ? "Création en cours…" : "Créer le compte administrateur"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Footer dyal s-sfal dyal la page */}
        <Footer />
      </div>
    </div>
  );
}

export default Register;
