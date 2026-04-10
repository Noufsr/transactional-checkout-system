const express = require('express');
const router = express.Router();
const webhookController = require('./webhook.controller');

router.post('/payment', webhookController.handlePaymentWebhook);

module.exports = router;