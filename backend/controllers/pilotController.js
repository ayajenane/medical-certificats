import * as pilotService from '../services/pilotService.js';

// centralise la réponse d'erreur, utilise le code du service s'il existe sinon 500
const handleError = (res, error) => {
  res.status(error.statusCode || 500).json({ message: error.message });
};

// liste paginée des pilotes, la recherche/le filtrage se fait dans le service via req.query
export const getPilots = async (req, res) => {
  try {
    const result = await pilotService.listPilots(req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      counts: result.counts,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// fiche détaillée d'un pilote
export const getPilot = async (req, res) => {
  try {
    const pilot = await pilotService.getPilotById(req.params.id);
    res.status(200).json({ success: true, data: pilot });
  } catch (error) {
    handleError(res, error);
  }
};

// création d'un pilote, req.user sert à tracer qui a fait l'action dans l'historique
export const createPilot = async (req, res) => {
  try {
    const pilot = await pilotService.createPilot(req.body, req.user);
    res.status(201).json({ success: true, data: pilot });
  } catch (error) {
    handleError(res, error);
  }
};

// mise à jour générale des infos du pilote (pas le renouvellement de certificat)
export const updatePilot = async (req, res) => {
  try {
    const pilot = await pilotService.updatePilot(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: pilot });
  } catch (error) {
    handleError(res, error);
  }
};

// renouvellement = juste une nouvelle date, tout le reste est géré par le service
export const renewPilot = async (req, res) => {
  try {
    const { expiryDate } = req.body;
    // 400 si la date manque, on ne laisse pas le service échouer plus loin pour ça
    if (!expiryDate) {
      return res.status(400).json({ message: "La nouvelle date d'expiration est requise" });
    }
    const pilot = await pilotService.renewPilot(req.params.id, expiryDate, req.user);
    res.status(200).json({ success: true, data: pilot });
  } catch (error) {
    handleError(res, error);
  }
};

// archivage = suppression douce, le pilote reste en base mais sort des listes actives
export const archivePilot = async (req, res) => {
  try {
    const pilot = await pilotService.archivePilot(req.params.id, req.user);
    res.status(200).json({ success: true, data: pilot });
  } catch (error) {
    handleError(res, error);
  }
};

// remet un pilote archivé dans la liste active
export const restorePilot = async (req, res) => {
  try {
    const pilot = await pilotService.restorePilot(req.params.id, req.user);
    res.status(200).json({ success: true, data: pilot });
  } catch (error) {
    handleError(res, error);
  }
};

// suppression définitive du pilote (à ne pas confondre avec l'archivage)
export const deletePilot = async (req, res) => {
  try {
    await pilotService.deletePilot(req.params.id, req.user);
    res.status(200).json({ success: true, message: 'Pilote supprimé avec succès' });
  } catch (error) {
    handleError(res, error);
  }
};
