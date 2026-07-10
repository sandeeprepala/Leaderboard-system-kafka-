const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const leaderboardRoutes = require('./routes/leaderboardRoutes');
const { startConsumer, stopConsumer } = require('./services/kafkaConsumerService');

const app = express();
const PORT = process.env.PORT || 8002;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/leaderboard', leaderboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'read-service' });
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    success: false,
    message
  });
});

// Start Server & Consumer
async function startServer() {
  // Start Kafka consumer asynchronously
  await startConsumer();

  const server = app.listen(PORT, () => {
    console.log(`Read Service running on port ${PORT}`);
  });

  const shutdown = async () => {
    console.log('Shutting down Read Service gracefully...');
    server.close(async () => {
      await stopConsumer();
      console.log('Read Service shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
