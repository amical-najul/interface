const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Middleware
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:8090',
    'http://localhost:8080'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// Basic Health Check
app.get('/', (req, res) => {
    res.send('API Backend Running');
});

// Error Middleware
app.use(errorHandler);

module.exports = app;
