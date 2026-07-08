import api from "./api";

// récupère les statistiques agrégées affichées sur la page d'accueil (compteurs, répartitions...)
export async function getDashboardStats() {
  const { data } = await api.get("/dashboard/stats");
  return data.data;
}
