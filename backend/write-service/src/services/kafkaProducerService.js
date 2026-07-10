const { producer } = require('../config/kafka');

async function connectProducer() {
  let connected = false;
  while (!connected) {
    try {
      await producer.connect();
      console.log('Kafka Producer connected successfully.');
      connected = true;
    } catch (error) {
      console.error('Failed to connect Kafka Producer, retrying in 5 seconds...', error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function disconnectProducer() {
  try {
    await producer.disconnect();
    console.log('Kafka Producer disconnected.');
  } catch (error) {
    console.error('Failed to disconnect Kafka Producer:', error);
  }
}

/**
 * Publishes score-updated event to Kafka
 * @param {Object} event
 * @param {string} event.userId
 * @param {string} event.username
 * @param {string} event.region
 * @param {number} event.score
 * @param {string} event.updatedAt
 */
async function sendScoreUpdatedEvent(event) {
  try {
    await producer.send({
      topic: 'score-updated',
      messages: [
        {
          key: event.userId,
          value: JSON.stringify(event)
        }
      ]
    });
    console.log(`[Kafka Producer] Published 'score-updated' event for ${event.username} (score: ${event.score})`);
  } catch (error) {
    console.error('[Kafka Producer] Failed to send event to Kafka:', error);
    throw error;
  }
}

module.exports = {
  connectProducer,
  disconnectProducer,
  sendScoreUpdatedEvent
};
