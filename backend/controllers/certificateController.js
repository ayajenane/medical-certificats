import * as certificateService from '../services/certificateService.js';

// crée un certificat pour un pilote, l'utilisateur connecté sert de "créé par"
export const createCertificate = async (req, res, next) => {
  try {
    const certificate = await certificateService.createCertificate(req.body, req.user);
    res.status(201).json({ success: true, data: certificate });
  } catch (error) {
    next(error);
  }
};

// liste paginée/filtrable de tous les certificats, filtres passés tels quels au service
export const getCertificates = async (req, res, next) => {
  try {
    const { page, limit, sort, status, search, pilotId } = req.query;
    const result = await certificateService.listCertificates({ page, limit, sort, status, search, pilotId });
    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

// récupère un seul certificat par son id
export const getCertificate = async (req, res, next) => {
  try {
    const certificate = await certificateService.getCertificateById(req.params.id);
    res.status(200).json({ success: true, data: certificate });
  } catch (error) {
    next(error);
  }
};

// tous les certificats liés à un pilote donné (utile pour la fiche pilote)
export const getCertificatesByPilot = async (req, res, next) => {
  try {
    const certificates = await certificateService.getCertificatesByPilot(req.params.pilotId);
    res.status(200).json({ success: true, data: certificates });
  } catch (error) {
    next(error);
  }
};
