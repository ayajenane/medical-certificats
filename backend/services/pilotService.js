import Pilot from '../models/Pilot.js';
import { recordHistory } from './pilotHistoryService.js';

const notFound = () => {
  const err = new Error('Pilote introuvable');
  err.statusCode = 404;
  return err;
};

export const computeStatus = (expiryDate) => {
  if (!expiryDate) return 'unknown';
  const days = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'active';
};

/** Récupère tous les pilotes et déclare automatiquement les certificats expirés. */
export const listPilots = async () => {
  const pilots = await Pilot.find().sort({ createdAt: -1 });

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

  return pilots;
};

export const getPilotById = async (id) => {
  const pilot = await Pilot.findById(id);
  if (!pilot) throw notFound();
  return pilot;
};

export const createPilot = async (data, user) => {
  const pilot = new Pilot({
    name: data.name,
    email: data.email,
    licenseNumber: data.licenseNumber,
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

  const oldData = pilot.toJSON();

  ['name', 'email', 'licenseNumber', 'licenseType', 'nationality', 'medicalClass', 'expiryDate'].forEach((field) => {
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
