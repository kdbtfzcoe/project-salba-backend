const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetryController');

// Route for ESP32 hardware node data ingestion (pointing to telemetryController)
router.post('/telemetry', telemetryController.receiveTelemetry);
router.post('/hardware/telemetry', telemetryController.receiveTelemetry);

module.exports = router;