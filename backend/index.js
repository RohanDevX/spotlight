require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');

const usersRouter = require('./routes/userRoute');
const authRouter = require('./routes/auth');
const communityRouter = require('./routes/communityRoutes');
const eventRouter = require('./routes/eventRoutes');

const db = require('./services/db');
const logger = require('./services/logger');
const { requireAuth } = require('./middleware/jwt');

/* —————————————————— app & global middleware —————————————————— */
const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true, // to send/receive cookies
}));

app.use(express.json());
app.use(cookieParser());

// Serve uploaded images statically
app.use('/uploads', express.static('uploads'));

app.use(morgan('tiny', {
  stream: { write: msg => logger.http(msg.trim()) }
}));

/* —————————————————— public routes —————————————————— */
app.use('/api/v1/users', usersRouter);    // registration, profile (protected inside router)
app.use('/api/v1/auth', authRouter);      // login, logout, refresh token
app.use('/api/v1/community', communityRouter); 
app.use('/api/v1/events', eventRouter);   

// Health check
app.get('/api/v1/ping', (_req, res) => res.send('pong'));

/* —————————————————— protected example route —————————————————— */
app.get('/api/v1/hello', requireAuth, async (req, res, next) => {
  try {
    const { rows: [user] } = await db.query(
      'SELECT name FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ message: `Hello, ${user ? user.name : 'friend'}!` });
  } catch (err) {
    next(err);
  }
});

/* —————————————————— error handling —————————————————— */
app.use((err, _req, res, _next) => {
  logger.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/* —————————————————— start server —————————————————— */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
