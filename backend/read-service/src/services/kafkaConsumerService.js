const { consumer } = require('../config/kafka');
const redis = require('../config/redis');

/**
 * Initializes and starts the Kafka Consumer for Read Service.
 * Listens to 'score-updated' topic and updates Upstash Redis.
 */
let isRunning = false;

/**
 * Initializes and starts the Kafka Consumer for Read Service.
 * Listens to 'score-updated' topic and updates Upstash Redis.
 */
async function startConsumer() {
  if (isRunning) return;
  isRunning = true;

  let connected = false;
  while (!connected && isRunning) {
    try {
      await consumer.connect();
      console.log('[Kafka Consumer] Connected to Kafka brokers.');

      await consumer.subscribe({ topic: 'score-updated', fromBeginning: true });
      console.log("[Kafka Consumer] Subscribed to topic 'score-updated'.");

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const rawValue = message.value.toString();
            const event = JSON.parse(rawValue);
            
            console.log(`[Kafka Consumer] Received score event: user=${event.username}, score=${event.score}, region=${event.region}`);

            const { userId, username, region, score } = event;
            
            if (!userId || !username || !region || score === undefined) {
              console.error('[Kafka Consumer] Invalid score-updated event message payload:', event);
              return;
            }

            // Pipeline Redis updates to save round-trips
            const pipeline = redis.pipeline();

            // 1. Update metadata maps
            pipeline.hset('user:usernames', { [userId]: username });
            pipeline.hset('user:regions', { [userId]: region });

            // 2. Update global and regional Sorted Sets (ZSET) using username as the member
            pipeline.zadd('leaderboard:global', { score: Number(score), member: username });
            pipeline.zadd(`leaderboard:${region}`, { score: Number(score), member: username });

            await pipeline.exec();
            console.log(`[Kafka Consumer] Redis cache sync complete for user_id=${userId}`);
          } catch (error) {
            console.error('[Kafka Consumer] Error processing individual Kafka message:', error);
          }
        }
      });
      connected = true;
    } catch (error) {
      console.error('[Kafka Consumer] Connection failed, retrying in 5 seconds...', error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function stopConsumer() {
  try {
    isRunning = false;
    await consumer.disconnect();
    console.log('[Kafka Consumer] Disconnected consumer.');
  } catch (error) {
    console.error('[Kafka Consumer] Error during consumer disconnect:', error);
  }
}

// Handle asynchronous group coordinator or network failures
consumer.on(consumer.events.CRASH, async (event) => {
  console.error('[Kafka Consumer] Consumer group crashed. Reconnecting in 5s...', event.payload?.error?.message);
  isRunning = false;
  setTimeout(startConsumer, 5000);
});

module.exports = {
  startConsumer,
  stopConsumer
};
