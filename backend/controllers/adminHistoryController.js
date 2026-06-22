import * as adminHistoryService from '../services/adminHistoryService.js';

export const getAdminHistory = async (req, res) => {
  try {
    const { page, limit, sort, action, search } = req.query;
    const result = await adminHistoryService.getAdminHistory({ page, limit, sort, action, search });
    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
