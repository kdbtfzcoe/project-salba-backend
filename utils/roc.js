const THRESHOLDS_FT = [
    { level: 1, name: 'Gutter', heightFt: 0.67, status: 'SAFE' },
    { level: 2, name: 'Half Knee', heightFt: 0.83, status: 'MONITOR' },
    { level: 3, name: 'Half Tire', heightFt: 1.08, status: 'WARNING' },
    { level: 4, name: 'Knee', heightFt: 1.58, status: 'DANGER' },
    { level: 5, name: 'Tires', heightFt: 2.17, status: 'EVACUATE' },
    { level: 6, name: 'Waist', heightFt: 3.08, status: 'EVACUATE' },
    { level: 7, name: 'Chest', heightFt: 3.75, status: 'EVACUATE' }
];

exports.calculateVelocityAndStatus = (filteredWaterLevel, previousCalculated, currentTime, latestRawEntryTime) => {
    let velocityFtHr = 0;
    
    if (previousCalculated && previousCalculated.created_at) {
        const prevFilteredFt = Number(previousCalculated.filtered_water_level);
        const prevTime = new Date(previousCalculated.created_at).getTime();
        const batchLatestTime = new Date(latestRawEntryTime).getTime();
        
        const timeDiffMinutes = (batchLatestTime - prevTime) / 60000;
        const timeDiffHours = timeDiffMinutes / 60;
        const dt = timeDiffHours > 0 ? timeDiffHours : (1 / 60);

        const heightDifferenceFt = filteredWaterLevel - prevFilteredFt;
        velocityFtHr = heightDifferenceFt / dt; // ft/hr
    }

    let currentStatus = 'SAFE';
    for (let i = THRESHOLDS_FT.length - 1; i >= 0; i--) {
        if (filteredWaterLevel >= THRESHOLDS_FT[i].heightFt) {
            currentStatus = THRESHOLDS_FT[i].status;
            break;
        }
    }

    // Force EVACUATE if max threshold exceeded
    const MAX_THRESHOLD_FT = THRESHOLDS_FT[THRESHOLDS_FT.length - 1].heightFt;
    if (filteredWaterLevel >= MAX_THRESHOLD_FT) {
        currentStatus = 'EVACUATE';
    }

    return {
        velocityFtHr: Number(velocityFtHr.toFixed(4)),
        status: currentStatus,
        thresholds: THRESHOLDS_FT
    };
};