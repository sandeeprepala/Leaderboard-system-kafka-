const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const db = require('./config/db');

const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 8001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'write-service' });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ success: false, message });
});

// Start service
async function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`Write Service running on port ${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down Write Service gracefully...');
    server.close(async () => {
      await db.pool.end();
      console.log('Write Service shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
