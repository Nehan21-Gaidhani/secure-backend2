jest.mock('nodemailer');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany();
});

describe('Auth Routes', () => {
  test('Should register a new user and send verification email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'dummyPassword',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Verification email/);

    const user = await User.findOne({ email: 'test@example.com' });
    expect(user).toBeTruthy();
    expect(user.verified).toBe(false);
  });

  test('Should not login unverified user', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'unverified@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'unverified@example.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/not verified/);
  });

  test('Should allow password reset request for verified user', async () => {
    const user = new User({
      email: 'verified@example.com',
      verified: true,
      passwordHash: '$2a$10$hashhashhash',
    });
    await user.save();

    const res = await request(app)
      .post('/api/auth/request-password-reset')
      .send({ email: 'verified@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/reset email sent/i);
  });

  test('Should reject reset request for unverified user', async () => {
    const user = new User({
      email: 'unverified2@example.com',
      verified: false,
    });
    await user.save();

    const res = await request(app)
      .post('/api/auth/request-password-reset')
      .send({ email: 'unverified2@example.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/not verified/);
  });
});

