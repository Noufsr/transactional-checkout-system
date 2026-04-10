const express = require('express');
const checkoutRoutes = require('./modules/checkout/checkout.route');
const app = express();
const webhookRoutes = require('./modules/webhook/webhook.route');

app.use(express.json());

app.use('/api', checkoutRoutes);
app.use('/api/webhook', webhookRoutes);

module.exports = app;