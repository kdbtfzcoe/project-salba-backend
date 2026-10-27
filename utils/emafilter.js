// Physical thresholds (in cm)
const THRESHOLDS = [
    { level: 1, name: 'Gutter', cm: 20.42 },
    { level: 2, name: 'Half Knee', cm: 25.30 },
    { level: 3, name: 'Half Tire', cm: 32.92 },
    { level: 4, name: 'Knee', cm: 48.16 },
    { level: 5, name: 'Tires', cm: 66.14 },
    { level: 6, name: 'Waist', cm: 93.88 },
    { level: 7, name: 'Chest', cm: 114.30 }
];

/**
 * Calculates Exponential Moving Average (EMA) rate of change
 * @param {Array} readings - Array of recent water level readings with timestamps
 */
exports.calculateEMARate = (readings) => {
    if (!readings || readings.length < 2) return 0.0;

    const alpha = 0.3; // Smoothing factor
    let emaRate = 0;

    for (let i = 1; i < readings.length; i++) {
        const deltaCm = readings[i].water_level_cm - readings[i - 1].water_level_cm;
        const deltaMins = (new Date(readings[i].created_at) - new Date(readings[i - 1].created_at)) / 60000;

        if (deltaMins > 0) {
            const currentRate = deltaCm / deltaMins;
            emaRate = (alpha * currentRate) + ((1 - alpha) * emaRate);
        }
    }

    return parseFloat(emaRate.toFixed(2));
};

/**
 * Computes forecast data for the next threshold breach
 */
exports.generateForecast = (currentCm, emaRate) => {
    // Find the next unbreached threshold
    const nextThreshold = THRESHOLDS.find(t => t.cm > currentCm);

    // Water level is stable, falling, or already above the highest threshold
    if (!nextThreshold || emaRate <= 0) {
        return {
            estimatedMinutes: null,
            rateStatus: emaRate < 0 ? 'DECREASING' : 'STABLE',
            rateValue: `${Math.abs(emaRate).toFixed(1)} cm/min`,
            nextThreshold: null,
            message: 'Water level stable. No threshold breach expected.'
        };
    }

    // Minutes = (Target Height - Current Height) / EMA Rate
    const cmNeeded = nextThreshold.cm - currentCm;
    const estimatedMinutes = Math.ceil(cmNeeded / emaRate);

    return {
        estimatedMinutes,
        rateStatus: 'INCREASING',
        rateValue: `+${emaRate.toFixed(1)} cm/min`,
        nextThreshold,
        message: `Before reaching Level ${nextThreshold.level}: ${nextThreshold.name} (${nextThreshold.cm.toFixed(2)} cm)`
    };
};