import { UserPlus, Pencil, Archive, RotateCcw, RefreshCw, XCircle, Trash2, FileText } from "lucide-react";

export const ACTION_CONFIG = {
  PILOT_CREATED:         { label: "Pilote créé",          cls: "badge-active",   icon: UserPlus  },
  PILOT_UPDATED:         { label: "Pilote modifié",       cls: "badge-info",     icon: Pencil    },
  PILOT_ARCHIVED:        { label: "Pilote archivé",       cls: "badge-expiring", icon: Archive   },
  PILOT_RESTORED:        { label: "Pilote restauré",      cls: "badge-active",   icon: RotateCcw },
  PILOT_RENEWED:         { label: "Certificat renouvelé", cls: "badge-renewed",  icon: RefreshCw },
  PILOT_EXPIRED:         { label: "Certificat expiré",    cls: "badge-expired",  icon: XCircle   },
  PILOT_DELETED:         { label: "Pilote supprimé",      cls: "badge-expired",  icon: Trash2    },
  CERTIFICATE_GENERATED: { label: "Certificat généré",    cls: "badge-info",     icon: FileText  },
};

export const FIELD_LABELS = {
  name: "Nom",
  email: "Email",
  licenseNumber: "N° Licence",
  certificateNumber: "N° Certificat",
  nationality: "Nationalité",
  medicalClass: "Classe médicale",
  expiryDate: "Date d'expiration",
  issueDate: "Date d'émission",
  archived: "Archivé",
  lastKnownStatus: "Statut",
  status: "Statut",
};

export const DATE_FIELDS = new Set(["expiryDate", "issueDate", "createdAt", "updatedAt"]);

export function formatDate(iso) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatRelativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function formatValue(field, value) {
  if (value === undefined || value === null || value === "") return "—";
  if (DATE_FIELDS.has(field)) return new Date(value).toLocaleDateString("fr-FR");
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  return String(value);
}

/** Calcule la liste des champs à afficher dans le détail d'une action. */
export function getFieldChanges(oldData, newData) {
  const source = newData || oldData || {};
  const fields = Object.keys(source).filter((f) => FIELD_LABELS[f]);

  if (oldData && newData) {
    return fields
      .map((field) => ({
        field, label: FIELD_LABELS[field],
        oldValue: oldData[field], newValue: newData[field],
      }))
      .filter(({ oldValue, newValue }) => String(oldValue) !== String(newValue));
  }

  return fields.map((field) => ({
    field, label: FIELD_LABELS[field],
    oldValue: oldData ? oldData[field] : undefined,
    newValue: newData ? newData[field] : undefined,
  }));
}
