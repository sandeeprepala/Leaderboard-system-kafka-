const { producer } = require('../config/kafka');

async function connectProducer() {
  try {
    await producer.connect();
    console.log('Kafka Producer connected successfully.');
  } catch (error) {
    console.error('Failed to connect Kafka Producer:', error);
    // Exit process if Kafka is critical, or log and retry. For local dev we log.
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
