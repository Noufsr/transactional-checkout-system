const db = require('../../db');
const productRepository = require('../products/product.repository');
const saleRepository = require('../sales/sale.repository');
const saleItemRepository = require('../sale_items/sale_item.repository');
const paymentRepository = require('../payments/payment.repository');
const idempotencyRepository = require('../idempotency/idempotency.repository');


async function checkout(data, idempotencyKey) {

  // Validar estructura básica del request
  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('Invalid items');
  }

  // Idempotencia: evitar procesar la misma request dos veces
  const existing = await idempotencyRepository.findByKey(idempotencyKey);

  if (existing && existing.response) {
    return JSON.parse(existing.response);
  }

  // Obtener conexión para manejar transacción
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Registrar la idempotency key como PENDING
    await idempotencyRepository.createIdempotencyKey(
      connection,
      idempotencyKey,
      'PENDING'
    );

    // Crear la venta en estado inicial
    const saleId = await saleRepository.createSale(connection, 'PENDING');

    let total = 0;

    // Procesar cada item de la compra
    for (const item of data.items) {
      const { productId, quantity } = item;

      // Obtener producto
      const product = await productRepository.findById(connection, productId);

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // Descontar stock de forma atómica (evita sobreventa)
      const success = await productRepository.decreaseStock(
        connection,
        productId,
        quantity
      );

      if (!success) {
        const error= new Error(`Insufficient stock for product ${productId}`);
        error.statusCode = 409;
        throw error;
       
      }

      // Tomar snapshot del precio actual
      const price = product.price;

      // Acumular total de la venta
      total += price * quantity;

      // Guardar venta de producto
      await saleItemRepository.createSale_item(
        connection,
        saleId,
        productId,
        quantity,
        price
      );
    }

    // Actualizar total de la venta
    await saleRepository.updateSaleTotal(connection, saleId, total);

    //  Crear registro de pago en estado inicial
    const paymentId = await paymentRepository.createPayment(
      connection,
      saleId,
      total,
      'PENDING'
    );

    //  Construir respuesta para idempotencia
    const response = {
      saleId,
      status: 'PENDING',
      payment: {
        id: paymentId,
        status: 'PENDING'
      }
    };

    //  Guardar respuesta para futuras requests repetidas
    await idempotencyRepository.saveResponse(
      connection,
      idempotencyKey,
      response
    );

    //  Confirmar transacción
    await connection.commit();

    return response;

  } catch (error) {
    // Si algo falla, rollback para mantener consistencia
    await connection.rollback();
    throw error;

  } finally {
    // Liberar conexión al pool
    connection.release();
  }
}

module.exports = {
  checkout
};