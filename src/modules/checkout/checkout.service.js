const db = require('../../db');
const productRepository = require('../products/product.repository');
const saleRepository = require('../sales/sale.repository');
const saleItemRepository = require('../sale_items/sale_item.repository');
const paymentRepository = require('../payments/payment.repository');
const idempotencyRepository = require('../idempotency/idempotency.repository');
const { randomUUID } = require('crypto');


async function checkout(data, idempotencyKey) {

  
  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('Invalid items');
  }

 
  const existing = await idempotencyRepository.findByKey(idempotencyKey);

  if (existing && existing.response) {
  return typeof existing.response === 'string'
    ? JSON.parse(existing.response)
    : existing.response;
}
 
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    
    await idempotencyRepository.createIdempotencyKey(
      connection,
      idempotencyKey,
      'PENDING'
    );

    
    const saleId = await saleRepository.createSale(connection, 'PENDING');

    let total = 0;

    for (const item of data.items) {
      const { productId, quantity } = item;

      // Obtener producto
      const product = await productRepository.findById(connection, productId);

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // Descontar stock de forma atomica y verificar que haya suficiente
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
    const external_id = `pay_${randomUUID()}`;
    const paymentId = await paymentRepository.createPayment(
      connection,
      saleId,
      total,
      'PENDING',
      external_id
    );

    //  Construir respuesta para idempotencia
    const response = {
      saleId,
      status: 'PENDING',
      payment: {
        id: paymentId,
        status: 'PENDING',
        external_id
      }
    };

    //  Guardar respuesta para futuras requests repetidas
    await idempotencyRepository.saveResponse(
      connection,
      idempotencyKey,
      response
    );


    await connection.commit();

    return response;

  } catch (error) {

    await connection.rollback();
    throw error;

  } finally {
  
    connection.release();
  }
}

module.exports = {
  checkout
};