import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../tests/dbHelper.js';
import { recordHistory, getHistory, getHistoryById } from './pilotHistoryService.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

const fakePilot = { _id: '507f1f77bcf86cd799439011', name: 'Jean Dupont' };
const fakeUser = { _id: '507f1f77bcf86cd799439099', username: 'admin', email: 'admin@dgac.ma' };

describe("ajout d'une entrée dans l'historique", () => {
  it('enregistre une action avec les infos de l\'auteur', async () => {
    const entry = await recordHistory({
      pilot: fakePilot,
      action: 'PILOT_CREATED',
      oldData: null,
      newData: { name: fakePilot.name },
      performedBy: fakeUser,
    });

    expect(entry.pilotId.toString()).toBe(fakePilot._id);
    expect(entry.pilotName).toBe('Jean Dupont');
    expect(entry.action).toBe('PILOT_CREATED');
    expect(entry.performedBy.username).toBe('admin');
    expect(entry.performedBy.email).toBe('admin@dgac.ma');
  });

  it('attribue l\'action au "Système" quand performedBy est absent (action automatique)', async () => {
    const entry = await recordHistory({
      pilot: fakePilot,
      action: 'PILOT_EXPIRED',
      oldData: { status: 'active' },
      newData: { status: 'expired' },
    });

    expect(entry.performedBy.username).toBe('Système');
    expect(entry.performedBy.userId).toBeNull();
  });

  it('accepte un pilotName explicite (utile après suppression du pilote)', async () => {
    const entry = await recordHistory({
      pilot: { _id: fakePilot._id },
      pilotName: 'Pilote Supprimé',
      action: 'PILOT_DELETED',
      oldData: { name: 'Pilote Supprimé' },
      newData: null,
      performedBy: fakeUser,
    });

    expect(entry.pilotName).toBe('Pilote Supprimé');
  });
});

describe("récupération de l'historique", () => {
  it('retourne les entrées triées du plus récent au plus ancien par défaut', async () => {
    await recordHistory({ pilot: fakePilot, action: 'PILOT_CREATED', newData: {}, performedBy: fakeUser });
    await recordHistory({ pilot: fakePilot, action: 'PILOT_UPDATED', newData: {}, performedBy: fakeUser });

    const { data } = await getHistory({});
    expect(data).toHaveLength(2);
    expect(data[0].action).toBe('PILOT_UPDATED');
    expect(data[1].action).toBe('PILOT_CREATED');
  });

  it('trie du plus ancien au plus récent avec sort=asc', async () => {
    await recordHistory({ pilot: fakePilot, action: 'PILOT_CREATED', newData: {}, performedBy: fakeUser });
    await recordHistory({ pilot: fakePilot, action: 'PILOT_UPDATED', newData: {}, performedBy: fakeUser });

    const { data } = await getHistory({ sort: 'asc' });
    expect(data[0].action).toBe('PILOT_CREATED');
    expect(data[1].action).toBe('PILOT_UPDATED');
  });

  it('pagine les résultats', async () => {
    for (let i = 0; i < 5; i++) {
      await recordHistory({ pilot: fakePilot, action: 'PILOT_UPDATED', newData: { i }, performedBy: fakeUser });
    }

    const page1 = await getHistory({ page: 1, limit: 2 });
    expect(page1.data).toHaveLength(2);
    expect(page1.pagination).toMatchObject({ page: 1, limit: 2, total: 5, pages: 3 });

    const page2 = await getHistory({ page: 2, limit: 2 });
    expect(page2.data).toHaveLength(2);
    expect(page2.data[0].id).not.toBe(page1.data[0].id);
  });

  it('récupère une entrée par id', async () => {
    const entry = await recordHistory({ pilot: fakePilot, action: 'PILOT_CREATED', newData: {}, performedBy: fakeUser });
    const found = await getHistoryById(entry._id);
    expect(found.action).toBe('PILOT_CREATED');
  });

  it('retourne null pour un id inexistant', async () => {
    const found = await getHistoryById('507f1f77bcf86cd799439000');
    expect(found).toBeNull();
  });
});

describe("filtres de l'historique", () => {
  const otherPilot = { _id: '507f1f77bcf86cd799439022', name: 'Sara Idrissi' };

  it('filtre par action', async () => {
    await recordHistory({ pilot: fakePilot, action: 'PILOT_CREATED', newData: {}, performedBy: fakeUser });
    await recordHistory({ pilot: fakePilot, action: 'PILOT_ARCHIVED', newData: {}, performedBy: fakeUser });

    const { data } = await getHistory({ action: 'PILOT_ARCHIVED' });
    expect(data).toHaveLength(1);
    expect(data[0].action).toBe('PILOT_ARCHIVED');
  });

  it('ignore le filtre action quand il vaut "all"', async () => {
    await recordHistory({ pilot: fakePilot, action: 'PILOT_CREATED', newData: {}, performedBy: fakeUser });
    await recordHistory({ pilot: fakePilot, action: 'PILOT_ARCHIVED', newData: {}, performedBy: fakeUser });

    const { data } = await getHistory({ action: 'all' });
    expect(data).toHaveLength(2);
  });

  it('filtre par pilotId', async () => {
    await recordHistory({ pilot: fakePilot, action: 'PILOT_CREATED', newData: {}, performedBy: fakeUser });
    await recordHistory({ pilot: otherPilot, action: 'PILOT_CREATED', newData: {}, performedBy: fakeUser });

    const { data } = await getHistory({ pilotId: fakePilot._id });
    expect(data).toHaveLength(1);
    expect(data[0].pilotName).toBe('Jean Dupont');
  });

  it('filtre par recherche sur le nom du pilote (insensible à la casse)', async () => {
    await recordHistory({ pilot: fakePilot, action: 'PILOT_CREATED', newData: {}, performedBy: fakeUser });
    await recordHistory({ pilot: otherPilot, action: 'PILOT_CREATED', newData: {}, performedBy: fakeUser });

    const { data } = await getHistory({ search: 'sara' });
    expect(data).toHaveLength(1);
    expect(data[0].pilotName).toBe('Sara Idrissi');
  });

  it("filtre par auteur de l'action (performedById)", async () => {
    const otherUser = { _id: '507f1f77bcf86cd799439033', username: 'autre-admin' };
    await recordHistory({ pilot: fakePilot, action: 'PILOT_CREATED', newData: {}, performedBy: fakeUser });
    await recordHistory({ pilot: fakePilot, action: 'PILOT_UPDATED', newData: {}, performedBy: otherUser });

    const { data } = await getHistory({ performedById: fakeUser._id });
    expect(data).toHaveLength(1);
    expect(data[0].performedBy.username).toBe('admin');
  });

  it('combine plusieurs filtres (action + pilotId)', async () => {
    await recordHistory({ pilot: fakePilot, action: 'PILOT_CREATED', newData: {}, performedBy: fakeUser });
    await recordHistory({ pilot: fakePilot, action: 'PILOT_ARCHIVED', newData: {}, performedBy: fakeUser });
    await recordHistory({ pilot: otherPilot, action: 'PILOT_ARCHIVED', newData: {}, performedBy: fakeUser });

    const { data } = await getHistory({ action: 'PILOT_ARCHIVED', pilotId: fakePilot._id });
    expect(data).toHaveLength(1);
    expect(data[0].pilotName).toBe('Jean Dupont');
  });
});
