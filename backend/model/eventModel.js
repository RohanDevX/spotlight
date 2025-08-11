// models/eventModel.js
const db = require('../services/db');

const COLUMNS = `
  id, event_name, event_date, event_time,
  cost, event_image, location, contact,
  category, sub_category, social_links,
  status, created_at, priority
`;

// Get all events
exports.findAll = async () => {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM events ORDER BY created_at DESC`
  );
  return rows;
};

// Get event by ID
exports.findById = async (id) => {
  const { rows: [row] } = await db.query(
    `SELECT ${COLUMNS} FROM events WHERE id = $1`,
    [id]
  );
  return row;
};

// Create new event
exports.create = async (payload) => {
  const {
    event_name, event_date, event_time,
    cost, event_image, location, contact,
    category, sub_category, social_links,
    status, priority
  } = payload;

  // 🔧 PASTE JSONB STANDARDIZATION CODE HERE:
  const contactJson = typeof contact === 'string' 
    ? contact 
    : JSON.stringify(contact);
    
  const socialLinksJson = social_links 
    ? (typeof social_links === 'string' ? social_links : JSON.stringify(social_links))
    : null;

  const { rows: [row] } = await db.query(
    `INSERT INTO events (
      event_name, event_date, event_time, cost,
      event_image, location, contact,
      category, sub_category, social_links,
      status, priority
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, COALESCE($11, DEFAULT), COALESCE($12, DEFAULT)
    )
    RETURNING ${COLUMNS}`,
    [
      event_name,
      event_date,
      event_time,
      cost,
      event_image,
      location,
      contactJson,           // ✅ Use standardized JSON
      category,
      sub_category,
      socialLinksJson,       // ✅ Use standardized JSON
      status || null,
      typeof priority === 'boolean' ? priority : null
    ]
  );

  return row;
};

// Update event (dynamic fields)
exports.update = async (id, payload) => {
  const fields = [];
  const values = [id];
  let idx = 2;

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      // 🔧 PASTE JSONB STANDARDIZATION CODE HERE:
      if (key === 'contact' || key === 'social_links') {
        fields.push(`${key}=$${idx++}`);
        const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
        values.push(jsonValue);
      } else {
        fields.push(`${key}=$${idx++}`);
        values.push(value);
      }
    }
  }

  if (!fields.length) return await exports.findById(id); // nothing to update

  const { rows: [row] } = await db.query(
    `UPDATE events SET ${fields.join(', ')}
     WHERE id=$1
     RETURNING ${COLUMNS}`,
    values
  );

  return row;
};

// Delete event
exports.remove = async (id) => {
  const { rowCount } = await db.query(
    'DELETE FROM events WHERE id = $1', [id]
  );
  return rowCount;
};