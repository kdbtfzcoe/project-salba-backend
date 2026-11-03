// ==========================================
// services/smsService.js
// Project SALBA - Simplified SMS Dispatch Service
// ==========================================

const smsController = require('../controllers/smsController');
const { 
    classifyWaterLevel, 
    getNextThreshold, 
    getPreviousThreshold, 
    getRecipientRiskExposure 
} = require('../config/thresholds');
const { formatSalbaSmsMessage } = require('../config/smsTemplates');

async function evaluateAndDispatch(calcLog) {
    try {
        if (!calcLog) {
            console.log('[SMS Service] evaluateAndDispatch called with undefined/null calcLog.');
            return;
        }

        const { node_id, filtered_water_level } = calcLog;

        if (filtered_water_level === undefined || filtered_water_level === null) {
            console.log('[SMS Service] calcLog is missing filtered_water_level property:', calcLog);
            return;
        }

        // 1. Classify current water level threshold
        const currentClassification = classifyWaterLevel(filtered_water_level);
        const currentWaterLevelNum = currentClassification.level;

        // 2. Retrieve previous state via smsController
        const previousWaterLevelNum = await smsController.getDispatchState(node_id);

        // 3. Handle Stable Water Levels
        if (currentWaterLevelNum === previousWaterLevelNum) {
            console.log(`[SMS Service] Water level stable at Level ${currentWaterLevelNum} (${currentClassification.name}). No SMS dispatched.`);
            return;
        }

        // 4. Threshold Crossing Detected
        const isReceding = currentWaterLevelNum < previousWaterLevelNum;
        const directionStr = isReceding ? 'DOWNWARD (RECEDING)' : 'UPWARD (RISING)';
        console.log(`[SMS Service] ${directionStr} THRESHOLD CROSSING DETECTED! Previous Level: ${previousWaterLevelNum} -> New Level: ${currentWaterLevelNum} (${currentClassification.name}) at ${filtered_water_level} ft.`);

        // Lock state baseline immediately
        await smsController.updateDispatchState(node_id, currentWaterLevelNum);

        // 5. Retrieve registered recipients
        const recipients = await smsController.getRegisteredRecipients();
        if (!recipients || recipients.length === 0) {
            console.log('[SMS Service] No registered recipients found.');
            return;
        }

        const targetThresholdInfo = isReceding 
            ? getPreviousThreshold(currentWaterLevelNum)
            : getNextThreshold(currentWaterLevelNum);

        // 6. Generate bulk message payload
        const bulkMessages = [];
        const batchTrackingId = `SALBA_BATCH_${Date.now()}_L${currentWaterLevelNum}`;

        for (const recipient of recipients) {
            if (!recipient.mobile_number) continue;

            const riskExposure = getRecipientRiskExposure(currentWaterLevelNum, recipient.distance_to_node || 0);

            const templateRiskExposure = {
                exposure: riskExposure.exposure,
                priorityTier: riskExposure.priorityTier || riskExposure.priority
            };

            const messageText = formatSalbaSmsMessage(
                recipient,
                calcLog,
                currentClassification,
                targetThresholdInfo,
                templateRiskExposure
            );

            let formattedPhone = recipient.mobile_number.trim();
            if (formattedPhone.startsWith('09')) {
                formattedPhone = '+63' + formattedPhone.substring(1);
            } else if (!formattedPhone.startsWith('+63')) {
                formattedPhone = '+63' + formattedPhone;
            }

            bulkMessages.push({
                recipients: [formattedPhone],
                message: messageText
            });
        }

        if (bulkMessages.length === 0) {
            console.log('[SMS Service] No valid recipient phone numbers available.');
            return;
        }

        // 7. Insert PENDING record into sms_attempts
        const attemptId = await smsController.createPendingSmsAttempt({
            smsBatchId: batchTrackingId,
            totalRecipients: bulkMessages.length
        });

        const apiKey = process.env.TEXTBEE_API_KEY;
        const deviceId = process.env.TEXTBEE_DEVICE_ID;

        if (!apiKey || !deviceId) {
            console.error('[SMS Service Error] TEXTBEE_API_KEY or TEXTBEE_DEVICE_ID missing in env.');
            await smsController.finalizeSmsAttempt({ attemptId, success: false, apiResponse: { error: 'Missing API keys' } });
            return;
        }

        // 8. Dispatch bulk batch to TextBee API
        console.log(`[SMS Service] Dispatching bulk batch ${batchTrackingId} (${bulkMessages.length} recipients) to TextBee...`);

        let isSuccess = false;
        let apiResponseData = null;

        try {
            const response = await fetch('https://api.textbee.dev/api/v1/gateway/send-bulk-sms', {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    deviceId: deviceId,
                    messages: bulkMessages
                })
            });

            apiResponseData = await response.json();
            isSuccess = response.ok && !apiResponseData.error;
        } catch (fetchErr) {
            console.error('[SMS Service Exception] TextBee fetch failed:', fetchErr.message);
            apiResponseData = { error: fetchErr.message };
            isSuccess = false;
        }

        // 9. Finalize sms_attempts status (DELIVERED if true, FAILED if false)
        await smsController.finalizeSmsAttempt({
            attemptId,
            success: isSuccess,
            apiResponse: apiResponseData
        });

        console.log(`[SMS Service] Batch ${batchTrackingId} finalized. Status set to: ${isSuccess ? 'DELIVERED' : 'FAILED'}`);

    } catch (err) {
        console.error('[SMS Service Exception during evaluateAndDispatch]:', err.message);
    }
}

module.exports = {
    evaluateAndDispatch
};