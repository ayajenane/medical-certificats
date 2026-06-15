import api from "./api";

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

/**
 * @param {object} [params]
 * @param {string} [params.search]
 * @param {string} [params.status] - all | active | expiring | expired
 * @param {boolean} [params.archived]
 * @param {string} [params.medicalClass]
 * @param {string} [params.sort] - name | -name | expiryDate | -expiryDate | createdAt | -createdAt
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<{data: object[], pagination: object, counts: object}>}
 */
export async function getPilots(params = {}) {
  const { data } = await api.get("/pilots", {
    params: { ...params, archived: params.archived ? "true" : "false" },
  });
  return data;
}

export async function addPilot(pilotData) {
  const { data } = await api.post("/pilots", pilotData);
  return data.data;
}

export async function updatePilot(id, updates) {
  const { data } = await api.put(`/pilots/${id}`, updates);
  return data.data;
}

export async function getPilot(id) {
  const { data } = await api.get(`/pilots/${id}`);
  return data.data;
}

export async function renewPilot(id, expiryDate) {
  const { data } = await api.patch(`/pilots/${id}/renew`, { expiryDate });
  return data.data;
}

export async function archivePilot(id) {
  const { data } = await api.patch(`/pilots/${id}/archive`);
  return data.data;
}

export async function restorePilot(id) {
  const { data } = await api.patch(`/pilots/${id}/restore`);
  return data.data;
}

export async function deletePilot(id) {
  const { data } = await api.delete(`/pilots/${id}`);
  return data;
}
