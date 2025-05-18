const request = require('supertest');
const app = require('../server');

describe('Auth API Tests', () => {
  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'jest@example.com',
      password: 'jest123'
    });
    expect(res.statusCode).toBe(200);
  });

  it('denies login without verification', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'jest@example.com',
      password: 'jest123'
    });
    expect(res.statusCode).toBe(400);
  });
});
