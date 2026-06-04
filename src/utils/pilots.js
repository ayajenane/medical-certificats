import { logAction } from "./history";

const KEY = "pilots";

/** Calcule le statut à partir de la date d'expiration */
export function computeStatus(expiryDateStr) {
  if (!expiryDateStr) return "unknown";
  const days = Math.ceil((new Date(expiryDateStr) - new Date()) / 86400000);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "active";
}

export function daysUntilExpiry(expiryDateStr) {
  if (!expiryDateStr) return null;
  return Math.ceil((new Date(expiryDateStr) - new Date()) / 86400000);
}

const SEED = [
  {
    id: "p1",
    name: "Jean Dupont",
    email: "j.dupont@airfrance.fr",
    licenseNumber: "FR-ATPL-001",
    licenseType: "ATPL",
    nationality: "Française",
    medicalClass: "1",
    expiryDate: "2026-12-15",
    createdAt: new Date().toISOString(),
  },
  {
    id: "p2",
    name: "Marie Lambert",
    email: "m.lambert@aeroclub.fr",
    licenseNumber: "FR-PPL-042",
    licenseType: "PPL",
    nationality: "Française",
    medicalClass: "2",
    expiryDate: "2026-06-20",
    createdAt: new Date().toISOString(),
  },
  {
    id: "p3",
    name: "Carlos Ruiz",
    email: "c.ruiz@iberia.es",
    licenseNumber: "ES-CPL-117",
    licenseType: "CPL",
    nationality: "Espagnole",
    medicalClass: "1",
    expiryDate: "2026-06-10",
    createdAt: new Date().toISOString(),
  },
  {
    id: "p4",
    name: "Anna Müller",
    email: "a.muller@lufthansa.de",
    licenseNumber: "DE-ATPL-089",
    licenseType: "ATPL",
    nationality: "Allemande",
    medicalClass: "1",
    expiryDate: "2027-03-10",
    createdAt: new Date().toISOString(),
  },
];

export function getPilots() {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

/** Initialise avec les données de démonstration si le localStorage est vide */
export function initPilots() {
  if (!localStorage.getItem(KEY)) {
    localStorage.setItem(KEY, JSON.stringify(SEED));
  }
}

export function savePilots(pilots) {
  localStorage.setItem(KEY, JSON.stringify(pilots));
}

export function addPilot(data) {
  const pilots = getPilots();
  const pilot = {
    ...data,
    id: `p_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  savePilots([...pilots, pilot]);
  logAction("PILOT_CREATED", `Pilote ajouté : ${data.name}`);
  return pilot;
}

export function updatePilot(id, updates) {
  const pilots = getPilots();
  const updated = pilots.map((p) => (p.id === id ? { ...p, ...updates } : p));
  savePilots(updated);
  const pilot = pilots.find((p) => p.id === id);
  logAction("PILOT_UPDATED", `Pilote modifié : ${pilot?.name}`);
}

export function archivePilot(id) {
  const pilots = getPilots();
  const pilot = pilots.find((p) => p.id === id);
  savePilots(pilots.map((p) => (p.id === id ? { ...p, archived: true } : p)));
  logAction("PILOT_ARCHIVED", `Pilote archivé : ${pilot?.name}`);
}

export function restorePilot(id) {
  const pilots = getPilots();
  const pilot = pilots.find((p) => p.id === id);
  savePilots(pilots.map((p) => (p.id === id ? { ...p, archived: false } : p)));
  logAction("PILOT_RESTORED", `Pilote restauré : ${pilot?.name}`);
}

export function deletePilot(id) {
  const pilots = getPilots();
  const pilot = pilots.find((p) => p.id === id);
  savePilots(pilots.filter((p) => p.id !== id));
  logAction("PILOT_DELETED", `Pilote supprimé : ${pilot?.name}`);
}
