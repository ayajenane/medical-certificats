import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, CheckCircle, AlertTriangle, XCircle,
  FileText, Bell, Search, Calendar, Clock,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { getPilots, computeStatus, daysUntilExpiry } from "../utils/pilots";
import { getDashboardStats } from "../utils/dashboard";
import { ACTION_CONFIG, formatRelativeTime } from "../utils/historyDisplay";

const CERT_FORMS = [
  {
    id: "pdf1",
    title: "Certificat Médical — Classe 1",
    description: "Pilotes commerciaux (ATPL/CPL). Délivré par AME agréé.",
    route: "/pdf1",
  },
  {
    id: "pdf2",
    title: "Certificat Médical — Classe 2",
    description: "Pilotes privés (PPL). Renouvellement annuel requis.",
    route: "/pdf2",
  },
  {
    id: "pdf3",
    title: "Certificat Médical — Classe 3",
    description: "Contrôleurs de la circulation aérienne (ATCO).",
    route: null,
  },
];

const STATUS_COLORS = {
  valid:    "#22C55E",
  expiring: "#F59E0B",
  expired:  "#EF4444",
};

function getCurrentDate() {
  return new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="chart-tooltip">
        {payload[0].name} : <strong>{payload[0].value}</strong>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="chart-tooltip">
        {label} : <strong>{payload[0].value}</strong>
      </div>
    );
  }
  return null;
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.07, ease: "easeOut" },
  }),
};

