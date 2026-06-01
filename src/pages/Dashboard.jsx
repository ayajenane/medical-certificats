import { useNavigate } from "react-router-dom";
import PdfCard from "../components/PdfCard";

function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    navigate("/login");
  };

  const pdfDocuments = [
    {
      id: "pdf1",
      title: "Certificat médical général",
      description: "Consultation de routine et suivi prescrit.",
      date: "01 Juin 2026",
      status: "Validé",
      downloadUrl: "#",
    },
    {
      id: "pdf2",
      title: "Certificat d’arrêt de travail",
      description: "Arrêt de travail délivré pour 7 jours.",
      date: "28 Mai 2026",
      status: "Validé",
      downloadUrl: "#",
    },
    {
      id: "pdf3",
      title: "Certificat de sport",
      description: "Autorise la pratique d’activités physiques légères.",
      date: "15 Mai 2026",
      status: "En cours",
      downloadUrl: "#",
    },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🩺</span>
          <div>
            <h2>Certificats Médicaux</h2>
            <p>Plateforme digitale</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a href="#overview" className="sidebar-link active">
            Accueil
          </a>
         
          <a href="#pdf1" className="sidebar-link">
            PDF 1
          </a>
          <a href="#pdf2" className="sidebar-link">
            PDF 2
          </a>
        
        </nav>

      
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-navbar">
          <div className="navbar-brand">
            <span className="navbar-brand-icon">🏠</span>
            <div>
              <h1>Accueil</h1>
              <p> certificats médicaux numériques.</p>
            </div>
          </div>

          <div className="navbar-actions">
            <a href="#home" className="navbar-link">
              Home
            </a>
            <a href="#help" className="navbar-link">
              Aide
            </a>
            <button className="logout-button" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <section className="dashboard-content" id="overview">
          <div className="dashboard-welcome">
            <div>
              <h2>Bienvenue dans votre espace de certificats</h2>
             
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
