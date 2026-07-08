import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../tests/dbHelper.js';
import Pilot from '../models/Pilot.js';
import Certificate from '../models/Certificate.js';
import PilotHistory from '../models/PilotHistory.js';
import {
  createCertificate,
  listCertificates,
  getCertificatesByPilot,
  countCertificatesThisMonth,
  countCertificatesByStatus,
} from './certificateService.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

const fakeUser = { _id: '507f1f77bcf86cd799439011', username: 'tester' };

const makePilot = (overrides = {}) =>
  Pilot.create({
    name: 'Jean Dupont',
    expiryDate: new Date(Date.now() + 90 * 86400000),
    medicalClass: '1',
    ...overrides,
  });

describe('création d\'un certificat', () => {
  it('crée un certificat valide rattaché au pilote', async () => {
    const pilot = await makePilot();

    const cert = await createCertificate(
      {
        pilotId: pilot._id,
        certificateNumber: 'CERT-001',
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 86400000),
      },
      fakeUser
    );

    expect(cert.pilotId.toString()).toBe(pilot._id.toString());
    expect(cert.pilotName).toBe(pilot.name);
    expect(cert.certificateNumber).toBe('CERT-001');
  });

  it('reprend la classe médicale du pilote si non précisée', async () => {
    const pilot = await makePilot({ medicalClass: '2' });

    const cert = await createCertificate(
      { pilotId: pilot._id, certificateNumber: 'CERT-002', issueDate: new Date(), expiryDate: new Date(Date.now() + 365 * 86400000) },
      fakeUser
    );

    expect(cert.medicalClass).toBe('2');
  });

  it('met à jour le pilote associé (numéro, date d\'expiration, statut)', async () => {
    const pilot = await makePilot({ expiryDate: new Date(Date.now() + 5 * 86400000) });
    const newExpiry = new Date(Date.now() + 300 * 86400000);

    await createCertificate(
      { pilotId: pilot._id, certificateNumber: 'CERT-003', issueDate: new Date(), expiryDate: newExpiry },
      fakeUser
    );

    const reloaded = await Pilot.findById(pilot._id);
    expect(reloaded.certificateNumber).toBe('CERT-003');
    expect(reloaded.expiryDate.getTime()).toBe(newExpiry.getTime());
    expect(reloaded.lastKnownStatus).toBe('active');
  });

  it('rejette une entrée invalide (dates manquantes)', async () => {
    const pilot = await makePilot();
    await expect(
      createCertificate({ pilotId: pilot._id, certificateNumber: 'CERT-004' }, fakeUser)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejette la création si le pilote associé est introuvable', async () => {
    await expect(
      createCertificate(
        { pilotId: '507f1f77bcf86cd799439099', certificateNumber: 'CERT-005', issueDate: new Date(), expiryDate: new Date(Date.now() + 86400000) },
        fakeUser
      )
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('génération du numéro de certificat', () => {
  it('persiste exactement le numéro fourni (pas de génération automatique côté service)', async () => {
    const pilot = await makePilot();
    const cert = await createCertificate(
      { pilotId: pilot._id, certificateNumber: 'DGAC-C1-2026-042', issueDate: new Date(), expiryDate: new Date(Date.now() + 365 * 86400000) },
      fakeUser
    );

    const stored = await Certificate.findById(cert._id);
    expect(stored.certificateNumber).toBe('DGAC-C1-2026-042');
  });

  it("n'impose pas d'unicité: deux certificats du même pilote peuvent avoir des numéros distincts", async () => {
    const pilot = await makePilot();
    const cert1 = await createCertificate(
      { pilotId: pilot._id, certificateNumber: 'CERT-A', issueDate: new Date(), expiryDate: new Date(Date.now() + 100 * 86400000) },
      fakeUser
    );
    const cert2 = await createCertificate(
      { pilotId: pilot._id, certificateNumber: 'CERT-B', issueDate: new Date(), expiryDate: new Date(Date.now() + 200 * 86400000) },
      fakeUser
    );

    expect(cert1.certificateNumber).not.toBe(cert2.certificateNumber);
    const all = await getCertificatesByPilot(pilot._id);
    expect(all.map((c) => c.certificateNumber).sort()).toEqual(['CERT-A', 'CERT-B']);
  });
});

describe('calcul du statut du certificat', () => {
  it('statut "active" pour une expiration lointaine', async () => {
    const pilot = await makePilot();
    const cert = await createCertificate(
      { pilotId: pilot._id, certificateNumber: 'CERT-ACTIVE', issueDate: new Date(), expiryDate: new Date(Date.now() + 90 * 86400000) },
      fakeUser
    );
    expect(cert.status).toBe('active');
  });

  it('statut "expiring" pour une expiration à moins de 30 jours', async () => {
    const pilot = await makePilot();
    const cert = await createCertificate(
      { pilotId: pilot._id, certificateNumber: 'CERT-EXPIRING', issueDate: new Date(), expiryDate: new Date(Date.now() + 10 * 86400000) },
      fakeUser
    );
    expect(cert.status).toBe('expiring');
  });

  it('statut "expired" pour une date d\'expiration déjà passée', async () => {
    const pilot = await makePilot();
    // la validation exige expiryDate > issueDate: on émet dans le passé aussi
    const cert = await createCertificate(
      {
        pilotId: pilot._id,
        certificateNumber: 'CERT-EXPIRED',
        issueDate: new Date(Date.now() - 400 * 86400000),
        expiryDate: new Date(Date.now() - 5 * 86400000),
      },
      fakeUser
    );
    expect(cert.status).toBe('expired');
  });
});

describe('renouvellement (génération d\'un nouveau certificat pour un pilote existant)', () => {
  it('met à jour la date d\'expiration et le statut du pilote sur le dernier certificat généré', async () => {
    const pilot = await makePilot({ expiryDate: new Date(Date.now() + 20 * 86400000) });

    await createCertificate(
      { pilotId: pilot._id, certificateNumber: 'CERT-INITIAL', issueDate: new Date(), expiryDate: new Date(Date.now() + 20 * 86400000) },
      fakeUser
    );

    const renewedExpiry = new Date(Date.now() + 400 * 86400000);
    await createCertificate(
      { pilotId: pilot._id, certificateNumber: 'CERT-RENEWED', issueDate: new Date(), expiryDate: renewedExpiry },
      fakeUser
    );

    const reloaded = await Pilot.findById(pilot._id);
    expect(reloaded.certificateNumber).toBe('CERT-RENEWED');
    expect(reloaded.expiryDate.getTime()).toBe(renewedExpiry.getTime());
    expect(reloaded.lastKnownStatus).toBe('active');
  });

  it('journalise CERTIFICATE_GENERATED et PILOT_RENEWED à chaque génération', async () => {
    const pilot = await makePilot();

    await createCertificate(
      { pilotId: pilot._id, certificateNumber: 'CERT-1', issueDate: new Date(), expiryDate: new Date(Date.now() + 100 * 86400000) },
      fakeUser
    );
    await createCertificate(
      { pilotId: pilot._id, certificateNumber: 'CERT-2', issueDate: new Date(), expiryDate: new Date(Date.now() + 200 * 86400000) },
      fakeUser
    );

    const generated = await PilotHistory.countDocuments({ pilotId: pilot._id, action: 'CERTIFICATE_GENERATED' });
    const renewed = await PilotHistory.countDocuments({ pilotId: pilot._id, action: 'PILOT_RENEWED' });
    expect(generated).toBe(2);
    expect(renewed).toBe(2);
  });

  it('conserve tous les certificats précédents (historique des générations), triés du plus récent au plus ancien', async () => {
    const pilot = await makePilot();

    await createCertificate(
      { pilotId: pilot._id, certificateNumber: 'CERT-OLD', issueDate: new Date(), expiryDate: new Date(Date.now() + 50 * 86400000) },
      fakeUser
    );
    await createCertificate(
      { pilotId: pilot._id, certificateNumber: 'CERT-NEW', issueDate: new Date(), expiryDate: new Date(Date.now() + 500 * 86400000) },
      fakeUser
    );

    const history = await getCertificatesByPilot(pilot._id);
    expect(history).toHaveLength(2);
    expect(history[0].certificateNumber).toBe('CERT-NEW');
    expect(history[1].certificateNumber).toBe('CERT-OLD');
  });
});

describe('listing et compteurs', () => {
  it('filtre les certificats par statut et par pilote', async () => {
    const pilotA = await makePilot({ name: 'Pilote Actif' });
    const pilotB = await makePilot({ name: 'Pilote Expiré' });

    await createCertificate(
      { pilotId: pilotA._id, certificateNumber: 'CERT-A', issueDate: new Date(), expiryDate: new Date(Date.now() + 200 * 86400000) },
      fakeUser
    );
    await createCertificate(
      {
        pilotId: pilotB._id,
        certificateNumber: 'CERT-B',
        issueDate: new Date(Date.now() - 400 * 86400000),
        expiryDate: new Date(Date.now() - 5 * 86400000),
      },
      fakeUser
    );

    const { data } = await listCertificates({ status: 'expired' });
    expect(data).toHaveLength(1);
    expect(data[0].pilotName).toBe('Pilote Expiré');

    const byPilot = await listCertificates({ pilotId: pilotA._id.toString() });
    expect(byPilot.data).toHaveLength(1);
  });

  it('compte les certificats générés ce mois-ci', async () => {
    const pilot = await makePilot();
    await createCertificate(
      { pilotId: pilot._id, certificateNumber: 'CERT-MONTH', issueDate: new Date(), expiryDate: new Date(Date.now() + 100 * 86400000) },
      fakeUser
    );

    expect(await countCertificatesThisMonth()).toBe(1);
  });

  it('regroupe les compteurs par statut', async () => {
    const pilotActive = await makePilot();
    const pilotExpired = await makePilot();

    await createCertificate(
      { pilotId: pilotActive._id, certificateNumber: 'CERT-C', issueDate: new Date(), expiryDate: new Date(Date.now() + 200 * 86400000) },
      fakeUser
    );
    await createCertificate(
      {
        pilotId: pilotExpired._id,
        certificateNumber: 'CERT-D',
        issueDate: new Date(Date.now() - 400 * 86400000),
        expiryDate: new Date(Date.now() - 5 * 86400000),
      },
      fakeUser
    );

    const counts = await countCertificatesByStatus();
    expect(counts.active).toBe(1);
    expect(counts.expired).toBe(1);
  });
});
