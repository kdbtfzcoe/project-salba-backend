exports.triggerManualOverride = async (req, res, next) => {
    try {
        const { forceLevel } = req.body;
        console.log(`Manual override triggered: ${forceLevel}`);
        res.status(200).json({ success: true, message: `System forced to ${forceLevel}` });
    } catch (error) {
        next(error);
    }
};