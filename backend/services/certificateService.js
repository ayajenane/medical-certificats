import Certificate from '../models/Certificate.js';
import Pilot from '../models/Pilot.js';
import { computeStatus } from './pilotService.js';
import { recordHistory } from './pilotHistoryService.js';
import { validateCertificateInput } from '../utils/validation.js';

const notFound = () => {
  const err = new Error('Certificat introuvable');
  err.statusCode = 404;
  return err;
};

const pilotNotFound = () => {
  const err = new Error('Pilote introuvable');
  err.statusCode = 404;
  return err;
};

const validationError = (errors) => {
  const err = new Error(errors.join(' '));
  err.statusCode = 400;
  return err;
};

const SORT_FIELDS = new Set(['issueDate', 'expiryDate', 'createdAt']);

/**
 * Crée un certificat médical, l'associe au pilote et synchronise sa date
 * d'expiration / son statut. Journalise CERTIFICATE_GENERATED et PILOT_RENEWED.
 */
export const createCertificate = async (data, user) => {
  const errors = validateCertificateInput(data);
  if (errors.length) throw validationError(errors);

  const pilot = await Pilot.findById(data.pilotId);
  if (!pilot) throw pilotNotFound();

  const status = computeStatus(data.expiryDate);

  const certificate = await Certificate.create({
    pilotId: pilot._id,
    pilotName: pilot.name,
    certificateNumber: data.certificateNumber,
    medicalClass: data.medicalClass || pilot.medicalClass,
    issueDate: data.issueDate,
    expiryDate: data.expiryDate,
    status,
    formData: data.formData || {},
    generatedBy: user
      ? { userId: user._id || user.id || null, username: user.username || 'Système' }
      : { userId: null, username: 'Système' },
  });

  const oldPilotData = pilot.toJSON();
  pilot.certificateNumber = data.certificateNumber;
  pilot.expiryDate = data.expiryDate;
  pilot.lastKnownStatus = status;
  await pilot.save();

  await recordHistory({
    pilot,
    action: 'CERTIFICATE_GENERATED',
    oldData: null,
    newData: certificate.toJSON(),
    performedBy: user,
  });

  await recordHistory({
    pilot,
    action: 'PILOT_RENEWED',
    oldData: oldPilotData,
    newData: pilot.toJSON(),
    performedBy: user,
  });

  return certificate;
};

/**
 * Liste les certificats avec recherche, filtre de statut, tri et pagination.
 */
export const listCertificates = async ({ pilotId, status, search, sort = '-createdAt', page = 1, limit = 10 } = {}) => {
  const filter = {};

  if (pilotId) {
    filter.pilotId = pilotId;
  }

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (search && search.trim()) {
    const regex = { $regex: search.trim(), $options: 'i' };
    filter.$or = [{ pilotName: regex }, { certificateNumber: regex }];
  }

  let sortField = sort;
  let sortOrder = 1;
  if (sortField.startsWith('-')) {
    sortOrder = -1;
    sortField = sortField.slice(1);
  }
  if (!SORT_FIELDS.has(sortField)) {
    sortField = 'createdAt';
    sortOrder = -1;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);

  const [data, total] = await Promise.all([
    Certificate.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Certificate.countDocuments(filter),
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

export const getCertificateById = async (id) => {
  const certificate = await Certificate.findById(id);
  if (!certificate) throw notFound();
  return certificate;
};

export const getCertificatesByPilot = async (pilotId) => {
  return Certificate.find({ pilotId }).sort({ createdAt: -1 });
};

/** Compte les certificats créés dans le mois en cours. */
export const countCertificatesThisMonth = async () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return Certificate.countDocuments({ createdAt: { $gte: start } });
};

/** Compte les certificats par statut courant. */
export const countCertificatesByStatus = async () => {
  const results = await Certificate.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const counts = { active: 0, expiring: 0, expired: 0 };
  for (const { _id, count } of results) {
    if (counts[_id] !== undefined) counts[_id] = count;
  }
  return counts;
};
