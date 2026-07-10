const { consumer } = require('./config/kafka');
const { sendScoreNotification } = require('./services/notificationService');
require('dotenv').config();

let isRunning = false;

async function startService() {
  if (isRunning) return;
  isRunning = true;

  let connected = false;
  while (!connected && isRunning) {
    try {
      await consumer.connect();
      console.log('[Notification Service] Connected to Kafka brokers.');

      await consumer.subscribe({ topic: 'score-updated', fromBeginning: true });
      console.log("[Notification Service] Subscribed to topic 'score-updated'.");

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const rawValue = message.value.toString();
            const event = JSON.parse(rawValue);
            
            await sendScoreNotification(event);
          } catch (error) {
            console.error('[Notification Service] Error processing message:', error);
          }
        }
      });
      connected = true;
    } catch (error) {
      console.error('[Notification Service] Connection failed, retrying in 5 seconds...', error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  const shutdown = async () => {
    console.log('Shutting down Notification Service gracefully...');
    try {
      isRunning = false;
      await consumer.disconnect();
      console.log('Notification Service consumer disconnected.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Handle asynchronous group coordinator or network failures
consumer.on(consumer.events.CRASH, async (event) => {
  console.error('[Notification Service] Consumer group crashed. Reconnecting in 5s...', event.payload?.error?.message);
  isRunning = false;
  setTimeout(startService, 5000);
});

startService();
