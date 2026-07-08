import PilotHistory from '../models/PilotHistory.js';

// acteur par défaut quand aucun utilisateur n'a explicitement déclenché l'action
const SYSTEM_ACTOR = { userId: null, username: 'Système', email: null };

// journalise un événement du cycle de vie d'un pilote (création, modif, renouvellement, etc.)
// performedBy null = action système (ex: expiration auto détectée par le cron/sync)
export const recordHistory = async ({ pilot, pilotName, action, oldData = null, newData = null, performedBy = null }) => {
  return PilotHistory.create({
    // fallback _id/id car "pilot" peut être un doc Mongoose ou un objet simple
    pilotId: pilot._id || pilot.id,
    // pilotName explicite utile quand le pilote vient d'être supprimé (voir deletePilot)
    pilotName: pilotName || pilot.name,
    action,
    oldData,
    newData,
    performedBy: performedBy
      ? {
          userId: performedBy._id || performedBy.id || null,
          username: performedBy.username || 'Système',
          email: performedBy.email || null,
        }
      : SYSTEM_ACTOR,
  });
};

// liste paginée/filtrée de l'historique des pilotes (page History et fiche pilote)
export const getHistory = async ({ page = 1, limit = 10, sort = 'desc', action, search, pilotId, performedById }) => {
  const query = {};

  // filtre par type d'action, 'all' = pas de filtre
  if (action && action !== 'all') {
    query.action = action;
  }

  if (search) {
    query.pilotName = { $regex: search, $options: 'i' };
  }

  // restreint l'historique à un pilote précis (fiche pilote)
  if (pilotId) {
    query.pilotId = pilotId;
  }

  // restreint l'historique aux actions faites par un utilisateur précis
  if (performedById) {
    query['performedBy.userId'] = performedById;
  }

  // normalisation des paramètres de pagination pour éviter des valeurs négatives/NaN
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const sortOrder = sort === 'asc' ? 1 : -1;

  const [data, total] = await Promise.all([
    // skip/limit pour la pagination
    PilotHistory.find(query)
      .sort({ createdAt: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    PilotHistory.countDocuments(query),
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

// récupère une entrée d'historique précise (ex: pour afficher le détail d'un événement)
export const getHistoryById = async (id) => {
  return PilotHistory.findById(id);
};
