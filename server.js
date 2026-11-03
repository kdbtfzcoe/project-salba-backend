const express = require('express');
const cors = require('cors');
require('dotenv').config();

const webRoutes = require('./routes/webRoutes');
const hardwareRoutes = require('./routes/hardwareRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Root endpoint for browser health checks
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'online',
        system: 'Project SALBA Backend API',
        message: 'Server is up and running smoothly!',
        timestamp: new Date().toISOString()
    });
});

app.use('/api', webRoutes);
app.use('/api/hardware', hardwareRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`SALBA Backend running on port ${PORT}`);
    console.log(`Server URL: http://localhost:${PORT}`);
});

