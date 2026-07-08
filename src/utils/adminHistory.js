import api from "./api";

// journal des actions faites par les admins (comptes utilisateurs), paginé et filtrable
// action="all" et search="" par défaut = pas de filtre appliqué
export async function getAdminHistory({ page = 1, limit = 10, sort = "desc", action = "all", search = "" } = {}) {
  const { data } = await api.get("/admin-history", {
    params: { page, limit, sort, action, search },
  });
  return data;
}
