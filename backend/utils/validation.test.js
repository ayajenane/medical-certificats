import { describe, it, expect } from 'vitest';
import { isValidEmail, validatePilotInput, validateCertificateInput } from './validation.js';

describe('isValidEmail', () => {
  it('accepte une adresse valide', () => {
    expect(isValidEmail('pilote@dgac.ma')).toBe(true);
  });

  it('rejette une adresse sans @', () => {
    expect(isValidEmail('pilote-dgac.ma')).toBe(false);
  });

  it('rejette une adresse sans domaine', () => {
    expect(isValidEmail('pilote@')).toBe(false);
  });
});

describe('validatePilotInput', () => {
  const validPilot = {
    name: 'Jean Dupont',
    expiryDate: '2027-01-01',
    email: 'jean@dgac.ma',
    medicalClass: '1',
    licenseType: 'ATPL',
  };

  it("n'a pas d'erreur pour un pilote valide", () => {
    expect(validatePilotInput(validPilot)).toEqual([]);
  });

  it('exige le nom en mode création', () => {
    const errors = validatePilotInput({ ...validPilot, name: '' });
    expect(errors).toContain('Le nom du pilote est requis.');
  });

  it('exige un nom d\'au moins 2 caractères', () => {
    const errors = validatePilotInput({ ...validPilot, name: 'A' });
    expect(errors).toContain('Le nom du pilote doit contenir au moins 2 caractères.');
  });

  it("exige la date d'expiration en mode création", () => {
    const errors = validatePilotInput({ ...validPilot, expiryDate: '' });
    expect(errors).toContain("La date d'expiration est requise.");
  });

  it("rejette une date d'expiration invalide", () => {
    const errors = validatePilotInput({ ...validPilot, expiryDate: 'not-a-date' });
    expect(errors).toContain("La date d'expiration est invalide.");
  });

  it('rejette un email invalide', () => {
    const errors = validatePilotInput({ ...validPilot, email: 'bad-email' });
    expect(errors).toContain('Adresse email invalide.');
  });

  it('rejette une classe médicale hors de 1-4', () => {
    const errors = validatePilotInput({ ...validPilot, medicalClass: '9' });
    expect(errors).toContain('La classe médicale doit être 1, 2, 3 ou 4.');
  });

  it('rejette un type de licence inconnu', () => {
    const errors = validatePilotInput({ ...validPilot, licenseType: 'INVALID' });
    expect(errors).toContain('Le type de licence est invalide.');
  });

  it('mode partial: tolère un nom absent (non fourni) lors d\'une mise à jour', () => {
    const errors = validatePilotInput({ email: 'jean@dgac.ma' }, { partial: true });
    expect(errors).toEqual([]);
  });

  it('mode partial: rejette quand même un nom fourni mais vide', () => {
    const errors = validatePilotInput({ name: '' }, { partial: true });
    expect(errors).toContain('Le nom du pilote est requis.');
  });
});

describe('validateCertificateInput', () => {
  const validCert = {
    pilotId: '507f1f77bcf86cd799439011',
    certificateNumber: 'CERT-001',
    issueDate: '2026-01-01',
    expiryDate: '2027-01-01',
    medicalClass: '2',
  };

  it("n'a pas d'erreur pour un certificat valide", () => {
    expect(validateCertificateInput(validCert)).toEqual([]);
  });

  it('exige le pilote associé', () => {
    const errors = validateCertificateInput({ ...validCert, pilotId: '' });
    expect(errors).toContain('Le pilote associé est requis.');
  });

  it('exige un numéro de certificat', () => {
    const errors = validateCertificateInput({ ...validCert, certificateNumber: '  ' });
    expect(errors).toContain('Le numéro de certificat est requis.');
  });

  it("rejette une date d'expiration antérieure ou égale à la date d'émission", () => {
    const errors = validateCertificateInput({ ...validCert, issueDate: '2027-01-01', expiryDate: '2026-01-01' });
    expect(errors).toContain("La date d'expiration doit être postérieure à la date d'émission.");
  });

  it('rejette une classe médicale invalide', () => {
    const errors = validateCertificateInput({ ...validCert, medicalClass: '7' });
    expect(errors).toContain('La classe médicale doit être 1, 2, 3 ou 4.');
  });
});
