// Load environment variables FIRST
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const config = require('./config');
const initSocketHandlers = require('./socket/socketHandler');

// Route imports
const statsRoutes = require('./routes/stats.routes');
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const healthLogRoutes = require('./routes/healthLog.routes');
const adminRoutes = require('./routes/admin.routes');
const doctorRoutes = require('./routes/doctor.routes');
const notificationRoutes = require('./routes/notification.routes');
const hospitalRoutes = require('./routes/hospital.routes');

const app = express();
const server = http.createServer(app);

// Socket.IO - used for real-time notifications to the mobile patient app
const io = new Server(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
const { sendNotification } = initSocketHandlers(io);
app.set('io', io);
app.set('sendNotification', sendNotification);

// Security middleware
app.use(helmet());
app.use(cors({
  // Falls back to '*' so requests aren't blanket-blocked if FRONTEND_URL
  // is missing on the deploy platform; set FRONTEND_URL in production.
  origin: config.frontendUrl || '*',
  credentials: true,
}));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Aegis Health API is running',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Aegis API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/stats', statsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes); // duplicate '/api/patient' mount removed
app.use('/api/health-logs', healthLogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/hospitals', hospitalRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

const start = async () => {
  console.log('Starting Aegis Backend...');
  console.log(`Connecting to MongoDB at: ${config.mongoUri}`);

  try {
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB connected successfully');
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);

    server.listen(config.port, () => {
      console.log(`Aegis server running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Frontend URL: ${config.frontendUrl}`);
      console.log(`API base: http://localhost:${config.port}/api`);
      console.log('Ready for connections.');
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();

module.exports = app;
