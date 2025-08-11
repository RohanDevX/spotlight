const express = require('express');
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload'); // ✅ New import
const { validateUserRegistration, validateUserUpdate } = require('../middleware/validation'); // ✅ New import
const ctrl = require('../controller/userController'); // ✅ Fixed import
const { requireAuth } = require('../middleware/jwt');

const router = express.Router();

/* ─── Public Routes ─── */
router.post('/register', 
  upload.fields([{ name: 'image', maxCount: 1 }]),
  validateUserRegistration, // ✅ Add validation
  ctrl.registerUser
);

// router.post('/login', ctrl.loginUser);

/* ─── Protected Routes ─── */
router.use(requireAuth);

router.get('/profile', async (req, res, next) => {
  try {
    req.params = { id: req.user.id };
    await ctrl.getUserById(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.patch('/profile', 
  upload.fields([{ name: 'image', maxCount: 1 }]),
  validateUserUpdate, // ✅ Add validation
  async (req, res, next) => {
    try {
      req.params.id = req.user.id;
      await ctrl.updateUser(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/profile', async (req, res, next) => {
  try {
    req.params.id = req.user.id;
    await ctrl.deleteUser(req, res, next);
  } catch (err) {
    next(err);
  }
});

module.exports = router;