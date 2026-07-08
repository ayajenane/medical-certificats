import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../tests/dbHelper.js';
import app from '../app.js';
import User from '../User.js';
import Pilot from '../models/Pilot.js';
import { createCertificate } from '../services/certificateService.js';

process.env.JWT_SECRET ||= 'test-secret';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

const loginAsAdmin = async () => {
  await User.create({ username: 'admin', email: 'admin@dgac.ma', password: 'secret123' });
  const res = await request(app).post('/api/auth/login').send({ email: 'admin@dgac.ma', password: 'secret123' });
  return res.body.token;
};

describe('GET /api/dashboard/stats', () => {
  it('refuse la requête sans authentification', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(401);
  });

  it('récupère les statistiques globales pour un utilisateur authentifié', async () => {
    const token = await loginAsAdmin();

    const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      totalPilots: 0,
      activeCertificates: 0,
      expiringCertificates: 0,
      expiredCertificates: 0,
      certificatesThisMonth: 0,
    });
    expect(res.body.data.recentActivity).toEqual([]);
  });

  it('compte correctement le nombre de pilotes actifs', async () => {
    const token = await loginAsAdmin();
    await Pilot.create({ name: 'Actif 1', expiryDate: new Date(Date.now() + 200 * 86400000) });
    await Pilot.create({ name: 'Actif 2', expiryDate: new Date(Date.now() + 300 * 86400000) });
    await Pilot.create({ name: 'Expirant', expiryDate: new Date(Date.now() + 10 * 86400000) });

    const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${token}`);

    expect(res.body.data.totalPilots).toBe(3);
    expect(res.body.data.activeCertificates).toBe(2);
    expect(res.body.data.expiringCertificates).toBe(1);
  });

  it('compte correctement le nombre de certificats (pilotes) expirés', async () => {
    const token = await loginAsAdmin();
    await Pilot.create({ name: 'Expiré 1', expiryDate: new Date(Date.now() - 10 * 86400000) });
    await Pilot.create({ name: 'Expiré 2', expiryDate: new Date(Date.now() - 100 * 86400000) });
    await Pilot.create({ name: 'Actif', expiryDate: new Date(Date.now() + 200 * 86400000) });

    const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${token}`);

    expect(res.body.data.expiredCertificates).toBe(2);
    expect(res.body.data.totalPilots).toBe(3);
  });

  it('exclut les pilotes archivés du total', async () => {
    const token = await loginAsAdmin();
    await Pilot.create({ name: 'Visible', expiryDate: new Date(Date.now() + 200 * 86400000) });
    await Pilot.create({ name: 'Archivé', expiryDate: new Date(Date.now() + 200 * 86400000), archived: true });

    const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${token}`);

    expect(res.body.data.totalPilots).toBe(1);
  });

  it('compte les certificats générés ce mois-ci et remonte l\'activité récente', async () => {
    const token = await loginAsAdmin();
    const pilot = await Pilot.create({ name: 'Jean Dupont', expiryDate: new Date(Date.now() + 200 * 86400000) });

    await createCertificate(
      { pilotId: pilot._id, certificateNumber: 'CERT-DASH', issueDate: new Date(), expiryDate: new Date(Date.now() + 200 * 86400000) },
      { _id: '507f1f77bcf86cd799439011', username: 'tester' }
    );

    const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${token}`);

    expect(res.body.data.certificatesThisMonth).toBe(1);
    expect(res.body.data.recentActivity.length).toBeGreaterThan(0);
    expect(res.body.data.recentActivity[0].action).toBe('PILOT_RENEWED');
  });
});
