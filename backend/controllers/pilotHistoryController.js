import * as pilotHistoryService from '../services/pilotHistoryService.js';

// liste paginée de l'historique des pilotes, filtrable par pilote/auteur/action/recherche libre
export const getHistory = async (req, res, next) => {
  try {
    const { page, limit, sort, action, search, pilotId, performedById } = req.query;
    const result = await pilotHistoryService.getHistory({ page, limit, sort, action, search, pilotId, performedById });
    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

// une seule entrée d'historique par id, 404 explicite si elle n'existe pas (ex: id supprimé/invalide)
export const getHistoryById = async (req, res, next) => {
  try {
    const entry = await pilotHistoryService.getHistoryById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Entrée d'historique introuvable" });
    }
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};
