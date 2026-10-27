exports.verifyHardware = (req, res, next) => {
    const token = req.headers['x-hardware-token'];
    if (!token || token !== process.env.HARDWARE_API_KEY) {
        return res.status(401).json({ success: false, message: 'Unauthorized ESP32 node.' });
    }
    next();
};