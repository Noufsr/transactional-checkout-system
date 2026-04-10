const pool= require('../../db');
const saleRepository = require('../sales/sale.repository');
const paymentRepository = require('../payments/payment.repository');


const eventMap = {
  'payment.succeeded': {
    paymentStatus: 'SUCCESS',
    saleStatus: 'CONFIRMED'
  },
  'payment.failed': {
    paymentStatus: 'FAILED',
    saleStatus: 'FAILED'
  }
};

async function handlePaymentWebhook(payload) {
  const { external_id, event } = payload;

  if (!external_id || !event) {
    return; 
  }

  const eventConfig = eventMap[event];
  if (!eventConfig) {
    return; 
  }

  const connection = await pool.getConnection();

  try {
    
    const payment = await paymentRepository.findByExternalId(
      connection,
      external_id
    );

    
    if (!payment) {
      console.log('Payment no encontrado para external_id:', external_id);
      return;
    }

  
    if (payment.status !== 'PENDING') {
      console.log('Webhook ya procesado:', external_id);
      return;
    }

   
    await connection.beginTransaction();


    await paymentRepository.updateStatus(
      connection,
      payment.id,
      eventConfig.paymentStatus
    );

   
    await saleRepository.updateStatus(
      connection,
      payment.sale_id,
      eventConfig.saleStatus
    );

  
    await connection.commit();

  } catch (error) {
    await connection.rollback();
    console.error('Error en webhook:', error);
    throw error;
  } finally {
    connection.release();
  }
}
module.exports = {
  handlePaymentWebhook
};