const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { consumer } = require('./config/kafka');
const { processScoreUpdatedEvent } = require('./services/analyticsService');
const analyticsRoutes = require('./routes/analyticsRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8003;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'analytics-service' });
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('[Analytics Error Handler]', err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    success: false,
    message
  });
});

let isRunning = false;

async function startService() {
  if (isRunning) return;
  isRunning = true;

  // Start Kafka consumer in a connection retry loop
  let connected = false;
  while (!connected && isRunning) {
    try {
      await consumer.connect();
      console.log('[Analytics Service] Connected to Kafka brokers.');

      await consumer.subscribe({ topic: 'score-updated', fromBeginning: true });
      console.log("[Analytics Service] Subscribed to topic 'score-updated'.");

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const rawValue = message.value.toString();
            const event = JSON.parse(rawValue);
            
            await processScoreUpdatedEvent(event);
          } catch (error) {
            console.error('[Analytics Service] Error processing message:', error);
          }
        }
      });
      connected = true;
    } catch (error) {
      console.error('[Analytics Service] Kafka connection failed, retrying in 5 seconds...', error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Start HTTP Server
  const server = app.listen(PORT, () => {
    console.log(`Analytics Service HTTP Server running on port ${PORT}`);
  });

  const shutdown = async () => {
    console.log('Shutting down Analytics Service gracefully...');
    server.close(async () => {
      try {
        isRunning = false;
        await consumer.disconnect();
        console.log('Analytics Service consumer disconnected.');
        process.exit(0);
      } catch (err) {
        console.error('Error during consumer shutdown:', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Handle asynchronous group coordinator or network failures
consumer.on(consumer.events.CRASH, async (event) => {
  console.error('[Analytics Service] Consumer group crashed. Reconnecting in 5s...', event.payload?.error?.message);
  isRunning = false;
  setTimeout(startService, 5000);
});

startService();
