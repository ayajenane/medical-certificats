// peuple la base avec des pilotes, certificats et historique réalistes et datés dans le passé,
// pour que la plateforme apparaisse déjà utilisée en démo/soutenance (et pas juste des comptes vides).
// idempotent : un pilote déjà présent (même licenseNumber) est ignoré, on ne duplique rien.
// insertOne direct (comme migrateAdminHistory.js) pour pouvoir forcer createdAt dans le passé,
// ce que les hooks de timestamps de mongoose ne permettent pas via .save()/.create().
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../User.js';
import Pilot from '../models/Pilot.js';
import Certificate from '../models/Certificate.js';
import PilotHistory from '../models/PilotHistory.js';
import AdminHistory from '../models/AdminHistory.js';
import { computeStatus } from '../services/pilotService.js';

const DAY = 86400000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const addMonths = (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; };
const oid = () => new mongoose.Types.ObjectId();

const AME_DOCTORS = ['Dr. Hicham Belmahi', 'Dr. Naima Sabir', 'Dr. Younes Kadiri'];
const doctorFor = (i) => AME_DOCTORS[i % AME_DOCTORS.length];

// --- comptes admins additionnels, pour que l'historique ait plusieurs auteurs réels ---
async function ensureAdmins() {
  const roster = [
    { username: 'Dr. Amine Tazi', email: 'a.tazi@dgac.ma', password: 'Inspecteur@2024' },
    { username: 'Dr. Salma Idrissi', email: 's.idrissi@dgac.ma', password: 'Inspecteur@2024' },
  ];
  const superadmin = await User.findOne({ role: 'superadmin' });
  const admins = [];
  for (const data of roster) {
    let user = await User.findOne({ email: data.email });
    if (!user) {
      user = new User({ ...data, role: 'admin' });
      await user.save(); // hook pre('save') hash le mot de passe
      await AdminHistory.collection.insertOne({
        adminId: user._id,
        adminName: user.username,
        adminEmail: user.email,
        action: 'ADMIN_CREATED',
        oldData: null,
        newData: { username: user.username, email: user.email },
        performedBy: superadmin
          ? { userId: superadmin._id, username: superadmin.username, email: superadmin.email }
          : { userId: null, username: 'Système', email: null },
        createdAt: daysAgo(240),
      });
      console.log(`  admin créé : ${user.username} (${user.email})`);
    }
    admins.push(user);
  }
  return { admins, superadmin };
}

// --- génère le formData réaliste selon le modèle de certificat (classe 2 -> Pdf2, sinon Pdf1) ---
function buildFormData({ medicalClass, certificateNumber, holderName, birthDate, birthPlace, address, nationality, issueDate, expiryDate, restrictions, doctor }) {
  if (medicalClass === '2') {
    return {
      state_authority: 'Royaume du Maroc — Direction Générale de l\'Aviation Civile',
      certificate_number: certificateNumber,
      holder_name: holderName,
      birth_date: iso(birthDate).split('-').reverse().join('/'), // champ texte libre "JJ/MM/AAAA"
      nationality,
      expiry_class1_single: '',
      expiry_class1_other: '',
      expiry_class2: iso(expiryDate),
      expiry_lapl: '',
      issue_date: iso(issueDate),
      last_medical_date: iso(issueDate),
      last_ecg_date: iso(issueDate),
      last_audiogram_date: iso(issueDate),
      holder_signature: holderName,
      ame_signature: doctor,
      stamp: 'DGAC — Cachet AMC agréé',
    };
  }
  return {
    certificate_number: certificateNumber,
    holder_name: holderName,
    birth_details: `${iso(birthDate).split('-').reverse().join('/')} — ${birthPlace}`,
    address,
    nationality,
    signature: holderName,
    issue_date: iso(issueDate),
    restrictions: restrictions || 'Néant',
    doctor_signature: doctor,
    class1_expiry: medicalClass === '1' ? iso(expiryDate) : '',
    class2_expiry: '',
    exam_date: iso(issueDate),
    next_ecg: iso(addMonths(issueDate, 12)),
    next_audiogram: iso(addMonths(issueDate, 12)),
    next_ent: iso(addMonths(issueDate, 24)),
    next_ophthalmology: iso(addMonths(issueDate, 12)),
  };
}

