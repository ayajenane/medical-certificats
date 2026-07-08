import { describe, it, expect } from 'vitest';
import { computeStatus, daysUntilExpiry } from './pilots';

describe('computeStatus', () => {
  it('retourne "unknown" sans date', () => {
    expect(computeStatus(null)).toBe('unknown');
  });

  it('retourne "expired" pour une date passée', () => {
    expect(computeStatus(new Date(Date.now() - 86400000).toISOString())).toBe('expired');
  });

  it('retourne "expiring" pour une date à 10 jours', () => {
    expect(computeStatus(new Date(Date.now() + 10 * 86400000).toISOString())).toBe('expiring');
  });

  it('retourne "active" pour une date à 60 jours', () => {
    expect(computeStatus(new Date(Date.now() + 60 * 86400000).toISOString())).toBe('active');
  });
});

describe('daysUntilExpiry', () => {
  it('retourne null sans date', () => {
    expect(daysUntilExpiry(null)).toBeNull();
  });

  it('retourne un nombre de jours positif pour une date future', () => {
    const days = daysUntilExpiry(new Date(Date.now() + 5 * 86400000).toISOString());
    expect(days).toBeGreaterThanOrEqual(4);
    expect(days).toBeLessThanOrEqual(5);
  });
});
