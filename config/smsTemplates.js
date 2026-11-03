/**
 * Centralized SMS Templates and Recommended Actions for Project SALBA
 */
const RISK_ACTIONS = {
    SAFE: 'Continue monitoring official advisories and stay alert for updates.',
    MONITOR: 'Secure your properties and monitor water-level developments.',
    WARNING: 'Prepare emergency supplies and coordinate your household evacuation plan.',
    DANGER: 'Prepare to evacuate immediately and follow local emergency advisories.',
    EVACUATE: 'Evacuate immediately to the nearest designated evacuation center.'
};

function formatSalbaSmsMessage(recipient, telemetryData, thresholdInfo, targetThresholdInfo, riskExposure) {
    const waterLevelStr = Number(telemetryData.filtered_water_level).toFixed(2);
    const rateVal = Number(telemetryData.rate_of_change || 0);
    
    let trendDesc = 'Stable';
    if (rateVal > 0) trendDesc = `Rising at ${Math.abs(rateVal).toFixed(1)} ft/hr`;
    else if (rateVal < 0) trendDesc = `Falling at ${Math.abs(rateVal).toFixed(1)} ft/hr`;

    const forecastMinutes = telemetryData.forecasted_time;
    let forecastStr = 'Calculations updating...';

    if (forecastMinutes !== null && forecastMinutes !== undefined) {
        const targetName = targetThresholdInfo && targetThresholdInfo.name ? targetThresholdInfo.name.toUpperCase() : 'NEXT THRESHOLD';
        const targetLevelNum = targetThresholdInfo && targetThresholdInfo.level !== undefined ? ` (Level ${targetThresholdInfo.level})` : '';
        const actionVerb = rateVal < 0 ? 'receding to' : 'reaching';

        forecastStr = `${Math.round(forecastMinutes)} mins until ${actionVerb} ${targetName}${targetLevelNum}`;
    } else {
        forecastStr = 'Water level stable. No immediate threshold crossing forecasted.';
    }

    const timestampStr = new Date(telemetryData.created_at || Date.now()).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    const statusLabel = thresholdInfo ? thresholdInfo.label : 'NORMAL / BELOW GUTTER';
    const recommendedAction = RISK_ACTIONS[riskExposure.exposure] || RISK_ACTIONS.SAFE;
    const distanceMeters = recipient.distance_to_node || 0;
    const priorityTier = riskExposure.priorityTier || riskExposure.priority || 1;
    const residentName = recipient.full_name || 'Resident';

    return `🚨 Project SALBA
Status: ${statusLabel}
As of: ${timestampStr}

📊 SENSOR DETAILS
• Level: ${waterLevelStr} feet
• Trend: ${trendDesc}
• Forecast: ${forecastStr}

👤 YOUR RISK PROFILE
• Resident: ${residentName}
• Distance: ${distanceMeters}m (Priority ${priorityTier})
• Exposure: ${riskExposure.exposure}

⚠️ ACTION REQUIRED:
${recommendedAction}

📢 Check official Brgy. Dela Paz flood monitoring channels for updates.`;
}

module.exports = {
    RISK_ACTIONS,
    formatSalbaSmsMessage
};