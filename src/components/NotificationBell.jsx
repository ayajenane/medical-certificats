import { useState, useEffect, useRef } from "react";
import { Bell, AlertTriangle, XCircle, X } from "lucide-react";
import { getPilots, computeStatus, daysUntilExpiry } from "../utils/pilots";

// cloche de notifications dans la navbar, affiche les certificats expirés ou bientôt expirés
function NotificationBell() {
  const [open, setOpen]     = useState(false); // dropdown ouvert ou fermé
  const [pilots, setPilots] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null); // pour détecter les clics hors du dropdown

  // récupère tous les pilotes pour pouvoir calculer les alertes côté client
  useEffect(() => {
    getPilots({ archived: false, limit: 1000 })
      .then((res) => setPilots(res.data || []))
      .catch(() => setPilots([]))
      .finally(() => setLoading(false));
  }, []);

  // ferme le dropdown si on clique en dehors (seulement quand il est ouvert)
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler); // cleanup sinon fuite d'ecouteurs
  }, [open]);

  // computeStatus compare expiryDate a aujourd'hui pour classer le certif
  const expired  = pilots.filter((p) => computeStatus(p.expiryDate) === "expired");
  const expiring = pilots.filter((p) => computeStatus(p.expiryDate) === "expiring");
  const total    = expired.length + expiring.length; // nombre total d'alertes actives

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* icône cloche avec badge du nombre d'alertes, clic pour ouvrir/fermer le dropdown */}
      <button
        className="navbar-icon-btn"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        style={{ position: "relative" }}
      >
        <Bell size={17} />
        {total > 0 && (
          <span className="notif-badge">{total > 9 ? "9+" : total}</span> // cap l'affichage a "9+"
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          {/* Header */}
          <div className="notif-header">
            <span>Notifications</span>
            {total > 0 && (
              <span className="badge badge-expired" style={{ fontSize: 10, padding: "2px 8px" }}>
                {total} alerte{total > 1 ? "s" : ""}
              </span>
            )}
            <button className="notif-close" onClick={() => setOpen(false)}>
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="notif-body">
            {loading ? (
              <div className="notif-empty">
                <p>Chargement…</p>
              </div>
            ) : total === 0 ? (
              <div className="notif-empty">
                <Bell size={30} strokeWidth={1.5} />
                <p>Aucune alerte active</p>
                <span style={{ fontSize: 12 }}>Tous les certificats sont valides</span>
              </div>
            ) : (
              <>
                {/* Expirés */}
                {expired.length > 0 && (
                  <div className="notif-group">
                    <div className="notif-group-label">
                      <XCircle size={11} />
                      Certificats expirés — action requise
                    </div>
                    {expired.map((p) => (
                      <div key={p.id} className="notif-item">
                        <div className="notif-dot notif-dot-red" />
                        <div className="notif-item-body">
                          <p className="notif-item-name">{p.name}</p>
                          <p className="notif-item-sub">Classe {p.medicalClass} · Certificat expiré</p>
                        </div>
                        <span className="badge badge-expired" style={{ fontSize: 10, flexShrink: 0 }}>Expiré</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expirent bientôt */}
                {expiring.length > 0 && (
                  <div className="notif-group">
                    <div className="notif-group-label">
                      <AlertTriangle size={11} />
                      Expirent dans moins de 30 jours
                    </div>
                    {expiring.map((p) => {
                      const days = daysUntilExpiry(p.expiryDate); // nb de jours restants avant expiration
                      return (
                        <div key={p.id} className="notif-item">
                          <div className="notif-dot notif-dot-orange" />
                          <div className="notif-item-body">
                            <p className="notif-item-name">{p.name}</p>
                            <p className="notif-item-sub">Classe {p.medicalClass} · Expire dans {days} jour{days > 1 ? "s" : ""}</p>
                          </div>
                          <span className="badge badge-expiring" style={{ fontSize: 10, flexShrink: 0 }}>J-{days}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {total > 0 && (
            <div className="notif-footer" style={{ justifyContent: "center", cursor: "default" }}>
              Alerte(s) en cours
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
