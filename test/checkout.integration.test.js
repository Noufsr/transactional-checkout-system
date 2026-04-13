const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

beforeEach(async () => {
  await pool.query('DELETE FROM idempotency_keys');
  await pool.query('DELETE FROM payments');
  await pool.query('DELETE FROM sale_items');
  await pool.query('DELETE FROM sales');
  await pool.query('UPDATE products SET stock = 10 WHERE id = 1');
});

afterAll(async () => {
  await pool.end();
});

describe('POST /api/checkout', () => {

  test('should create a sale successfully', async () => {
    const res = await request(app)
      .post('/api/checkout')
      .set('Idempotency-Key', 'integration-test-1')
      .send({ items: [{ productId: 1, quantity: 1 }] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('saleId');
    expect(res.body).toHaveProperty('payment');
    expect(res.body.status).toBe('PENDING');
  });

  test('should return cached response on repeated key', async () => {
    await request(app)
      .post('/api/checkout')
      .set('Idempotency-Key', 'integration-test-2')
      .send({ items: [{ productId: 1, quantity: 1 }] });

    const res = await request(app)
      .post('/api/checkout')
      .set('Idempotency-Key', 'integration-test-2')
      .send({ items: [{ productId: 1, quantity: 1 }] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('saleId');
  });

  test('should fail when stock is insufficient', async () => {
    const res = await request(app)
      .post('/api/checkout')
      .set('Idempotency-Key', 'integration-test-3')
      .send({ items: [{ productId: 1, quantity: 999 }] });

    expect(res.status).toBe(409);
  });

});