const db = require('../../db');
async function findByKey(key) {
  const [rows] = await db.query(
    'SELECT * FROM idempotency_keys WHERE `key` = ?',
    [key]
  );

  return rows[0] || null;
}


async function saveResponse(connection,key, response) {
  await connection.query(
    'UPDATE idempotency_keys SET response = ? WHERE `key` = ?',
    [JSON.stringify(response), key]
  );
}

async function createIdempotencyKey(connection, key, status) {
  await connection.query(
    'INSERT INTO idempotency_keys (`key`, status) VALUES (?, ?)',
    [key, status]
  );
}
module.exports = {
  findByKey,
  saveResponse,
  createIdempotencyKey
};