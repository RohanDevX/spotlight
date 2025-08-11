const express = require('express');
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload'); // ✅ New import
const { requireAuth } = require('../middleware/jwt');
const ctrl = require('../controller/eventController');
const { validateEvent} = require('../middleware/validation');

const router = express.Router();

/* ─── PUBLIC ROUTES (No Login Required) ─── */
router.get('/', ctrl.getAll);

/* ─── PROTECTED ROUTES (Login Required) ─── */
router.use(requireAuth);

router.get('/:id', ctrl.getById);

router.post('/',
  upload.fields([{ name: 'event_image', maxCount: 1 }]),
  validateEvent,
  ctrl.create
);

router.put('/:id',
  upload.fields([{ name: 'event_image', maxCount: 1 }]),
  ctrl.update
);

router.delete('/:id', ctrl.remove);

module.exports = router;