import { motion } from "framer-motion";
import { CheckCircle, XCircle, X } from "lucide-react";

function Toast({ type, message, onClose }) {
  const Icon = type === "success" ? CheckCircle : XCircle;

  return (
    <motion.div
      className={`toast toast-${type}`}
      initial={{ opacity: 0, y: -12, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      <Icon size={18} className="toast-icon" />
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Fermer">
        <X size={14} />
      </button>
    </motion.div>
  );
}

export default Toast;
