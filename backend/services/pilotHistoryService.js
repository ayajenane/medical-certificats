import PilotHistory from '../models/PilotHistory.js';

const SYSTEM_ACTOR = { userId: null, username: 'Système', email: null };

export const recordHistory = async ({ pilot, pilotName, action, oldData = null, newData = null, performedBy = null }) => {
  return PilotHistory.create({
    pilotId: pilot._id || pilot.id,
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

export const getHistory = async ({ page = 1, limit = 10, sort = 'desc', action, search, pilotId }) => {
  const query = {};

  if (action && action !== 'all') {
    query.action = action;
  }

  if (search) {
    query.pilotName = { $regex: search, $options: 'i' };
  }

  if (pilotId) {
    query.pilotId = pilotId;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const sortOrder = sort === 'asc' ? 1 : -1;

  const [data, total] = await Promise.all([
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

export const getHistoryById = async (id) => {
  return PilotHistory.findById(id);
};
