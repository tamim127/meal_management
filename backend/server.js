const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load env vars
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api', apiLimiter);

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/hostels', require('./routes/hostelRoutes'));
app.use('/api/boarders', require('./routes/boarderRoutes'));
app.use('/api/meals', require('./routes/mealRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/calculations', require('./routes/calculationRoutes'));
app.use('/api/monthly-closing', require('./routes/monthlyClosingRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Hostel Meal Management API is running', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

// Connect to database and start server
const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
        });
    } catch (error) {
        console.error('Failed to connect to database:', error.message);
        console.log('Server will continue running in degraded mode (no database connection)');

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode (DATABASE DISCONNECTED)`);
        });
    }
};

startServer();

module.exports = app;
