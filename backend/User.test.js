import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { connectTestDB, clearTestDB, disconnectTestDB } from './tests/dbHelper.js';
import User from './User.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

describe('User model', () => {
  it('hash le mot de passe à la création', async () => {
    const user = await User.create({ username: 'admin1', email: 'admin1@dgac.ma', password: 'secret123' });
    expect(user.password).not.toBe('secret123');
    expect(await user.matchPassword('secret123')).toBe(true);
  });

  it('ne re-hash pas le mot de passe lors d\'une sauvegarde qui ne le modifie pas', async () => {
    const user = await User.create({ username: 'admin2', email: 'admin2@dgac.ma', password: 'secret123' });
    const hashedOnce = user.password;

    user.username = 'admin2-renamed';
    await user.save();

    const reloaded = await User.findById(user._id).select('+password');
    expect(reloaded.password).toBe(hashedOnce);
    expect(await reloaded.matchPassword('secret123')).toBe(true);
  });
});
