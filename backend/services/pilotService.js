import Pilot from '../models/Pilot.js';
import { recordHistory } from './pilotHistoryService.js';
import { validatePilotInput } from '../utils/validation.js';

const notFound = () => {
  const err = new Error('Pilote introuvable');
  err.statusCode = 404;
  return err;
};

const validationError = (errors) => {
  const err = new Error(errors.join(' '));
  err.statusCode = 400;
  return err;
};

const SORT_FIELDS = new Set(['name', 'expiryDate', 'createdAt']);
const MEDICAL_CLASSES = ['1', '2', '3', '4'];

// active si >30j avant expiration, expiring si <=30j, expired si dépassé
export const computeStatus = (expiryDate) => {
  if (!expiryDate) return 'unknown';
  const days = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'active';
};

// recalcule le statut de chaque pilote actif, journalise seulement les nouvelles expirations
export const syncPilotStatuses = async () => {
  const pilots = await Pilot.find({ archived: false });

  for (const pilot of pilots) {
    const status = computeStatus(pilot.expiryDate);
    if (status === 'expired' && pilot.lastKnownStatus !== 'expired') {
      // transition vers "expired": on journalise l'événement (pas pour les autres transitions)
      const oldData = pilot.toJSON();
      pilot.lastKnownStatus = 'expired';
      await pilot.save();

      await recordHistory({
        pilot,
        action: 'PILOT_EXPIRED',
        oldData: { status: oldData.lastKnownStatus, expiryDate: oldData.expiryDate },
        newData: { status: 'expired', expiryDate: pilot.expiryDate },
        performedBy: null,
      });
    } else if (status !== pilot.lastKnownStatus) {
      // autres transitions (ex: active -> expiring): mise à jour silencieuse, pas de log
      pilot.lastKnownStatus = status;
      await pilot.save();
    }
  }
};

// liste paginée/filtrée des pilotes, avec resynchro des statuts avant lecture
export const listPilots = async (query = {}) => {
  // toujours resynchroniser les statuts avant de lister, pour ne pas afficher de données périmées
  await syncPilotStatuses();

  const { search, status = 'all', archived, medicalClass, sort = '-createdAt', page = 1, limit = 10 } = query;

  const filter = {};
  filter.archived = archived === 'true';

  if (status && status !== 'all') {
    filter.lastKnownStatus = status;
  }

  if (medicalClass && MEDICAL_CLASSES.includes(String(medicalClass))) {
    filter.medicalClass = String(medicalClass);
  }

  if (search && search.trim()) {
    // recherche multicritère: un seul terme testé sur plusieurs champs à la fois
    const term = search.trim();
    const regex = { $regex: term, $options: 'i' };
    const or = [
      { name: regex },
      { email: regex },
      { licenseNumber: regex },
      { nationality: regex },
      { certificateNumber: regex },
    ];
    if (MEDICAL_CLASSES.includes(term)) {
      or.push({ medicalClass: term });
    }
    filter.$or = or;
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

  // data, count et compteurs par statut récupérés en parallèle
  const [data, total, counts] = await Promise.all([
    Pilot.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Pilot.countDocuments(filter),
    getStatusCounts(),
  ]);

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
    counts,
  };
};

// répartition des pilotes actifs (non archivés) par statut, pour les cartes de stats du dashboard
export const getStatusCounts = async () => {
  const results = await Pilot.aggregate([
    { $match: { archived: false } },
    { $group: { _id: '$lastKnownStatus', count: { $sum: 1 } } },
  ]);

  const counts = { all: 0, active: 0, expiring: 0, expired: 0, unknown: 0 };
  for (const { _id, count } of results) {
    counts[_id] = count;
    counts.all += count;
  }
  return counts;
};

export const getPilotById = async (id) => {
  const pilot = await Pilot.findById(id);
  if (!pilot) throw notFound();
  return pilot;
};

