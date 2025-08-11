// controllers/communityController.js
const fs = require('fs');
const path = require('path');
const community = require('../model/communityModel');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'community-images');
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

const buildPayload = (body, files = {}, existing = null) => {
  const payload = { ...body };

  // Parse social_links if it's a string
  if (typeof payload.social_links === 'string') {
    try {
      payload.social_links = JSON.parse(payload.social_links);
    } catch {
      payload.social_links = {};
    }
  }

  // Preserve logo if not replaced
  if (files.logo?.[0]) {
    payload.logo = moveFile(files.logo[0], 'logo');
  } else if (existing?.logo) {
    payload.logo = existing.logo;
  }

  // Preserve image if not replaced
  if (files.image?.[0]) {
    payload.image = moveFile(files.image[0], 'image');
  } else if (existing?.image) {
    payload.image = existing.image;
  }

  return payload;
};

// ─────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────
exports.getAll = async (_req, res, next) => {
  try {
    res.json(await community.findAll());
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const row = await community.findById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const payload = buildPayload(req.body, req.files);
    const row = await community.create(payload);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await community.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const payload = buildPayload(req.body, req.files, existing);
    const row = await community.update(req.params.id, payload);
    res.json(row);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const row = await community.findById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    ['image', 'logo'].forEach(field => {
      if (row[field]) {
        const imgPath = path.join(__dirname, '..', row[field]);
        fs.unlink(imgPath, err => {
          if (err) console.warn(`⚠️ Could not delete ${field} file:`, err.message);
        });
      }
    });

    await community.remove(req.params.id);
    res.json({ message: 'The record is deleted', status: 'success' });
  } catch (err) {
    next(err);
  }
};
