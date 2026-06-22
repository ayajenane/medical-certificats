import AdminHistory from '../models/AdminHistory.js';

export const recordAdminHistory = async ({ admin, action, oldData = null, newData = null, performedBy = null }) => {
  return AdminHistory.create({
    adminId: admin._id || admin.id || null,
    adminName: admin.username || admin.adminName,
    adminEmail: admin.email || null,
    action,
    oldData,
    newData,
    performedBy: performedBy
      ? {
          userId: performedBy._id || performedBy.id || null,
          username: performedBy.username || 'Système',
          email: performedBy.email || null,
        }
      : { userId: null, username: 'Système', email: null },
  });
};

export const getAdminHistory = async ({ page = 1, limit = 10, sort = 'desc', action, search }) => {
  const query = {};

  if (action && action !== 'all') {
    query.action = action;
  }

  if (search) {
    query.$or = [
      { adminName: { $regex: search, $options: 'i' } },
      { adminEmail: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const sortOrder = sort === 'asc' ? 1 : -1;

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
