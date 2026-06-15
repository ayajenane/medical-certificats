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

export const computeStatus = (expiryDate) => {
  if (!expiryDate) return 'unknown';
  const days = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'active';
};

/** Met à jour le statut de tous les pilotes non archivés et journalise les expirations. */
export const syncPilotStatuses = async () => {
  const pilots = await Pilot.find({ archived: false });

  for (const pilot of pilots) {
    const status = computeStatus(pilot.expiryDate);
    if (status === 'expired' && pilot.lastKnownStatus !== 'expired') {
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
      pilot.lastKnownStatus = status;
      await pilot.save();
    }
  }
};

/**
 * Liste les pilotes avec recherche, filtres, tri et pagination.
 * @param {object} query
 * @param {string} [query.search] - recherche sur nom, email, licence, nationalité, classe médicale, n° certificat
 * @param {string} [query.status] - all | active | expiring | expired
 * @param {string} [query.archived] - 'true' | 'false'
 * @param {string} [query.medicalClass] - 1 | 2 | 3 | 4
 * @param {string} [query.sort] - name | -name | expiryDate | -expiryDate | createdAt | -createdAt
 * @param {number|string} [query.page]
 * @param {number|string} [query.limit]
 */
export const listPilots = async (query = {}) => {
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

export const updatePilot = async (id, updates, user) => {
  const pilot = await Pilot.findById(id);
  if (!pilot) throw notFound();

  const errors = validatePilotInput(updates, { partial: true });
  if (errors.length) throw validationError(errors);

  const oldData = pilot.toJSON();

  ['name', 'email', 'licenseNumber', 'certificateNumber', 'licenseType', 'nationality', 'medicalClass', 'expiryDate'].forEach((field) => {
    if (updates[field] !== undefined) {
      pilot[field] = updates[field];
    }
  });
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

export const deletePilot = async (id, user) => {
  const pilot = await Pilot.findById(id);
  if (!pilot) throw notFound();

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
