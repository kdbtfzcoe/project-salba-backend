exports.calculateForecast = (filteredWaterLevel, velocityFtHr, thresholds) => {
    let forecastedTimeMinutes = null;
    const MAX_THRESHOLD_FT = thresholds[thresholds.length - 1].heightFt;

    if (filteredWaterLevel >= MAX_THRESHOLD_FT) {
        forecastedTimeMinutes = 0;
    } else if (velocityFtHr > 0) {
        const nextThreshold = thresholds.find(t => t.heightFt > filteredWaterLevel);
        if (nextThreshold) {
            const remainingHeightFt = nextThreshold.heightFt - filteredWaterLevel;
            const hoursToThreshold = remainingHeightFt / velocityFtHr;
            forecastedTimeMinutes = hoursToThreshold * 60;
        }
    } else if (velocityFtHr < 0) {
        const lowerThresholds = [...thresholds].reverse();
        const nextLowerThreshold = lowerThresholds.find(t => t.heightFt < filteredWaterLevel);
        
        if (nextLowerThreshold) {
            const remainingHeightFt = filteredWaterLevel - nextLowerThreshold.heightFt;
            const absVelocity = Math.abs(velocityFtHr);
            const hoursToThreshold = remainingHeightFt / absVelocity;
            forecastedTimeMinutes = hoursToThreshold * 60;
        }
    }

    return forecastedTimeMinutes !== null ? Number(forecastedTimeMinutes.toFixed(2)) : null;
};