const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetryController');

// Route for ESP32 hardware node data ingestion
router.post('/telemetry', telemetryController.receiveTelemetry);

module.exports = router;