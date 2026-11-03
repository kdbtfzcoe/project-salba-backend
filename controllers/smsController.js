// ==========================================
// controllers/smsController.js
// Project SALBA - Simplified SMS History Controller
// ==========================================

const supabase = require('../config/db');

async function getDispatchState(nodeId) {
    const { data, error } = await supabase
        .from('sms_dispatch_state')
        .select('last_dispatched_level, updated_at')
        .eq('node_id', nodeId)
        .maybeSingle();

    if (error) throw error;
    return data ? data.last_dispatched_level : 0;
}

async function updateDispatchState(nodeId, levelNum) {
    const { error } = await supabase
        .from('sms_dispatch_state')
        .upsert({
            node_id: nodeId,
            last_dispatched_level: levelNum,
            updated_at: new Date()
        }, { onConflict: 'node_id' });

    if (error) {
        console.error('[SMS Controller Error] Failed to update sms_dispatch_state:', error.message);
        throw error;
    }
}

async function getRegisteredRecipients() {
    const { data, error } = await supabase
        .from('recipients')
        .select('recipient_id, full_name, mobile_number, distance_to_node');

    if (error) throw error;
    return data || [];
}

/**
 * Creates an SMS Attempt record with PENDING status prior to sending.
 */
async function createPendingSmsAttempt({ smsBatchId, totalRecipients }) {
    const { data: attempt, error } = await supabase
        .from('sms_attempts')
        .insert({
            sms_batch_id: smsBatchId,
            delivery_status: 'PENDING',
            number_of_recipients: totalRecipients,
            attempted_at: new Date()
        })
        .select()
        .single();

    if (error) {
        console.error('[SMS Controller Error] Failed to create sms_attempts record:', error.message);
        throw error;
    }

    return attempt.attempt_id;
}

/**
 * Updates the attempt status to DELIVERED or FAILED based on TextBee API response success.
 */
async function finalizeSmsAttempt({ attemptId, success, apiResponse }) {
    const finalStatus = success ? 'DELIVERED' : 'FAILED';
    
    // Optionally grab TextBee's returned batch ID if available
    const returnedBatchId = apiResponse?.smsBatchId || apiResponse?.batchId || apiResponse?.data?.smsBatchId;

    const updatePayload = {
        delivery_status: finalStatus
    };

    if (returnedBatchId) {
        updatePayload.sms_batch_id = returnedBatchId;
    }

    const { error } = await supabase
        .from('sms_attempts')
        .update(updatePayload)
        .eq('attempt_id', attemptId);

    if (error) {
        console.error('[SMS Controller Error] Failed to finalize sms_attempts status:', error.message);
    }
}

// Frontend History Endpoints
async function getAllAttempts(req, res) {
    try {
        const { data, error } = await supabase
            .from('sms_attempts')
            .select('*')
            .order('attempted_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}

async function getAttemptById(req, res) {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('sms_attempts')
            .select('*')
            .eq('attempt_id', id)
            .single();

        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = {
    getDispatchState,
    updateDispatchState,
    getRegisteredRecipients,
    createPendingSmsAttempt,
    finalizeSmsAttempt,
    getAllAttempts,
    getAttemptById
};