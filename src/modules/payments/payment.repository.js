async function createPayment(connection, saleId, amount, status, external_id) {
  const [result] = await connection.query(
    'INSERT INTO payments (sale_id, amount, status, external_id) VALUES (?, ?, ?, ?)',
    [saleId, amount, status, external_id]
  );
  return result.insertId;
}

async function findByExternalId(connection, external_id){
  const [rows] = await connection.query(
    'SELECT * FROM payments WHERE external_id= ? LIMIT 1',
    [external_id]
  );
  return rows[0];
}

async function updateStatus(connection, paymentId, status){
  await connection.query(
    'UPDATE payments SET status = ? WHERE id = ?',
    [status, paymentId]

  );
}

  module.exports = {
  createPayment,
  findByExternalId,
  updateStatus
};