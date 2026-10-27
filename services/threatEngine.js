const thresholds = require('../config/thresholds');

exports.evaluateLevel = (waterLevelCm) => {
    for (const [key, config] of Object.entries(thresholds)) {
        if (waterLevelCm <= config.max) {
            return { status: key, ...config };
        }
    }
    return { status: 'UNKNOWN', label: 'Unknown', color: 'safe' };
};