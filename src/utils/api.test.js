import { describe, it, expect, beforeEach, vi } from 'vitest';
import api from './api';

const store = new Map();
const localStorageMock = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, value),
  clear: () => store.clear(),
};

beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', localStorageMock);
});

describe('api interceptor', () => {
  it('ajoute le header Authorization si un token est stocké', () => {
    localStorage.setItem('token', 'abc123');
    const handler = api.interceptors.request.handlers[0].fulfilled;
    const config = handler({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer abc123');
  });

  it("n'ajoute pas de header Authorization sans token", () => {
    const handler = api.interceptors.request.handlers[0].fulfilled;
    const config = handler({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });
});
