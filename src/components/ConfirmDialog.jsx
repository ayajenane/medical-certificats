import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

// remplace window.confirm par un modal stylé
// danger=true change la couleur de l'icône/du bouton pour les actions destructives (suppression...)
function ConfirmDialog({ open, title, message, confirmLabel = "Confirmer", cancelLabel = "Annuler", danger = false, onConfirm, onCancel }) {
  return (
    // AnimatePresence permet l'animation de sortie quand open passe à false
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onCancel} // clic hors de la carte = annuler
        >
          <motion.div
            className="modal confirm-dialog"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()} // empêche le clic dans la carte de fermer le modal
          >
            {/* icône d'alerte, rouge si action dangereuse */}
            <div className={`confirm-icon${danger ? " danger" : ""}`}>
              <AlertTriangle size={22} />
            </div>
            <h3 className="modal-title" style={{ marginBottom: 8 }}>{title}</h3>
            <p className="confirm-message">{message}</p>
            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
              {/* bouton de confirmation en rouge pour les actions dangereuses, bleu sinon */}
              <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmDialog;