function Dashboard() {
  const navigate  = useNavigate();
  const [user]                        = useState(() => {
    const stored = sessionStorage.getItem("currentUser");
    return stored ? JSON.parse(stored) : null;
  });
  const [pilots, setPilots]           = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [search, setSearch]           = useState("");
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    getPilots({ archived: false, limit: 1000 }).then((res) => setPilots(res.data)).catch(() => setPilots([]));
    getDashboardStats().then(setDashboardStats).catch(() => {});
  }, [navigate, user]);

  if (!user) return null;

  const activePilots   = pilots.filter((p) => !p.archived);
  const validPilots    = activePilots.filter((p) => computeStatus(p.expiryDate) === "active");
  const expiringPilots = activePilots.filter((p) => computeStatus(p.expiryDate) === "expiring");
  const expiredPilots  = activePilots.filter((p) => computeStatus(p.expiryDate) === "expired");

  const stats = [
    { label: "Total pilotes",        value: dashboardStats?.totalPilots ?? activePilots.length,            note: "Hors archivés",         icon: Users,         color: "blue"   },
    { label: "Certificats actifs",   value: dashboardStats?.activeCertificates ?? validPilots.length,      note: "En cours de validité",  icon: CheckCircle,   color: "green"  },
    { label: "Expirations proches",  value: dashboardStats?.expiringCertificates ?? expiringPilots.length, note: "< 30 jours",             icon: AlertTriangle, color: "orange" },
    { label: "Certificats expirés",  value: dashboardStats?.expiredCertificates ?? expiredPilots.length,   note: "À régulariser",          icon: XCircle,       color: "red"    },
    { label: "Certificats ce mois",  value: dashboardStats?.certificatesThisMonth ?? 0,                    note: "Générés ce mois-ci",     icon: FileText,      color: "blue"   },
  ];

  const pieData = [
    { name: "Valides",         value: validPilots.length,    color: STATUS_COLORS.valid    },
    { name: "Bientôt expirés", value: expiringPilots.length, color: STATUS_COLORS.expiring },
    { name: "Expirés",         value: expiredPilots.length,  color: STATUS_COLORS.expired  },
  ].filter((d) => d.value > 0);

  const licenseData = ["ATPL", "CPL", "PPL", "ATCO", "Autre"]
    .map((type) => ({
      type,
      count: activePilots.filter((p) => p.licenseType === type).length,
    }))
    .filter((d) => d.count > 0);

  const showAlert = !alertDismissed && (expiringPilots.length > 0 || expiredPilots.length > 0);
  const firstName = user.username?.split(" ")[0] ?? "";

  const filteredForms = CERT_FORMS.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Sidebar activePage="dashboard" />

      <div className="main-content">
        {/* Navbar */}
        <header className="navbar">
          <div className="navbar-left">
            <span className="navbar-eyebrow">Direction Générale de l'Aviation Civile</span>
            <h1 className="navbar-title">Tableau de bord</h1>
          </div>
          <div className="navbar-right">
            <div className="search-wrapper">
              <Search size={15} className="search-icon-inner" />
              <input
                className="search-input"
                type="text"
                placeholder="Rechercher un certificat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="navbar-icon-btn" aria-label="Notifications">
              <Bell size={17} />
            </button>
            <div className="navbar-user">
              <div className="navbar-avatar">
                {firstName ? firstName[0].toUpperCase() : "?"}
              </div>
              <div>
                <p className="navbar-username">{user.username || "Inspecteur"}</p>
                <p className="navbar-role">Inspecteur médical</p>
              </div>
            </div>
          </div>
        </header>

        <main className="page-content">
          {/* Alert */}
          {showAlert && (
            <motion.div
              className="alert-banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="alert-content">
                <AlertTriangle size={18} className="alert-icon" />
                <div>
                  {expiredPilots.length > 0 && (
                    <p><strong>{expiredPilots.length} certificat(s) expiré(s)</strong> — action requise immédiatement.</p>
                  )}
                  {expiringPilots.length > 0 && (
                    <p>
                      <strong>{expiringPilots.length} certificat(s)</strong> expirent dans les 30 jours :&nbsp;
                      {expiringPilots.map((p, i) => (
                        <span key={p.id}>
                          {p.name} ({daysUntilExpiry(p.expiryDate)}j){i < expiringPilots.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
                <button className="alert-action" onClick={() => navigate("/pilots")}>
                  Voir les pilotes
                </button>
              </div>
              <button className="alert-dismiss" onClick={() => setAlertDismissed(true)}>✕</button>
            </motion.div>
          )}

          {/* Welcome banner */}
          <div className="welcome-banner">
            <div>
              <h2>Bonjour, {firstName} 👋</h2>
              <p>Vue d'ensemble des certifications médicales des pilotes.</p>
            </div>
            <span className="welcome-date">
              <Calendar size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              {getCurrentDate()}
            </span>
          </div>

          {/* Stat cards */}
          <div className="stats-grid">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className="stat-card"
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <div className="stat-card-body">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-note">{s.note}</div>
                </div>
                <div className={`stat-icon ${s.color}`}>
                  <s.icon size={22} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          {activePilots.length > 0 && (
            <div className="charts-grid">
              {/* Pie Chart */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>Répartition des certificats</h3>
                    <p>Distribution par statut de validité</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 12, color: "#475569" }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>Pilotes par type de licence</h3>
                    <p>Répartition selon la qualification</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={licenseData} barSize={32}>
                    <XAxis
                      dataKey="type"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748B" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748B" }}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#EFF6FF" }} />
                    <Bar dataKey="count" name="Pilotes" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Dernières activités */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3>Dernières activités</h3>
                <p>Actions récentes sur les dossiers pilotes et certificats.</p>
              </div>
              <button className="btn btn-secondary" onClick={() => navigate("/history")}>
                Voir tout
              </button>
            </div>
            {dashboardStats?.recentActivity?.length > 0 ? (
              <div className="activity-feed">
                {dashboardStats.recentActivity.map((h) => {
                  const cfg = ACTION_CONFIG[h.action] || { label: h.action, cls: "badge-unknown", icon: Clock };
                  const Icon = cfg.icon;
                  return (
                    <div className="activity-item" key={h.id}>
                      <div className="activity-icon"><Icon size={16} /></div>
                      <div className="activity-body">
                        <p className="activity-title">{cfg.label} — {h.pilotName}</p>
                        <p className="activity-sub">{h.performedBy?.username || "Système"}</p>
                      </div>
                      <span className="activity-time">{formatRelativeTime(h.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <Clock size={32} strokeWidth={1.5} />
                <p>Aucune activité récente.</p>
              </div>
            )}
          </div>

          {/* Certificate forms */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3>Formulaires de certificats médicaux</h3>
                <p>Sélectionnez le formulaire adapté et générez le document officiel.</p>
              </div>
            </div>
            <div className="cert-list">
              {filteredForms.map((doc) => (
                <div className="cert-card" key={doc.id}>
                  <div className="cert-card-left">
                    <div className="cert-icon">
                      <FileText size={18} />
                    </div>
                    <div>
                      <div className="cert-title">{doc.title}</div>
                      <div className="cert-desc">{doc.description}</div>
                    </div>
                  </div>
                  <div className="cert-card-right">
                    <span className={`badge ${doc.route ? "badge-available" : "badge-soon"}`}>
                      {doc.route ? "Disponible" : "Bientôt"}
                    </span>
                    {doc.route && (
                      <button className="btn btn-primary" onClick={() => navigate(doc.route)}>
                        Ouvrir →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
