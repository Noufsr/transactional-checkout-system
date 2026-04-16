const request = require('supertest');
const app = require('../src/app');
const webhookService = require('../src/modules/webhook/webhook.service');
const pool = require('../src/db');

async function createCheckout(idempotencyKey) {
  const [products] = await pool.query('SELECT * FROM products LIMIT 1');
  const product = products[0];

  return await request(app)
    .post('/api/checkout')
    .set('Idempotency-Key', idempotencyKey)
    .send({ items: [{ productId: product.id, quantity: 1 }] });
}

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

describe('POST /api/webhook/payment', () => {

  test('should update payment and sale to SUCCESS', async () => {
    const checkout = await createCheckout('webhook-test-' + Date.now());
    const externalId = checkout.body.payment.external_id;

    await webhookService.handlePaymentWebhook({
      external_id: externalId,
      event: 'payment.succeeded'
    });

    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE external_id = ?',
      [externalId]
    );
    const [sales] = await pool.query(
      'SELECT * FROM sales WHERE id = ?',
      [checkout.body.saleId]
    );

    expect(payments[0].status).toBe('SUCCESS');
    expect(sales[0].status).toBe('CONFIRMED');
  });

  test('should update payment and sale to FAILED', async () => {
    const checkout = await createCheckout('webhook-test-' + Date.now());
    const externalId = checkout.body.payment.external_id;

    await webhookService.handlePaymentWebhook({
      external_id: externalId,
      event: 'payment.failed'
    });

    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE external_id = ?',
      [externalId]
    );
    const [sales] = await pool.query(
      'SELECT * FROM sales WHERE id = ?',
      [checkout.body.saleId]
    );

    expect(payments[0].status).toBe('FAILED');
    expect(sales[0].status).toBe('FAILED');
  });

  test('should not process webhook twice (idempotency)', async () => {
    const checkout = await createCheckout('webhook-test-' + Date.now());
    const externalId = checkout.body.payment.external_id;

    await webhookService.handlePaymentWebhook({
      external_id: externalId,
      event: 'payment.succeeded'
    });

    await webhookService.handlePaymentWebhook({
      external_id: externalId,
      event: 'payment.succeeded'
    });

    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE external_id = ?',
      [externalId]
    );

    expect(payments[0].status).toBe('SUCCESS');
    expect(payments.length).toBe(1);
  });

});
