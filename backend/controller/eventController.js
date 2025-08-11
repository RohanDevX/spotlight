// controllers/eventController.js
const fs = require('fs');
const path = require('path');
const Event = require('../model/eventModel'); // matches your model file

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'event-images');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const moveFile = (file, fieldName) => {
  if (!file) return null;
  const ext = path.extname(file.originalname);
  const fname = `${Date.now()}-${fieldName}${ext}`;
  const dest = path.join(UPLOAD_DIR, fname);
  
  try {
    fs.renameSync(file.path, dest);
    return path.relative(path.join(__dirname, '..'), dest).replace(/\\/g, '/');
  } catch (error) {
    // Clean up temp file on error
    fs.unlink(file.path, () => {});
    throw error;
  }
};

const buildPayload = async (body, files = {}, existing = null) => {
  const payload = { ...body };

  // Only set event_image if a new one is uploaded
  if (files.event_image?.[0]) {
    payload.event_image = moveFile(files.event_image[0], 'event_image');
  } else if (existing?.event_image) {
    // Preserve existing image path from DB
    payload.event_image = existing.event_image;
  }

  return payload;
};

// ─────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────
exports.getAll = async (_req, res, next) => {
  try {
    const rows = await Event.findAll();
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const row = await Event.findById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Event not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const payload = await buildPayload(req.body, req.files);
    const row = await Event.create(payload);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await Event.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Event not found' });

    const payload = await buildPayload(req.body, req.files, existing);
    const row = await Event.update(req.params.id, payload);
    res.json(row);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const row = await Event.findById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Event not found' });

    // Delete image if exists
    if (row.event_image) {
      const imgPath = path.join(__dirname, '..', row.event_image);
      fs.unlink(imgPath, (err) => {
        if (err) console.warn(`⚠️ Failed to delete image: ${imgPath}`, err.message);
      });
    }

    await Event.remove(req.params.id);
    res.json({ message: 'Event deleted', status: 'success' });
  } catch (err) {
    next(err);
  }
};
