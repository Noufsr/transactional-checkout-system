async function findById(connection, productId) {
  const [rows] = await connection.query(
    'SELECT * FROM products WHERE id = ?',
    [productId]
  );

  return rows[0] || null;

}
async function decreaseStock(connection,productId, quantity,) {
  const [result] = await connection.query(
    'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
    [quantity, productId, quantity]
  );

  return result.affectedRows > 0;
}

module.exports = {
  findById,decreaseStock
};


