import api from "./api";

export async function getPilotHistory({ page = 1, limit = 10, sort = "desc", action = "all", search = "", pilotId, performedById } = {}) {
  const { data } = await api.get("/pilot-history", {
    params: { page, limit, sort, action, search, pilotId, performedById },
  });
  return data;
}

export async function getPilotHistoryById(id) {
  const { data } = await api.get(`/pilot-history/${id}`);
  return data.data;
}
