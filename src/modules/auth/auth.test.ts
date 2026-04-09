import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import request from 'supertest';
import app  from '../../app'; // your Express app
import prisma from '../../config/prisma';

describe('Admin Auth', () => {
 const testAdmin = {
  fullName: 'Test Admin',
  email: 'admin@test.com',
  password: 'Password123!',
  schoolName: 'Test School',
  schoolType: 'PRIVATE',      // ✅ must match enum
  board: 'CBSE',              // ✅ matches enum
  city: 'Ahmedabad',
  state: 'Gujarat',
  phoneNumber: '1234567890',
  verificationDocLink: 'http://example.com/doc.pdf',
  websiteLink: 'http://example.com',
};

  afterAll(async () => {
    // Clean up test admin
    await prisma.admin.deleteMany({ where: { email: testAdmin.email } });
    await prisma.$disconnect();
  });

  it('should register a new admin', async () => {
    const res = await request(app)
      .post('/api/auth/register') // <-- corrected path
      .send(testAdmin);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('adminId');
  });

  it('should not allow duplicate registration', async () => {
    const res = await request(app)
      .post('/api/auth/register') // <-- corrected path
      .send(testAdmin);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Email already exists');
  });

  it('should login admin', async () => {
    const res = await request(app)
      .post('/api/auth/login') // <-- corrected path
      .send({
        email: testAdmin.email,
        password: testAdmin.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('admin');
    expect(res.body.admin.email).toBe(testAdmin.email);
  });

  it('should fail login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login') // <-- corrected path
      .send({
        email: testAdmin.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid credentials');
  });
});