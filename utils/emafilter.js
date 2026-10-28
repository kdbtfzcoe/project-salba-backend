exports.calculateEMA = (rawDistanceCm, previousCalculated) => {
    // Convert raw cm to Feet with 2 decimal places
    const currentRawFt = Number((Number(rawDistanceCm) / 30.48).toFixed(2));
    
    let filteredWaterLevel;
    if (!previousCalculated) {
        filteredWaterLevel = currentRawFt;
    } else {
        const prevFilteredFt = Number(previousCalculated.filtered_water_level);
        filteredWaterLevel = (0.70 * prevFilteredFt) + (0.30 * currentRawFt);
    }
    
    return Number(filteredWaterLevel.toFixed(2));
};