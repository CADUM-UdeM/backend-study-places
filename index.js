const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import database connection
const { connectToDatabase } = require('./config/database');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const friendRoutes = require('./routes/friends');
const placeRoutes = require('./routes/places');
const promoRoutes = require('./routes/promos');
const reviewRoutes = require('./routes/reviews');
const sessionRoutes = require('./routes/sessions');
const notificationRoutes = require('./routes/notifications');
const savedRoutes = require('./routes/saved');
const blockRoutes = require('./routes/blocks');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req, res) => {
    res.json({
        message: 'Deja Brew API',
        version: '1.0.0',
        status: 'running'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/block', blockRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Route not found',
            code: 'NOT_FOUND'
        }
    });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
    try {
        // Connect to database
        await connectToDatabase();
        
        // Start listening
        app.listen(port, () => {
            console.log(`✅ Deja Brew API running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

startServer();