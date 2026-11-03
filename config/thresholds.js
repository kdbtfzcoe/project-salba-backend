// ==========================================
// config/thresholds.js
// Project SALBA - Threshold Classification & Risk Matrix
// ==========================================

const THRESHOLDS = [
    { level: 1, name: 'GUTTER', label: 'GUTTER LEVEL (Level 1)', height: 0.67 },
    { level: 2, name: 'HALF KNEE', label: 'HALF KNEE LEVEL (Level 2)', height: 0.83 },
    { level: 3, name: 'HALF TIRE', label: 'HALF TIRE LEVEL (Level 3)', height: 1.08 },
    { level: 4, name: 'KNEE', label: 'KNEE LEVEL (Level 4)', height: 1.58 },
    { level: 5, name: 'TIRES', label: 'TIRES LEVEL (Level 5)', height: 2.17 },
    { level: 6, name: 'WAIST', label: 'WAIST LEVEL (Level 6)', height: 3.08 },
    { level: 7, name: 'CHEST', label: 'CHEST LEVEL (Level 7)', height: 3.75 }
];

// Returns Level 0 instead of null when water is below 0.67 ft
function classifyWaterLevel(waterLevelFt) {
    const val = Number(waterLevelFt) || 0;
    let highestReached = {
        level: 0,
        name: 'NORMAL',
        label: 'NORMAL',
        height: 0
    };

    for (const t of THRESHOLDS) {
        if (val >= t.height) {
            highestReached = t;
        }
    }
    return highestReached;
}

// Next higher threshold for rising water
function getNextThreshold(currentLevelNum) {
    const next = THRESHOLDS.find(t => t.level === currentLevelNum + 1);
    return next || null;
}

// Next lower threshold for receding water
function getPreviousThreshold(currentLevelNum) {
    if (currentLevelNum <= 1) {
        return { level: 0, name: 'NORMAL', label: 'NORMAL / BELOW GUTTER', height: 0 };
    }
    const prev = THRESHOLDS.find(t => t.level === currentLevelNum - 1);
    return prev || null;
}

// Geographic Distance Priority Matrix
function getRecipientRiskExposure(levelNum, distanceMeters) {
    const dist = Number(distanceMeters) || 0;
    
    // Determine Distance Priority Tier
    let priorityTier = 4;
    if (dist <= 150) priorityTier = 1;
    else if (dist <= 450) priorityTier = 2;
    else if (dist <= 950) priorityTier = 3;

    // Risk Mapping Matrix (Levels 0 through 7)
    const riskMatrix = {
        0: { 1: 'SAFE', 2: 'SAFE', 3: 'SAFE', 4: 'SAFE' },
        1: { 1: 'SAFE', 2: 'SAFE', 3: 'SAFE', 4: 'SAFE' },
        2: { 1: 'MONITOR', 2: 'SAFE', 3: 'SAFE', 4: 'SAFE' },
        3: { 1: 'WARNING', 2: 'MONITOR', 3: 'SAFE', 4: 'SAFE' },
        4: { 1: 'DANGER', 2: 'WARNING', 3: 'MONITOR', 4: 'SAFE' },
        5: { 1: 'EVACUATE', 2: 'DANGER', 3: 'WARNING', 4: 'MONITOR' },
        6: { 1: 'EVACUATE', 2: 'EVACUATE', 3: 'DANGER', 4: 'WARNING' },
        7: { 1: 'EVACUATE', 2: 'EVACUATE', 3: 'EVACUATE', 4: 'EVACUATE' }
    };

    const levelRisks = riskMatrix[levelNum] || riskMatrix[0];
    const exposure = levelRisks[priorityTier] || 'SAFE';

    return {
        priority: priorityTier,
        priorityTier: priorityTier,
        exposure: exposure
    };
}

module.exports = {
    THRESHOLDS,
    classifyWaterLevel,
    getNextThreshold,
    getPreviousThreshold,
    getRecipientRiskExposure
};