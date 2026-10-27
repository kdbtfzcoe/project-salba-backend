// Define your 7-level height limits (in cm)
module.exports = {
    NORMAL: { max: 100, label: 'Normal', color: 'safe' },
    MONITORING: { max: 200, label: 'Monitoring', color: 'monitor' },
    WARNING: { max: 300, label: 'Warning', color: 'warning' },
    DANGER: { max: 400, label: 'Danger', color: 'danger' },
    CRITICAL: { max: 500, label: 'Critical', color: 'danger' },
    EVACUATE: { max: 600, label: 'Evacuate', color: 'evacuate' },
    BREACH: { max: Infinity, label: 'Breach', color: 'evacuate' }
};