async function createSale(connection, status) {
  const [result] = await connection.query(
    'INSERT INTO sales (status, total_amount) VALUES (?, ?)',
    [status, 0]
  );

  return result.insertId;
}

async function updateSaleTotal(connection, saleId, total) {
  await connection.query(
    'UPDATE sales SET total_amount = ? WHERE id = ?',
    [total, saleId]
  );
}


async function updateStatus(connection, saleId, status) {
  await connection.query(
    'UPDATE sales SET status = ? WHERE id = ?',
    [status, saleId]
  );
}
module.exports = {
  createSale,
  updateSaleTotal,
  updateStatus
};
