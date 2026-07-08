import api from "./api";

// liste paginée des certificats ; on retourne data en entier (pas data.data) car il y a la pagination dedans
export async function getCertificates(params = {}) {
  const { data } = await api.get("/certificates", { params });
  return data;
}

// récupère un seul certificat par son id
export async function getCertificate(id) {
  const { data } = await api.get(`/certificates/${id}`);
  return data.data;
}

// crée un nouveau certificat pour un pilote
export async function createCertificate(payload) {
  const { data } = await api.post("/certificates", payload);
  return data.data;
}

// tous les certificats liés à un pilote donné (historique médical)
export async function getCertificatesByPilot(pilotId) {
  const { data } = await api.get(`/certificates/pilot/${pilotId}`);
  return data.data;
}
