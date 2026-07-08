import { describe, it, expect } from 'vitest';
import { formatValue, getFieldChanges, ACTION_CONFIG } from './historyDisplay';

describe('formatValue', () => {
  it('affiche un tiret pour une valeur vide/nulle/indéfinie', () => {
    expect(formatValue('name', '')).toBe('—');
    expect(formatValue('name', null)).toBe('—');
    expect(formatValue('name', undefined)).toBe('—');
  });

  it('formate un booléen en Oui/Non', () => {
    expect(formatValue('archived', true)).toBe('Oui');
    expect(formatValue('archived', false)).toBe('Non');
  });

  it('formate une date pour un champ de type date', () => {
    expect(formatValue('expiryDate', '2027-01-15')).toMatch(/\d{2}\/\d{2}\/2027/);
  });

  it('retourne la valeur brute en string pour les autres champs', () => {
    expect(formatValue('name', 'Jean Dupont')).toBe('Jean Dupont');
  });
});

describe('getFieldChanges', () => {
  it('ne garde que les champs modifiés quand oldData et newData existent', () => {
    const oldData = { name: 'Jean', email: 'jean@old.com' };
    const newData = { name: 'Jean', email: 'jean@new.com' };
    const changes = getFieldChanges(oldData, newData);
    expect(changes).toHaveLength(1);
    expect(changes[0].field).toBe('email');
  });

  it('affiche tous les champs connus quand seul newData existe (création)', () => {
    const changes = getFieldChanges(null, { name: 'Jean', unknownField: 'x' });
    expect(changes.some((c) => c.field === 'name')).toBe(true);
    expect(changes.some((c) => c.field === 'unknownField')).toBe(false);
  });
});

describe('ACTION_CONFIG', () => {
  it('contient une entrée pour chaque action métier connue', () => {
    expect(ACTION_CONFIG.PILOT_CREATED.label).toBe('Pilote créé');
    expect(ACTION_CONFIG.PILOT_EXPIRED.label).toBe('Certificat expiré');
  });
});
