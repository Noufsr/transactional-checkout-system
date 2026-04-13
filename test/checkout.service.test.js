const checkoutService = require('../src/modules/checkout/checkout.service');

const productRepository = require('../src/modules/products/product.repository');
const saleRepository = require('../src/modules/sales/sale.repository');
const paymentRepository = require('../src/modules/payments/payment.repository');
const idempotencyRepository = require('../src/modules/idempotency/idempotency.repository');

const pool = require('../src/db');

// 👇 MOCKS
jest.mock('../src/modules/products/product.repository');
jest.mock('../src/modules/sales/sale.repository');
jest.mock('../src/modules/payments/payment.repository');
jest.mock('../src/modules/idempotency/idempotency.repository');
jest.mock('../src/modules/sale_items/sale_item.repository');
jest.mock('../src/db');

describe('Checkout Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a sale successfully', async () => {
    
    const mockConnection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: jest.fn()
    };

    pool.getConnection.mockResolvedValue(mockConnection);

    productRepository.findById.mockResolvedValue({
      id: 1,
      price: 1000,
      stock: 10
    });

    productRepository.decreaseStock.mockResolvedValue(true);

    saleRepository.createSale.mockResolvedValue(1);
    paymentRepository.createPayment.mockResolvedValue(1);

    idempotencyRepository.findByKey.mockResolvedValue(null);

    const result = await checkoutService.checkout(
      {
        items: [{ product_id: 1, quantity: 1 }]
      },
      'test-key'
    );

    expect(result).toHaveProperty('saleId');
    expect(mockConnection.commit).toHaveBeenCalled();
  });
  test('should rollback when stock is insufficient', async () => {

  const mockConnection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: jest.fn()
  };

  pool.getConnection.mockResolvedValue(mockConnection);

  productRepository.findById.mockResolvedValue({
      id: 1,
      price: 1000,
      stock: 1
  });

  
  productRepository.decreaseStock.mockResolvedValue(false);

  idempotencyRepository.findByKey.mockResolvedValue(null);

  await expect(
      checkoutService.checkout(
      { items: [{ product_id: 1, quantity: 5 }] },
      'test-key'
      )
  ).rejects.toThrow();

  expect(mockConnection.rollback).toHaveBeenCalled();
  });
  
  test('should return stored response if idempotency key exists', async () => {

  const mockResponse = {
    saleId: 99,
    status: 'PENDING',
    payment: { id: 1 }
  };

  
  idempotencyRepository.findByKey.mockResolvedValue({
    response: JSON.stringify(mockResponse)
  });


  const result = await checkoutService.checkout(
    { items: [{ product_id: 1, quantity: 1 }] },
    'existing-key'
  );

  expect(result).toEqual(mockResponse);

  
  expect(pool.getConnection).not.toHaveBeenCalled();
});
});