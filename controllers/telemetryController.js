const supabase = require('../config/db');
const emaService = require('../utils/emafilter');
const rocService = require('../utils/roc');
const forecastService = require('../utils/forecast');

// ==========================================
// 1. Used by React Frontend (GET /telemetry/live)
// ==========================================
exports.getLiveTelemetry = async (req, res) => {
    try {
        const { data: logs, error } = await supabase
            .from('calculated_logs')
            .select('filtered_water_level, rate_of_change, forecasted_time, status, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        const latestReading = logs && logs.length > 0 ? logs[0] : { 
            filtered_water_level: 0, 
            rate_of_change: 0, 
            forecasted_time: null, 
            status: 'SAFE' 
        };

        let rateStatus = 'STABLE';
        const rateVal = Number(latestReading.rate_of_change || 0);
        if (rateVal > 0) rateStatus = 'RISING';
        else if (rateVal < 0) rateStatus = 'FALLING';

        // Format rateValue as a string matching your frontend's expectation
        const formattedRateValue = `${rateVal.toFixed(1)} ft/hr`; // Change units if your frontend explicitly looks for cm/min

        return res.status(200).json({
            waterLevelFt: latestReading.filtered_water_level,
            waterLevelCm: latestReading.filtered_water_level,
            status: latestReading.status || 'SAFE',
            rateStatus: rateStatus,
            velocityFtHr: rateVal,
            rateValue: formattedRateValue,
            forecastedTimeMinutes: latestReading.forecasted_time,
            nodeDesc: 'Continuous river height measurement active (5-min batch aggregation).',
            
            // This matches the nested forecast structure your frontend expects
            forecast: {
                estimatedMinutes: latestReading.forecasted_time,
                rateStatus: rateStatus,
                rateValue: formattedRateValue,
                nextThreshold: null,
                message: latestReading.forecasted_time !== null 
                    ? `Estimated time to threshold: ${latestReading.forecasted_time} minutes.` 
                    : 'Water level stable. No threshold breach expected.'
            }
        });
                
    } catch (err) {
        console.error('[Telemetry Controller Error]:', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ==========================================
// 2. Used by ESP32 Hardware Node (POST /hardware/telemetry)
// ==========================================
exports.receiveTelemetry = async (req, res) => {
    try {
        const { node_id, raw_distance_cm } = req.body;

        if (raw_distance_cm === undefined || raw_distance_cm === null) {
            return res.status(400).json({ error: 'Missing raw_distance_cm in request body' });
        }

        const targetNodeId = node_id || 1;
        const currentTime = new Date();

        // --- STEP 1: Always insert raw data into telemetry_logs ---
        const { data: rawLog, error: rawError } = await supabase
            .from('telemetry_logs')
            .insert([{
                node_id: targetNodeId,
                raw_distance_cm: raw_distance_cm
            }])
            .select()
            .single();

        if (rawError) throw rawError;

        // --- STEP 2: Check uncalculated logs count ---
        const { data: lastCalcLog, error: lastCalcError } = await supabase
            .from('calculated_logs')
            .select('created_at, telemetry_id')
            .eq('node_id', targetNodeId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (lastCalcError) throw lastCalcError;

        let rawQuery = supabase
            .from('telemetry_logs')
            .select('telemetry_id, raw_distance_cm, created_at', { count: 'exact' })
            .eq('node_id', targetNodeId);

        if (lastCalcLog && lastCalcLog.created_at) {
            rawQuery = rawQuery.gt('created_at', lastCalcLog.created_at);
        }

        const { data: uncalculatedRows, count, error: countError } = await rawQuery.order('created_at', { ascending: true });

        if (countError) throw countError;

        // --- STEP 3: Batch Gate Check (Require at least 5 entries) ---
        if (!count || count < 5) {
            return res.status(201).json({
                success: true,
                batched: false,
                message: `Raw telemetry logged. Waiting for batch accumulation (${count || 1}/5 entries collected).`,
                raw_telemetry_id: rawLog.telemetry_id
            });
        }

        // --- STEP 4: Process Batch Analytics using Services ---
        const latestRawEntry = uncalculatedRows[uncalculatedRows.length - 1];

        const { data: previousCalculated, error: histError } = await supabase
            .from('calculated_logs')
            .select('filtered_water_level, created_at')
            .eq('node_id', targetNodeId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (histError) throw histError;

        // --- STEP 5: Apply EMA via emafilter utility ---
        const filteredWaterLevel = emaService.calculateEMA(latestRawEntry.raw_distance_cm, previousCalculated);

        // --- STEP 6 & 7: Calculate Velocity and Status via roc utility ---
        const rocResult = rocService.calculateVelocityAndStatus(
            filteredWaterLevel, 
            previousCalculated, 
            currentTime, 
            latestRawEntry.created_at
        );

        // --- STEP 8: Calculate Forecast via forecast utility ---
        const forecastedTimeMinutes = forecastService.calculateForecast(
            filteredWaterLevel, 
            rocResult.velocityFtHr, 
            rocResult.thresholds
        );

        // --- STEP 9: Save batch analytics into calculated_logs ---
        const { data: calcLog, error: calcError } = await supabase
            .from('calculated_logs')
            .insert([{
                node_id: targetNodeId,
                telemetry_id: latestRawEntry.telemetry_id,
                filtered_water_level: filteredWaterLevel,
                rate_of_change: rocResult.velocityFtHr,
                forecasted_time: forecastedTimeMinutes,
                status: rocResult.status
            }])
            .select()
            .single();

        if (calcError) throw calcError;

        return res.status(201).json({
            success: true,
            batched: true,
            message: 'Batch of 5 entries reached! Processed via services successfully.',
            calculated_data: calcLog
        });

    } catch (err) {
        console.error('[Telemetry Controller Error]:', err.message);
        return res.status(500).json({ error: err.message });
    }
};