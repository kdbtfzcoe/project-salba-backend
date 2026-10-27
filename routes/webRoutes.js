const express = require('express');
const router = express.Router();

const telemetryController = require('../controllers/telemetryController');
const subscriberController = require('../controllers/subscriberController');

router.get('/telemetry/live', telemetryController.getLiveTelemetry);
router.post('/users/register', subscriberController.createSubscriber);

module.exports = router;