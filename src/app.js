const express = require('express');

const app = express();

app.use(express.json());
const checkoutRoutes = require('./modules/checkout/checkout.routes');
app.use('/api', checkoutRoutes);

module.exports = app;