// --- config déclarative : chaque pilote = son profil + ses événements dans l'ordre chronologique ---
// (daysAgo = ancienneté en jours ; les certificats sont donnés du plus ancien au plus récent)
const ROSTER = [
  { name: 'Youssef El Amrani', email: 'y.elamrani@ram.ma', licenseNumber: 'MA-ATPL-2016-0245', nationality: 'Marocaine', medicalClass: '1',
    birthDate: '1982-04-12', birthPlace: 'Casablanca, Maroc', address: '12 Rue Al Massira, Casablanca',
    certs: [{ daysAgo: 730, validityMonths: 12 }, { daysAgo: 365, validityMonths: 12 }, { daysAgo: 20, validityMonths: 12 }] },

  { name: 'Karim Benjelloun', email: 'k.benjelloun@ram.ma', licenseNumber: 'MA-ATPL-2015-0198', nationality: 'Marocaine', medicalClass: '1',
    birthDate: '1979-11-03', birthPlace: 'Fès, Maroc', address: '45 Avenue Hassan II, Fès',
    certs: [{ daysAgo: 900, validityMonths: 12 }, { daysAgo: 540, validityMonths: 12 }, { daysAgo: 350, validityMonths: 12 }] }, // expire ~15j

  { name: 'Sara Benslimane', email: 's.benslimane@gmail.com', licenseNumber: 'MA-CPL-2018-0812', nationality: 'Marocaine', medicalClass: '1',
    birthDate: '1990-06-22', birthPlace: 'Rabat, Maroc', address: '3 Rue des Orangers, Rabat',
    certs: [{ daysAgo: 600, validityMonths: 12 }, { daysAgo: 400, validityMonths: 12 }] }, // expirée ~35j

  { name: 'Omar Chraibi', email: 'o.chraibi@ram.ma', licenseNumber: 'MA-ATPL-2012-0089', nationality: 'Marocaine', medicalClass: '1',
    birthDate: '1976-01-30', birthPlace: 'Marrakech, Maroc', address: '78 Boulevard Zerktouni, Marrakech',
    certs: [{ daysAgo: 1500, validityMonths: 12 }, { daysAgo: 1140, validityMonths: 12 }, { daysAgo: 770, validityMonths: 12 }, { daysAgo: 400, validityMonths: 12 }, { daysAgo: 40, validityMonths: 12 }] },

  { name: 'Nadia Fassi Fihri', email: 'n.fassifihri@gmail.com', licenseNumber: 'MA-CPL-2019-0334', nationality: 'Marocaine', medicalClass: '2',
    birthDate: '1993-09-14', birthPlace: 'Tanger, Maroc', address: '9 Rue Ibn Batouta, Tanger',
    certs: [{ daysAgo: 500, validityMonths: 24 }, { daysAgo: 60, validityMonths: 24 }],
    updates: [{ daysAgo: 200, oldFields: { email: 'nadia.fassif@yahoo.fr' }, newFields: { email: 'n.fassifihri@gmail.com' } }] },

  { name: 'Hamza Ziani', email: 'hamza.ziani92@gmail.com', licenseNumber: 'MA-PPL-2021-0456', nationality: 'Marocaine', medicalClass: '2',
    birthDate: '1997-02-08', birthPlace: 'Agadir, Maroc', address: '21 Rue de la Corniche, Agadir',
    certs: [{ daysAgo: 705, validityMonths: 24 }] }, // expire ~25j

  { name: 'Imane Tazi', email: 'imane.tazi@gmail.com', licenseNumber: 'MA-PPL-2020-0301', nationality: 'Marocaine', medicalClass: '2',
    birthDate: '1995-12-01', birthPlace: 'Meknès, Maroc', address: '5 Avenue Moulay Ismail, Meknès',
    certs: [{ daysAgo: 400, validityMonths: 24 }] },

  { name: 'Mehdi Alaoui', email: 'mehdi.alaoui.stu@gmail.com', licenseNumber: 'MA-STU-2024-0011', nationality: 'Marocaine', medicalClass: '4',
    birthDate: '2003-07-19', birthPlace: 'Casablanca, Maroc', address: '60 Rue Ibnou Sina, Casablanca',
    certs: [{ daysAgo: 90, validityMonths: 12 }] },

  { name: 'Zineb Bouzid', email: 'z.bouzid@ram.ma', licenseNumber: 'MA-ATPL-2014-0156', nationality: 'Marocaine', medicalClass: '1',
    birthDate: '1980-03-27', birthPlace: 'Oujda, Maroc', address: '14 Rue Al Wahda, Oujda',
    certs: [{ daysAgo: 1200, validityMonths: 12 }, { daysAgo: 840, validityMonths: 12 }, { daysAgo: 470, validityMonths: 12 }, { daysAgo: 100, validityMonths: 12 }] },

  { name: 'Anas Sqalli', email: 'a.sqalli@ram.ma', licenseNumber: 'FR-ATPL-2011-0067', nationality: 'Française', medicalClass: '1',
    birthDate: '1974-08-05', birthPlace: 'Lyon, France', address: '2 Rue de la République, Lyon',
    certs: [{ daysAgo: 1800, validityMonths: 12 }, { daysAgo: 1440, validityMonths: 12 }, { daysAgo: 1070, validityMonths: 12 }, { daysAgo: 410, validityMonths: 12 }], // expirée ~45j
    archiveDaysAgo: 30 }, // suspendu, en attente de contre-visite médicale

  { name: 'Laila Cherkaoui', email: 'l.cherkaoui@ram.ma', licenseNumber: 'MA-CPL-2017-0278', nationality: 'Marocaine', medicalClass: '1',
    birthDate: '1988-05-16', birthPlace: 'Kénitra, Maroc', address: '30 Avenue Mohammed V, Kénitra',
    certs: [{ daysAgo: 800, validityMonths: 12 }, { daysAgo: 430, validityMonths: 12 }, { daysAgo: 60, validityMonths: 12 }] },

  { name: 'Rachid Ouazzani', email: 'r.ouazzani@ram.ma', licenseNumber: 'MA-ATPL-2013-0112', nationality: 'Marocaine', medicalClass: '1',
    birthDate: '1977-10-09', birthPlace: 'Tétouan, Maroc', address: '8 Rue Al Andalous, Tétouan',
    certs: [{ daysAgo: 1400, validityMonths: 12 }, { daysAgo: 1030, validityMonths: 12 }, { daysAgo: 660, validityMonths: 12 }, { daysAgo: 400, validityMonths: 12 }] }, // expiré ~35j

  { name: 'Fatima Zahra Idrissi', email: 'fz.idrissi@gmail.com', licenseNumber: 'MA-PPL-2022-0512', nationality: 'Marocaine', medicalClass: '2',
    birthDate: '1999-01-25', birthPlace: 'Safi, Maroc', address: '16 Rue Ibn Khaldoun, Safi',
    certs: [{ daysAgo: 250, validityMonths: 24 }],
    updates: [{ daysAgo: 100, oldFields: { licenseNumber: 'MA-PPL-2022-0512-A' }, newFields: { licenseNumber: 'MA-PPL-2022-0512' } }] },

  { name: 'Yassine Berrada', email: 'y.berrada@ram.ma', licenseNumber: 'MA-CPL-2016-0203', nationality: 'Marocaine', medicalClass: '1',
    birthDate: '1986-02-17', birthPlace: 'El Jadida, Maroc', address: '4 Rue Zaouia, El Jadida',
    certs: [{ daysAgo: 700, validityMonths: 12 }, { daysAgo: 340, validityMonths: 12 }] }, // expire ~25j

  { name: 'Salma Kabbaj', email: 'salma.kabbaj@gmail.com', licenseNumber: 'MA-PPL-2023-0601', nationality: 'Marocaine', medicalClass: '2',
    birthDate: '2000-11-11', birthPlace: 'Béni Mellal, Maroc', address: '11 Rue Al Fida, Béni Mellal',
    certs: [{ daysAgo: 150, validityMonths: 24 }] },

  { name: 'Driss Amrani', email: 'driss.amrani.stu@gmail.com', licenseNumber: 'MA-STU-2023-0045', nationality: 'Marocaine', medicalClass: '4',
    birthDate: '2002-04-30', birthPlace: 'Casablanca, Maroc', address: '25 Rue Anoual, Casablanca',
    certs: [{ daysAgo: 400, validityMonths: 12 }, { daysAgo: 40, validityMonths: 12 }],
    archiveDaysAgo: 200, restoreDaysAgo: 180 }, // formation suspendue puis reprise après contre-visite

  { name: 'Khalid Bennani', email: 'k.bennani@ram.ma', licenseNumber: 'TN-ATPL-2010-0034', nationality: 'Tunisienne', medicalClass: '1',
    birthDate: '1975-07-21', birthPlace: 'Tunis, Tunisie', address: '19 Avenue Habib Bourguiba, Tunis',
    certs: [{ daysAgo: 2000, validityMonths: 12 }, { daysAgo: 1630, validityMonths: 12 }, { daysAgo: 1260, validityMonths: 12 }, { daysAgo: 890, validityMonths: 12 }, { daysAgo: 520, validityMonths: 12 }, { daysAgo: 85, validityMonths: 12 }] },
];

