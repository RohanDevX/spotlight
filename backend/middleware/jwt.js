// middleware/jwt.js
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

const {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_TTL   = '15m',  // e.g. 15 minutes
  REFRESH_TOKEN_TTL  = '7d'    // e.g. 7 days
} = process.env;

/* ── helpers ─────────────────────────────── */
function issueAccess(payload) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function issueRefresh(payload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

function hash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/* ── middleware ──────────────────────────── */
function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  if (!hdr.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed token' });
  }
  const token = hdr.split(' ')[1];
  try {
    req.user = jwt.verify(token, ACCESS_TOKEN_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid / expired token' });
  }
}

module.exports = { issueAccess, issueRefresh, hash, requireAuth };
