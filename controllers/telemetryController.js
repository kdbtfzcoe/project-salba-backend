const supabase = require('../config/db');
const { calculateEMARate, generateForecast } = require('../utils/emafilter');

// 1. Used by React Frontend (GET /telemetry/live)
exports.getLiveTelemetry = async (req, res) => {
    try {
        const { data: logs, error } = await supabase
            .from('telemetry')
            .select('water_level_cm, created_at, status')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        const latestReading = logs && logs.length > 0 ? logs[0] : { water_level_cm: 0, status: 'SAFE' };
        const chronologicalLogs = logs ? [...logs].reverse() : [];

        const emaRate = calculateEMARate(chronologicalLogs);
        const forecast = generateForecast(latestReading.water_level_cm, emaRate);

        return res.status(200).json({
            waterLevelCm: latestReading.water_level_cm,
            status: latestReading.status || 'SAFE',
            rateStatus: forecast.rateStatus,
            rateValue: forecast.rateValue,
            nodeDesc: 'Continuous river height measurement active.',
            forecast: forecast
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// 2. Used by ESP32 Hardware Node (POST /hardware/telemetry)
exports.receiveTelemetry = async (req, res) => {
    try {
        const { water_level_cm, status } = req.body;

        const { data, error } = await supabase
            .from('telemetry')
            .insert([{ water_level_cm, status: status || 'SAFE' }])
            .select();

        if (error) throw error;

        return res.status(201).json({ success: true, data: data ? data[0] : null });
    } catch (err) {
        console.error('[Hardware Controller Error]:', err.message);
        return res.status(500).json({ error: err.message });
    }
};