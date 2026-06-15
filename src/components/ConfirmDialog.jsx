import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

/**
 * Modal de confirmation générique, remplace window.confirm.
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {string} props.message
 * @param {string} [props.confirmLabel]
 * @param {string} [props.cancelLabel]
 * @param {boolean} [props.danger]
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 */
function ConfirmDialog({ open, title, message, confirmLabel = "Confirmer", cancelLabel = "Annuler", danger = false, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onCancel}
        >
          <motion.div
            className="modal confirm-dialog"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`confirm-icon${danger ? " danger" : ""}`}>
              <AlertTriangle size={22} />
            </div>
            <h3 className="modal-title" style={{ marginBottom: 8 }}>{title}</h3>
            <p className="confirm-message">{message}</p>
            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
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
