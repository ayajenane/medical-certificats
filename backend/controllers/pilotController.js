import * as pilotService from '../services/pilotService.js';

const handleError = (res, error) => {
  res.status(error.statusCode || 500).json({ message: error.message });
};

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

export const getPilot = async (req, res) => {
  try {
    const pilot = await pilotService.getPilotById(req.params.id);
    res.status(200).json({ success: true, data: pilot });
  } catch (error) {
    handleError(res, error);
  }
};

export const createPilot = async (req, res) => {
  try {
    const pilot = await pilotService.createPilot(req.body, req.user);
    res.status(201).json({ success: true, data: pilot });
  } catch (error) {
    handleError(res, error);
  }
};

export const updatePilot = async (req, res) => {
  try {
    const pilot = await pilotService.updatePilot(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: pilot });
  } catch (error) {
    handleError(res, error);
  }
};

export const renewPilot = async (req, res) => {
  try {
    const { expiryDate } = req.body;
    if (!expiryDate) {
      return res.status(400).json({ message: "La nouvelle date d'expiration est requise" });
    }
    const pilot = await pilotService.renewPilot(req.params.id, expiryDate, req.user);
    res.status(200).json({ success: true, data: pilot });
  } catch (error) {
    handleError(res, error);
  }
};

export const archivePilot = async (req, res) => {
  try {
    const pilot = await pilotService.archivePilot(req.params.id, req.user);
    res.status(200).json({ success: true, data: pilot });
  } catch (error) {
    handleError(res, error);
  }
};

export const restorePilot = async (req, res) => {
  try {
    const pilot = await pilotService.restorePilot(req.params.id, req.user);
    res.status(200).json({ success: true, data: pilot });
  } catch (error) {
    handleError(res, error);
  }
};

export const deletePilot = async (req, res) => {
  try {
    await pilotService.deletePilot(req.params.id, req.user);
    res.status(200).json({ success: true, message: 'Pilote supprimé avec succès' });
  } catch (error) {
    handleError(res, error);
  }
};
