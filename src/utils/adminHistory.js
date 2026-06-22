import api from "./api";

export async function getAdminHistory({ page = 1, limit = 10, sort = "desc", action = "all", search = "" } = {}) {
  const { data } = await api.get("/admin-history", {
    params: { page, limit, sort, action, search },
  });
  return data;
}
