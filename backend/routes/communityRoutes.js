const express = require('express');
const path = require('path');
const upload = require('../middleware/upload'); // ✅ New import
const { requireAuth } = require('../middleware/jwt');
const ctrl = require('../controller/communityController');
const { validateCommunity} = require('../middleware/validation');

const router = express.Router();

/* Protect all routes */
router.use(requireAuth);

/* ───── Routes ───── */
// GET all & one
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);

// CREATE with file upload (logo & image)
router.post('/',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  validateCommunity,
  ctrl.create
);

// UPDATE with file upload (logo & image)
router.put('/:id',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  ctrl.update
);

// DELETE
router.delete('/:id', ctrl.remove);

module.exports = router;