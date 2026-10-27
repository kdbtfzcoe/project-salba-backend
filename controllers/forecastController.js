exports.getTimeToBreach = async (req, res, next) => {
    try {
        // Placeholder for future Open-Meteo integration
        res.status(200).json({ success: true, estimatedMinutes: 45, rateCmPerMin: 2.1 });
    } catch (error) {
        next(error);
    }
};