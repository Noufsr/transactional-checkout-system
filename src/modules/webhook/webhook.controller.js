const webhookService = require('./webhook.service');

async function handlePaymentWebhook(req, res) {
  try {
    await webhookService.handlePaymentWebhook(req.body);

    
    res.status(200).json({ received: true });

  } catch (error) {
    console.error(error);

   
    res.status(200).json({ received: true });
  }
}

module.exports = {
  handlePaymentWebhook
};