const express = require('express');
const router = express.Router();

const telemetryController = require('../controllers/telemetryController');
const subscriberController = require('../controllers/subscriberController');

// Live endpoint for React frontend
router.get('/telemetry/live', telemetryController.getLiveTelemetry);

// Hardware data ingestion endpoint for ESP32 (supports both /telemetry and /hardware/telemetry)
router.post('/telemetry', telemetryController.receiveTelemetry);
router.post('/hardware/telemetry', telemetryController.receiveTelemetry);

// Subscriber route
router.post('/users/register', subscriberController.createSubscriber);

module.exports = router;