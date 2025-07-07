import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import db from '../config/connect.js';
import { parentTable } from '../database/Parent.js';
import { driverTable } from '../database/Driver.js';

describe('Authentication Tests', () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup test database
  });

  describe('Parent Authentication', () => {
    it('should login parent with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/parent/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
    });
  });

  describe('Driver Authentication', () => {
    it('should login driver with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/driver/login')
        .send({
          email: 'driver@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
    });
  });
}); 