import AdminHistory from '../models/AdminHistory.js';

// enregistre une action effectuée sur/par un compte admin (création, modif, suppression...)
// performedBy null = action système
export const recordAdminHistory = async ({ admin, action, oldData = null, newData = null, performedBy = null }) => {
  return AdminHistory.create({
    // fallback _id/id car selon le contexte "admin" peut être un doc Mongoose ou un objet simple
    adminId: admin._id || admin.id || null,
    adminName: admin.username || admin.adminName,
    adminEmail: admin.email || null,
    action,
    oldData,
    newData,
    // si personne n'a explicitement fait l'action, on l'attribue au "Système"
    performedBy: performedBy
      ? {
          userId: performedBy._id || performedBy.id || null,
          username: performedBy.username || 'Système',
          email: performedBy.email || null,
        }
      : { userId: null, username: 'Système', email: null },
  });
};

// liste paginée/filtrée de l'historique admin, utilisée par la page AdminHistory du dashboard
export const getAdminHistory = async ({ page = 1, limit = 10, sort = 'desc', action, search }) => {
  const query = {};

  // filtre par type d'action, 'all' = pas de filtre
  if (action && action !== 'all') {
    query.action = action;
  }

  if (search) {
    // recherche sur nom OU email admin
    query.$or = [
      { adminName: { $regex: search, $options: 'i' } },
      { adminEmail: { $regex: search, $options: 'i' } },
    ];
  }

  // normalisation des paramètres de pagination pour éviter des valeurs négatives/NaN
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const sortOrder = sort === 'asc' ? 1 : -1;

  // requêtes data + count en parallèle pour la pagination
  const [data, total] = await Promise.all([
    AdminHistory.find(query)
      .sort({ createdAt: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    AdminHistory.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
};