// crée un pilote et journalise l'événement PILOT_CREATED
export const createPilot = async (data, user) => {
  const errors = validatePilotInput(data);
  if (errors.length) throw validationError(errors);

  const pilot = new Pilot({
    name: data.name,
    email: data.email,
    licenseNumber: data.licenseNumber,
    certificateNumber: data.certificateNumber,
    licenseType: data.licenseType,
    nationality: data.nationality,
    medicalClass: data.medicalClass,
    expiryDate: data.expiryDate,
  });
  pilot.lastKnownStatus = computeStatus(pilot.expiryDate);
  await pilot.save();

  await recordHistory({
    pilot,
    action: 'PILOT_CREATED',
    oldData: null,
    newData: pilot.toJSON(),
    performedBy: user,
  });

  return pilot;
};

// mise à jour partielle d'un pilote (seuls les champs présents dans updates sont modifiés)
export const updatePilot = async (id, updates, user) => {
  const pilot = await Pilot.findById(id);
  if (!pilot) throw notFound();

  const errors = validatePilotInput(updates, { partial: true });
  if (errors.length) throw validationError(errors);

  const oldData = pilot.toJSON();

  // n'applique que les champs réellement fournis dans le body (update partiel)
  ['name', 'email', 'licenseNumber', 'certificateNumber', 'licenseType', 'nationality', 'medicalClass', 'expiryDate'].forEach((field) => {
    if (updates[field] !== undefined) {
      pilot[field] = updates[field];
    }
  });
  // le statut dépend de expiryDate, donc on le recalcule à chaque update
  pilot.lastKnownStatus = computeStatus(pilot.expiryDate);
  await pilot.save();

  await recordHistory({
    pilot,
    action: 'PILOT_UPDATED',
    oldData,
    newData: pilot.toJSON(),
    performedBy: user,
  });

  return pilot;
};

// renouvelle uniquement la date d'expiration d'un pilote (sans passer par un nouveau certificat)
export const renewPilot = async (id, expiryDate, user) => {
  const pilot = await Pilot.findById(id);
  if (!pilot) throw notFound();

  const oldData = pilot.toJSON();

  pilot.expiryDate = expiryDate;
  pilot.lastKnownStatus = computeStatus(expiryDate);
  await pilot.save();

  await recordHistory({
    pilot,
    action: 'PILOT_RENEWED',
    oldData,
    newData: pilot.toJSON(),
    performedBy: user,
  });

  return pilot;
};

// archive un pilote (soft-delete: il disparaît des listes actives mais reste en base)
export const archivePilot = async (id, user) => {
  const pilot = await Pilot.findById(id);
  if (!pilot) throw notFound();

  const oldData = pilot.toJSON();
  pilot.archived = true;
  await pilot.save();

  await recordHistory({
    pilot,
    action: 'PILOT_ARCHIVED',
    oldData,
    newData: pilot.toJSON(),
    performedBy: user,
  });

  return pilot;
};

// réactive un pilote précédemment archivé
export const restorePilot = async (id, user) => {
  const pilot = await Pilot.findById(id);
  if (!pilot) throw notFound();

  const oldData = pilot.toJSON();
  pilot.archived = false;
  await pilot.save();

  await recordHistory({
    pilot,
    action: 'PILOT_RESTORED',
    oldData,
    newData: pilot.toJSON(),
    performedBy: user,
  });

  return pilot;
};

// suppression définitive d'un pilote
export const deletePilot = async (id, user) => {
  const pilot = await Pilot.findById(id);
  if (!pilot) throw notFound();

  // on garde une copie pour l'historique puisque le doc n'existera plus après
  const snapshot = pilot.toJSON();
  await pilot.deleteOne();

  await recordHistory({
    pilot,
    pilotName: snapshot.name,
    action: 'PILOT_DELETED',
    oldData: snapshot,
    newData: null,
    performedBy: user,
  });

  return snapshot;
};
