import * as certificateService from '../services/certificateService.js';

// centralise la réponse d'erreur, utilise le code du service s'il existe sinon 500
const handleError = (res, error) => {
  res.status(error.statusCode || 500).json({ message: error.message });
};

// crée un certificat pour un pilote, l'utilisateur connecté sert de "créé par"
export const createCertificate = async (req, res) => {
  try {
    const certificate = await certificateService.createCertificate(req.body, req.user);
    res.status(201).json({ success: true, data: certificate });
  } catch (error) {
    handleError(res, error);
  }
};

// liste paginée/filtrable de tous les certificats, filtres passés tels quels au service
export const getCertificates = async (req, res) => {
  try {
    const { page, limit, sort, status, search, pilotId } = req.query;
    const result = await certificateService.listCertificates({ page, limit, sort, status, search, pilotId });
    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    handleError(res, error);
  }
};

// récupère un seul certificat par son id
export const getCertificate = async (req, res) => {
  try {
    const certificate = await certificateService.getCertificateById(req.params.id);
    res.status(200).json({ success: true, data: certificate });
  } catch (error) {
    handleError(res, error);
  }
};

// tous les certificats liés à un pilote donné (utile pour la fiche pilote)
export const getCertificatesByPilot = async (req, res) => {
  try {
    const certificates = await certificateService.getCertificatesByPilot(req.params.pilotId);
    res.status(200).json({ success: true, data: certificates });
  } catch (error) {
    handleError(res, error);
  }
};
