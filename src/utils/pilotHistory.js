import api from "./api";

// journal des actions liées aux pilotes (création, renouvellement, archivage...), paginé et filtrable
// pilotId/performedById permettent de filtrer sur un pilote ou un admin précis
export async function getPilotHistory({ page = 1, limit = 10, sort = "desc", action = "all", search = "", pilotId, performedById } = {}) {
  const { data } = await api.get("/pilot-history", {
    params: { page, limit, sort, action, search, pilotId, performedById },
  });
  return data;
}

// une seule entrée d'historique, avec son détail complet
export async function getPilotHistoryById(id) {
  const { data } = await api.get(`/pilot-history/${id}`);
  return data.data;
}
