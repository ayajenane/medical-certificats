import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import { connectTestDB, clearTestDB, disconnectTestDB } from './tests/dbHelper.js';
import app from './app.js';
import User from './User.js';

process.env.JWT_SECRET ||= 'test-secret';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

const createSuperAdmin = async () => {
  await User.create({ username: 'superadmin', email: 'super@dgac.ma', password: 'super@123', role: 'superadmin' });
  const res = await request(app).post('/api/auth/login').send({ email: 'super@dgac.ma', password: 'super@123' });
  return res.body.token;
};

describe('POST /api/auth/login', () => {
  it('refuse un email ou mot de passe manquant', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com' });
    expect(res.status).toBe(400);
  });

  it('refuse des identifiants inconnus', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'inconnu@dgac.ma', password: 'whatever' });
    expect(res.status).toBe(401);
  });

  it('connecte un utilisateur avec les bons identifiants', async () => {
    await User.create({ username: 'admin', email: 'admin@dgac.ma', password: 'secret123' });
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@dgac.ma', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
  });

  it('refuse un mauvais mot de passe', async () => {
    await User.create({ username: 'admin', email: 'admin@dgac.ma', password: 'secret123' });
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@dgac.ma', password: 'wrong' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/register', () => {
  it('refuse une création sans authentification', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'x', email: 'x@dgac.ma', password: 'secret123', confirmPassword: 'secret123' });
    expect(res.status).toBe(401);
  });

  it("refuse la création d'un admin par un non-superadmin", async () => {
    await User.create({ username: 'admin', email: 'admin@dgac.ma', password: 'secret123', role: 'admin' });
    const login = await request(app).post('/api/auth/login').send({ email: 'admin@dgac.ma', password: 'secret123' });

    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ username: 'x', email: 'x@dgac.ma', password: 'secret123', confirmPassword: 'secret123' });
    expect(res.status).toBe(403);
  });

  it('permet à un superadmin de créer un admin', async () => {
    const token = await createSuperAdmin();
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'nouvel-admin', email: 'nouvel-admin@dgac.ma', password: 'secret123', confirmPassword: 'secret123' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('admin');
  });
});

// dernier: la limite est cumulative sur la même instance de limiter, donc ce test doit
// s'exécuter en dernier pour ne pas bloquer les logins des tests précédents.
describe('rate limiting sur /api/auth/login', () => {
  it('bloque après 10 tentatives depuis la même IP', async () => {
    await User.create({ username: 'admin', email: 'admin@dgac.ma', password: 'secret123' });

    let lastStatus;
    for (let i = 0; i < 11; i++) {
      const res = await request(app).post('/api/auth/login').send({ email: 'admin@dgac.ma', password: 'wrong' });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