// pilote quitté la compagnie : dossier historique conservé, fiche pilote supprimée (comme le fait deletePilot en prod)
const DEPARTED = {
  name: 'Adil Moussaoui', email: 'a.moussaoui@ram.ma', licenseNumber: 'MA-ATPL-2014-0201', nationality: 'Marocaine', medicalClass: '1',
  birthDate: '1981-09-02', birthPlace: 'Casablanca, Maroc', address: '50 Rue Foucauld, Casablanca',
  certs: [{ daysAgo: 900, validityMonths: 12 }, { daysAgo: 540, validityMonths: 12 }],
  archiveDaysAgo: 100, deleteDaysAgo: 60,
};

async function seedPilot(config, admins, certSeq) {
  const existing = await Pilot.findOne({ licenseNumber: config.licenseNumber });
  if (existing) return { skipped: true };

  const pilotId = oid();
  const authors = [null, ...admins]; // null -> Système, sinon rotation entre superadmin/admins
  const authorFor = (i) => authors[i % authors.length];

  // --- construit la timeline chronologique d'événements (du plus ancien au plus récent) ---
  const events = [];
  config.certs.forEach((c, i) => events.push({ type: 'CERT', daysAgo: c.daysAgo, cert: c, i }));
  (config.updates || []).forEach((u) => events.push({ type: 'UPDATED', daysAgo: u.daysAgo, u }));
  if (config.archiveDaysAgo) events.push({ type: 'ARCHIVED', daysAgo: config.archiveDaysAgo });
  if (config.restoreDaysAgo) events.push({ type: 'RESTORED', daysAgo: config.restoreDaysAgo });
  if (config.deleteDaysAgo) events.push({ type: 'DELETED', daysAgo: config.deleteDaysAgo });
  events.sort((a, b) => b.daysAgo - a.daysAgo); // daysAgo décroissant = ordre chronologique croissant

  const firstCert = config.certs[0];
  const initialExpiry = daysAgo(firstCert.daysAgo - firstCert.validityMonths * 30);

  // état courant du pilote, rejoué événement par événement pour produire des before/after cohérents
  const state = {
    name: config.name, email: config.email, licenseNumber: config.licenseNumber,
    certificateNumber: '', nationality: config.nationality, medicalClass: config.medicalClass,
    expiryDate: initialExpiry, archived: false,
  };

  const historyDocs = [];
  historyDocs.push({
    pilotId, pilotName: state.name, action: 'PILOT_CREATED',
    oldData: null, newData: { ...state, expiryDate: iso(state.expiryDate) },
    performedBy: toActor(authorFor(0)),
    createdAt: daysAgo(firstCert.daysAgo),
  });

  for (const ev of events) {
    if (ev.type === 'CERT') {
      const issueDate = daysAgo(ev.daysAgo);
      const expiryDate = addMonths(issueDate, ev.cert.validityMonths);
      const certificateNumber = `CM-${issueDate.getFullYear()}-${String(certSeq.next()).padStart(4, '0')}`;
      const author = authorFor(ev.i + 1);
      const oldExpiry = state.expiryDate;

      const certDoc = {
        _id: oid(), pilotId, pilotName: state.name, certificateNumber,
        medicalClass: state.medicalClass, issueDate, expiryDate,
        status: computeStatus(expiryDate),
        formData: buildFormData({
          medicalClass: state.medicalClass, certificateNumber, holderName: state.name,
          birthDate: config.birthDate, birthPlace: config.birthPlace, address: config.address,
          nationality: state.nationality, issueDate, expiryDate, doctor: doctorFor(ev.i),
        }),
        generatedBy: author ? { userId: author._id, username: author.username } : { userId: null, username: 'Système' },
        createdAt: issueDate, updatedAt: issueDate,
      };
      await Certificate.collection.insertOne(certDoc);

      historyDocs.push({
        pilotId, pilotName: state.name, action: 'CERTIFICATE_GENERATED',
        oldData: null, newData: { certificateNumber, medicalClass: state.medicalClass, issueDate: iso(issueDate), expiryDate: iso(expiryDate), status: certDoc.status },
        performedBy: toActor(author), createdAt: issueDate,
      });

      state.certificateNumber = certificateNumber;
      state.expiryDate = expiryDate;
      historyDocs.push({
        pilotId, pilotName: state.name, action: 'PILOT_RENEWED',
        oldData: { expiryDate: iso(oldExpiry) }, newData: { expiryDate: iso(state.expiryDate) },
        performedBy: toActor(author), createdAt: issueDate,
      });
    } else if (ev.type === 'UPDATED') {
      const oldData = { ...ev.u.oldFields };
      const newData = { ...ev.u.newFields };
      Object.assign(state, ev.u.newFields);
      historyDocs.push({
        pilotId, pilotName: state.name, action: 'PILOT_UPDATED',
        oldData, newData, performedBy: toActor(authorFor(2)), createdAt: daysAgo(ev.daysAgo),
      });
    } else if (ev.type === 'ARCHIVED') {
      state.archived = true;
      historyDocs.push({
        pilotId, pilotName: state.name, action: 'PILOT_ARCHIVED',
        oldData: { archived: false }, newData: { archived: true },
        performedBy: toActor(authorFor(1)), createdAt: daysAgo(ev.daysAgo),
      });
    } else if (ev.type === 'RESTORED') {
      state.archived = false;
      historyDocs.push({
        pilotId, pilotName: state.name, action: 'PILOT_RESTORED',
        oldData: { archived: true }, newData: { archived: false },
        performedBy: toActor(authorFor(2)), createdAt: daysAgo(ev.daysAgo),
      });
    } else if (ev.type === 'DELETED') {
      historyDocs.push({
        pilotId, pilotName: state.name, action: 'PILOT_DELETED',
        oldData: { ...state, expiryDate: iso(state.expiryDate) }, newData: null,
        performedBy: toActor(authorFor(0)), createdAt: daysAgo(ev.daysAgo),
      });
    }
  }

  await PilotHistory.collection.insertMany(historyDocs);

  const deleted = events.some((e) => e.type === 'DELETED');
  if (!deleted) {
    state.lastKnownStatus = computeStatus(state.expiryDate);
    await Pilot.collection.insertOne({
      _id: pilotId, ...state,
      createdAt: daysAgo(firstCert.daysAgo), updatedAt: new Date(),
    });
  }

  return { skipped: false, deleted };
}

function toActor(user) {
  if (!user) return { userId: null, username: 'Système', email: null };
  return { userId: user._id, username: user.username, email: user.email };
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connecté');

  const { admins, superadmin } = await ensureAdmins();
  const allAuthors = [superadmin, ...admins].filter(Boolean);

  let seq = 0;
  const certSeq = { next: () => ++seq };

  let created = 0, skipped = 0;
  for (const config of ROSTER) {
    const result = await seedPilot(config, allAuthors, certSeq);
    if (result.skipped) { skipped++; console.log(`  — déjà présent : ${config.name}`); }
    else { created++; console.log(`  ✓ pilote créé : ${config.name}`); }
  }

  const departedResult = await seedPilot(DEPARTED, allAuthors, certSeq);
  if (departedResult.skipped) { skipped++; console.log(`  — déjà présent : ${DEPARTED.name}`); }
  else { created++; console.log(`  ✓ dossier (parti) créé : ${DEPARTED.name}`); }

  console.log(`\nTerminé : ${created} dossier(s) pilote créé(s), ${skipped} déjà présent(s).`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
