import * as adminHistoryService from '../services/adminHistoryService.js';

// historique des actions des admins (créations/modifs de comptes), accès réservé au super admin via la route
export const getAdminHistory = async (req, res, next) => {
  try {
    // filtres et pagination viennent tous de la query string
    const { page, limit, sort, action, search } = req.query;
    const result = await adminHistoryService.getAdminHistory({ page, limit, sort, action, search });
    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};
