const e = require('express');
const app = require('./app');
const db = require('./db');
require('dotenv').config();

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



async function testDB() {
  const [rows] = await db.query('SELECT 1');
  console.log('DB conectada:', rows);
}

testDB();

