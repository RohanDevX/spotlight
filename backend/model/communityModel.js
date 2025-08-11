const db = require('../services/db');

/* ───────── helpers ───────────────────────── */

const COLUMNS = `
  id, name, category, contact, address, email,
  social_links, logo, description, created_at,
  sub_category, image, in_charge
`;

/* ───────── CRUD ──────────────────────────── */

exports.findAll = async () => {
  const { rows } = await db.query(`SELECT ${COLUMNS} FROM community ORDER BY created_at DESC`);
  return rows;
};

exports.findById = async (id) => {
  const { rows: [row] } = await db.query(`SELECT ${COLUMNS} FROM community WHERE id = $1`, [id]);
  return row;
};

exports.create = async (payload) => {
  const {
    name, category, contact, address, email,
    social_links, logo, description, sub_category,
    image, in_charge
  } = payload;

  const { rows: [row] } = await db.query(
    `INSERT INTO community
       (name, category, contact, address, email,
        social_links, logo, description,
        sub_category, image, in_charge)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING ${COLUMNS}`,
    [
      name, category, contact, address, email,
      social_links, logo, description, sub_category,
      image, in_charge
    ]
  );

  return row;
};

exports.update = async (id, payload) => {
  const fields = [];
  const values = [id];
  let idx = 2; // because $1 is the id

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) { // only update provided fields
      fields.push(`${key}=$${idx++}`);
      values.push(value);
    }
  }

  if (!fields.length) return await exports.findById(id); // nothing to update

  const { rows: [row] } = await db.query(
    `UPDATE community SET ${fields.join(', ')}
     WHERE id=$1
     RETURNING ${COLUMNS}`,
    values
  );

  return row;
};


exports.remove = async (id) => {
  const { rowCount } = await db.query('DELETE FROM community WHERE id = $1', [id]);
  return rowCount;
};
