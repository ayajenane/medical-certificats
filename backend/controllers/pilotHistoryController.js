import * as pilotHistoryService from '../services/pilotHistoryService.js';

export const getHistory = async (req, res) => {
  try {
    const { page, limit, sort, action, search } = req.query;
    const result = await pilotHistoryService.getHistory({ page, limit, sort, action, search });
    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHistoryById = async (req, res) => {
  try {
    const entry = await pilotHistoryService.getHistoryById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Entrée d'historique introuvable" });
    }
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
