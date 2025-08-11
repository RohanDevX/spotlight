const User = require('../model/userModel');
const db = require('../services/db');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// Image Upload Helpers
// ─────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'users-image');
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

  // Handle image upload
  if (files.image?.[0]) {
    payload.image = moveFile(files.image[0], 'image');
  } else if (existing?.image) {
    // Preserve existing image if no new one uploaded
    payload.image = existing.image;
  }

  return payload;
};

// ─────────────────────────────────────────────
// Controllers
// ─────────────────────────────────────────────

// Register user
exports.registerUser = async (req, res, next) => {
  try {
    const existing = await User.findByEmail(req.body.email);
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const payload = buildPayload(req.body, req.files);
    const user = await User.create(payload);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

// // Login user - email + password only
// exports.loginUser = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findByEmail(email);

//     if (!user) return res.status(401).json({ error: 'Invalid email or password' });

//     const valid = await User.verifyPassword(password, user.password);
//     if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

//     // Return user data without password (or generate JWT here)
//     const { password: _p, ...userData } = user;
//     res.json(userData);
//   } catch (err) {
//     next(err);
//   }
// };

// List all users
exports.listUsers = async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, email, phone, interest, image, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Update user (PATCH) - now with image handling
exports.updateUser = async (req, res, next) => {
  try {
    // Get existing user data first
    const existing = await User.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    // Build payload with image handling
    const payload = buildPayload(req.body, req.files, existing);
    
    const fields = [];
    const values = [req.params.id];
    let idx = 1;

    // Handle password hashing if provided
    if (payload.password) {
      const bcrypt = require('bcryptjs');
      payload.password = await bcrypt.hash(payload.password, 12);
    }

    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${++idx}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING id, name, email, phone, interest, image, created_at
    `;

    const { rows: [updatedUser] } = await db.query(query, values);
    res.json(updatedUser);
  } catch (err) {
    next(err);
  }
};

// Delete user - now with image cleanup
exports.deleteUser = async (req, res, next) => {
  try {
    // Get user data first to clean up image
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete user image if exists
    if (user.image) {
      const imgPath = path.join(__dirname, '..', user.image);
      fs.unlink(imgPath, (err) => {
        if (err) console.warn(`⚠️ Failed to delete user image: ${imgPath}`, err.message);
      });
    }

    // Delete user from database
    const { rows: [deletedUser] } = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    res.json({ message: 'User deleted successfully', status: 'success' });
  } catch (err) {
    next(err);
  }
};