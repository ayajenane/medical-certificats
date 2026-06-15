import api from "./api";

/**
 * @param {object} [params]
 * @param {string} [params.search]
 * @param {string} [params.status] - all | active | expiring | expired
 * @param {string} [params.sort] - issueDate | -issueDate | expiryDate | -expiryDate | createdAt | -createdAt
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<{data: object[], pagination: object}>}
 */
export async function getCertificates(params = {}) {
  const { data } = await api.get("/certificates", { params });
  return data;
}

export async function getCertificate(id) {
  const { data } = await api.get(`/certificates/${id}`);
  return data.data;
}

export async function createCertificate(payload) {
  const { data } = await api.post("/certificates", payload);
  return data.data;
}

export async function getCertificatesByPilot(pilotId) {
  const { data } = await api.get(`/certificates/pilot/${pilotId}`);
  return data.data;
}
