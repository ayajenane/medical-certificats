import * as certificateService from '../services/certificateService.js';

const handleError = (res, error) => {
  res.status(error.statusCode || 500).json({ message: error.message });
};

export const createCertificate = async (req, res) => {
  try {
    const certificate = await certificateService.createCertificate(req.body, req.user);
    res.status(201).json({ success: true, data: certificate });
  } catch (error) {
    handleError(res, error);
  }
};

export const getCertificates = async (req, res) => {
  try {
    const { page, limit, sort, status, search, pilotId } = req.query;
    const result = await certificateService.listCertificates({ page, limit, sort, status, search, pilotId });
    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    handleError(res, error);
  }
};

export const getCertificate = async (req, res) => {
  try {
    const certificate = await certificateService.getCertificateById(req.params.id);
    res.status(200).json({ success: true, data: certificate });
  } catch (error) {
    handleError(res, error);
  }
};

export const getCertificatesByPilot = async (req, res) => {
  try {
    const certificates = await certificateService.getCertificatesByPilot(req.params.pilotId);
    res.status(200).json({ success: true, data: certificates });
  } catch (error) {
    handleError(res, error);
  }
};
