async function createSale_item(connection, saleId, productId, quantity, priceAtPurchase) {
  const [result] = await connection.query(
    'INSERT INTO sale_items (sale_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
    [saleId, productId, quantity, priceAtPurchase]
  );

  return;
}module.exports = {
  createSale_item
};