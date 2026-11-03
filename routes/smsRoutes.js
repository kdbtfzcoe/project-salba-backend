// ==========================================
// routes/smsRoutes.js
// Project SALBA - Simplified SMS Routes
// ==========================================

const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');

router.get('/attempts', smsController.getAllAttempts);
router.get('/attempts/:id', smsController.getAttemptById);

module.exports = router;