const db = require('../services/db');
const bcrypt = require('bcryptjs');

const COLUMNS = `id, name, email, phone, interest, image, created_at`;

// Create user with password hashed inside
exports.create = async ({ name, email, password, phone, interest, image }) => {
  const hashedPassword = await bcrypt.hash(password, 12);

  const { rows: [user] } = await db.query(
    `INSERT INTO users (name, email, password, phone, interest, image)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${COLUMNS}`,
    [
      name,
      email,
      hashedPassword,
      phone || null,
      (interest && interest.length) ? interest : null,
      image || null
    ]
  );

  return user;
};

// Find by ID (exclude password)
exports.findById = async (id) => {
  const { rows: [user] } = await db.query(
    `SELECT ${COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return user;
};

// Find by email (include password for auth)
exports.findByEmail = async (email) => {
  const { rows: [user] } = await db.query(
    `SELECT id, name, email, phone, interest, image, password, created_at
     FROM users WHERE email = $1`,
    [email]
  );
  return user;
};

// Compare plaintext password with hashed password
exports.verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};
