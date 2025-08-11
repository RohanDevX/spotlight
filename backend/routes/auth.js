const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db       = require('../services/db');
const {
  issueAccess, issueRefresh, requireAuth, hash
} = require('../middleware/jwt');

const router = express.Router();

/* ------- POST /login ------- */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email and password required' });

    const { rows:[u] } = await db.query(
      'SELECT id, name, password FROM users WHERE email=$1',
      [email.trim()]
    );
    const ok = u && await bcrypt.compare(password, u.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    /* sign & persist tokens */
    const accessToken  = issueAccess({ id: u.id, name: u.name });
    const refreshToken = issueRefresh({ id: u.id });

    await db.query(
      `INSERT INTO refresh_tokens(token_hash, user_id, expires_at)
       VALUES ($1,$2,now()+$3::interval)`,
      [hash(refreshToken), u.id, process.env.REFRESH_TOKEN_TTL]
    );

    /* send: access in body, refresh as httpOnly cookie */
    res.cookie('refresh', refreshToken, {
      httpOnly: true,
      secure  : process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge  : 1000 * 60 * 60 * 24 * 7   // 7 days
    });
    res.json({ accessToken, user:{ id:u.id, name:u.name } });
  } catch (err) { next(err); }
});

/* ------- POST /refresh ------- */
router.post('/refresh', async (req,res,next) => {
  try {
    const { refresh: oldToken } = req.cookies || {};
    if (!oldToken) return res.status(401).json({ error: 'No refresh token' });

    /* verify signature & expiry */
    let payload;
    try {
      payload = jwt.verify(oldToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    /* check against DB and not revoked/expired */
    const { rows:[row] } = await db.query(
      'SELECT * FROM refresh_tokens WHERE token_hash=$1 AND revoked=false',
      [hash(oldToken)]
    );
    if (!row) return res.status(401).json({ error: 'Refresh token revoked' });

    /* rotate: mark old one revoked, issue new one */
    await db.query(
      'UPDATE refresh_tokens SET revoked=true WHERE id=$1',
      [row.id]
    );

    const newRefresh = issueRefresh({ id: payload.id });
    await db.query(
      `INSERT INTO refresh_tokens(token_hash, user_id, expires_at)
       VALUES ($1,$2,now()+$3::interval)`,
      [hash(newRefresh), payload.id, process.env.REFRESH_TOKEN_TTL]
    );

    const newAccess = issueAccess({ id: payload.id, name: payload.name });

    res.cookie('refresh', newRefresh, {
      httpOnly: true,
      secure  : process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge  : 1000 * 60 * 60 * 24 * 7
    });
    res.json({ accessToken: newAccess });
  } catch (err) { next(err); }
});

/* ------- POST /logout ------- */
router.post('/logout', async (req,res,next) => {
  try {
    const { refresh } = req.cookies || {};
    if (refresh) await db.query(
      'UPDATE refresh_tokens SET revoked=true WHERE token_hash=$1',
      [hash(refresh)]
    );
    res.clearCookie('refresh');
    res.json({ ok:true });
  } catch (err) { next(err); }
});

/* ------- example protected ------- */
router.get('/me', requireAuth, (req,res) =>
  res.json({ id:req.user.id, name:req.user.name })
);

module.exports = router;
