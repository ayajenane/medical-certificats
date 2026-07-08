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

// crée le certificat ET met à jour le pilote associé (date d'expiration + statut), avec double log d'historique
export const createCertificate = async (data, user) => {
  const errors = validateCertificateInput(data);
  if (errors.length) throw validationError(errors);

  const pilot = await Pilot.findById(data.pilotId);
  if (!pilot) throw pilotNotFound();

  // statut calculé une seule fois puis réutilisé pour le certificat et pour le pilote
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

  // le certificat renouvelle implicitement le pilote: on garde son état avant modif pour l'historique
  const oldPilotData = pilot.toJSON();
  pilot.certificateNumber = data.certificateNumber;
  pilot.expiryDate = data.expiryDate;
  pilot.lastKnownStatus = status;
  await pilot.save();

  // première entrée: création du certificat
  await recordHistory({
    pilot,
    action: 'CERTIFICATE_GENERATED',
    oldData: null,
    newData: certificate.toJSON(),
    performedBy: user,
  });

  // deuxième entrée d'historique: le pilote est aussi "renouvelé" par cette génération
  await recordHistory({
    pilot,
    action: 'PILOT_RENEWED',
    oldData: oldPilotData,
    newData: pilot.toJSON(),
    performedBy: user,
  });

  return certificate;
};

// liste paginée/filtrée des certificats, avec recherche par pilote ou numéro de certificat
export const listCertificates = async ({ pilotId, status, search, sort = '-createdAt', page = 1, limit = 10 } = {}) => {
  const filter = {};

  if (pilotId) {
    filter.pilotId = pilotId;
  }

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (search && search.trim()) {
    // recherche multicritère sur le nom du pilote ou le numéro de certificat
    const regex = { $regex: search.trim(), $options: 'i' };
    filter.$or = [{ pilotName: regex }, { certificateNumber: regex }];
  }

  // tri: préfixe '-' = ordre décroissant, sinon on retombe sur createdAt si le champ n'est pas autorisé
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

  // normalisation des paramètres de pagination
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);

  // requêtes data + count en parallèle pour construire la pagination
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

// tous les certificats d'un pilote donné, du plus récent au plus ancien
export const getCertificatesByPilot = async (pilotId) => {
  return Certificate.find({ pilotId }).sort({ createdAt: -1 });
};

// compteur pour le dashboard: certificats générés depuis le 1er du mois en cours
export const countCertificatesThisMonth = async () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return Certificate.countDocuments({ createdAt: { $gte: start } });
};

// répartition des certificats par statut (pour les widgets/stats du dashboard)
export const countCertificatesByStatus = async () => {
  const results = await Certificate.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const counts = { active: 0, expiring: 0, expired: 0 };
  for (const { _id, count } of results) {
    // on ignore les statuts inconnus/inattendus pour ne pas polluer l'objet de comptage
    if (counts[_id] !== undefined) counts[_id] = count;
  }
  return counts;
};
