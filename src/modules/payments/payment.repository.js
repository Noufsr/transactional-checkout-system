async function createPayment(connection, saleId, amount, status) {
  const [result] = await connection.query(
    'INSERT INTO payments (sale_id, amount, status) VALUES (?, ?, ?)',
    [saleId, amount, status]
  );
  return result.insertId;
}module.exports = {
  createPayment
};