const checkoutService = require('./checkout.service');

const checkoutController = {
  checkout: async (req, res) => {
    try {
      const idempotencyKey = req.headers['idempotency-key'];
      const data = req.body;


      if (!idempotencyKey) {
        return res.status(400).json({
          error: 'Idempotency-Key header is required'
        });
      }


      const result = await checkoutService.checkout(data, idempotencyKey);

      return res.status(200).json(result);

    } catch (error) {
        console.error('Checkout error:', error);

        return res.status(error.statusCode || 500).json({
          error: error.message
  });

    }
  }
};

module.exports = checkoutController;