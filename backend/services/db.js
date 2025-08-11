// services/db.js
const { Pool } = require('pg');
require('dotenv').config();               // ← loads DATABASE_URL from .env

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};