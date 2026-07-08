import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../tests/dbHelper.js';
import Pilot from '../models/Pilot.js';
import {
  computeStatus,
  listPilots,
  createPilot,
  updatePilot,
  archivePilot,
  deletePilot,
} from './pilotService.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

describe('computeStatus', () => {
  it('retourne "unknown" sans date', () => {
    expect(computeStatus(null)).toBe('unknown');
  });

  it('retourne "expired" pour une date passée', () => {
    expect(computeStatus(new Date(Date.now() - 86400000))).toBe('expired');
  });

  it('retourne "expiring" pour une date dans moins de 30 jours', () => {
    expect(computeStatus(new Date(Date.now() + 10 * 86400000))).toBe('expiring');
  });

  it('retourne "active" pour une date dans plus de 30 jours', () => {
    expect(computeStatus(new Date(Date.now() + 60 * 86400000))).toBe('active');
  });
});

describe('createPilot / listPilots', () => {
  const fakeUser = { _id: '507f1f77bcf86cd799439011', username: 'tester' };

  it('crée un pilote valide et calcule son statut', async () => {
    const pilot = await createPilot(
      { name: 'Jean Dupont', expiryDate: new Date(Date.now() + 60 * 86400000), medicalClass: '1' },
      fakeUser
    );
    expect(pilot.name).toBe('Jean Dupont');
    expect(pilot.lastKnownStatus).toBe('active');
  });

  it('rejette un pilote invalide (statusCode 400)', async () => {
    await expect(createPilot({ name: '' }, fakeUser)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('liste, filtre par statut et pagine', async () => {
    await createPilot({ name: 'Actif', expiryDate: new Date(Date.now() + 90 * 86400000) }, fakeUser);
    await createPilot({ name: 'Expiré', expiryDate: new Date(Date.now() - 10 * 86400000) }, fakeUser);

    const { data, counts } = await listPilots({ status: 'expired' });
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Expiré');
    expect(counts.expired).toBe(1);
    expect(counts.active).toBe(1);
  });

  it('recherche multicritère sur le nom', async () => {
    await createPilot({ name: 'Amine Alaoui', expiryDate: new Date(Date.now() + 90 * 86400000) }, fakeUser);
    await createPilot({ name: 'Sara Idrissi', expiryDate: new Date(Date.now() + 90 * 86400000) }, fakeUser);

    const { data } = await listPilots({ search: 'Alaoui' });
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Amine Alaoui');
  });

  it('met à jour un pilote et journalise', async () => {
    const pilot = await createPilot({ name: 'À renommer', expiryDate: new Date(Date.now() + 90 * 86400000) }, fakeUser);
    const updated = await updatePilot(pilot._id, { name: 'Renommé' }, fakeUser);
    expect(updated.name).toBe('Renommé');
  });

  it('archive puis exclut le pilote des résultats non archivés', async () => {
    const pilot = await createPilot({ name: 'À archiver', expiryDate: new Date(Date.now() + 90 * 86400000) }, fakeUser);
    await archivePilot(pilot._id, fakeUser);

    const { data } = await listPilots({ archived: 'false' });
    expect(data.find((p) => p.id === String(pilot._id))).toBeUndefined();
  });

  it('supprime un pilote et retourne un snapshot', async () => {
    const pilot = await createPilot({ name: 'À supprimer', expiryDate: new Date(Date.now() + 90 * 86400000) }, fakeUser);
    const snapshot = await deletePilot(pilot._id, fakeUser);
    expect(snapshot.name).toBe('À supprimer');
    expect(await Pilot.findById(pilot._id)).toBeNull();
  });
});
