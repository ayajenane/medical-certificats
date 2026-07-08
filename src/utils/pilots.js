import api from "./api";

// active / expiring (<=30j) / expired / unknown si pas de date
export function computeStatus(expiryDateStr) {
  if (!expiryDateStr) return "unknown";
  const days = Math.ceil((new Date(expiryDateStr) - new Date()) / 86400000);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "active";
}

// nombre de jours restants avant expiration (négatif si déjà expiré)
export function daysUntilExpiry(expiryDateStr) {
  if (!expiryDateStr) return null;
  return Math.ceil((new Date(expiryDateStr) - new Date()) / 86400000);
}

// liste paginée/filtrée des pilotes ; archived doit être une string "true"/"false" pour le backend, pas un bool
export async function getPilots(params = {}) {
  const { data } = await api.get("/pilots", {
    params: { ...params, archived: params.archived ? "true" : "false" },
  });
  return data;
}

// création d'un nouveau pilote
export async function addPilot(pilotData) {
  const { data } = await api.post("/pilots", pilotData);
  return data.data;
}

// mise à jour partielle d'un pilote existant
export async function updatePilot(id, updates) {
  const { data } = await api.put(`/pilots/${id}`, updates);
  return data.data;
}

// détail d'un pilote par son id
export async function getPilot(id) {
  const { data } = await api.get(`/pilots/${id}`);
  return data.data;
}

// renouvelle le certificat médical du pilote avec une nouvelle date d'expiration
export async function renewPilot(id, expiryDate) {
  const { data } = await api.patch(`/pilots/${id}/renew`, { expiryDate });
  return data.data;
}

// archive un pilote (soft delete, il reste consultable dans la liste archivée)
export async function archivePilot(id) {
  const { data } = await api.patch(`/pilots/${id}/archive`);
  return data.data;
}

// restaure un pilote archivé vers la liste active
export async function restorePilot(id) {
  const { data } = await api.patch(`/pilots/${id}/restore`);
  return data.data;
}

// suppression définitive d'un pilote
export async function deletePilot(id) {
  const { data } = await api.delete(`/pilots/${id}`);
  return data;
}
