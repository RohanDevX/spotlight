// middleware/validation.js
const validator = require('validator');

// User registration validation
exports.validateUserRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// User update validation
exports.validateUserUpdate = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (email && !validator.isEmail(email)) {
    errors.push('Valid email format required');
  }

  if (password && password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// Community validation
exports.validateCommunity = (req, res, next) => {
  const { name, category, email, contact } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Community name is required');
  }

  if (!category) {
    errors.push('Category is required');
  }

  if (email && !validator.isEmail(email)) {
    errors.push('Valid email format required');
  }

  if (!contact) {
    errors.push('Contact information is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// Event validation
exports.validateEvent = (req, res, next) => {
  const { event_name, event_date, event_time, category } = req.body;
  const errors = [];

  if (!event_name || event_name.trim().length < 2) {
    errors.push('Event name is required');
  }

  if (!event_date) {
    errors.push('Event date is required');
  } else if (!validator.isISO8601(event_date)) {
    errors.push('Valid event date (YYYY-MM-DD) is required');
  }

  if (!event_time) {
    errors.push('Event time is required');
  }

  if (!category) {
    errors.push('Category is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// Sanitize update fields (prevent SQL injection)
exports.sanitizeUpdateFields = (allowedFields) => {
  return (req, res, next) => {
    const sanitized = {};
    
    for (const key in req.body) {
      if (allowedFields.includes(key)) {
        sanitized[key] = req.body[key];
      }
    }
    
    req.body = sanitized;
    next();
  };
};