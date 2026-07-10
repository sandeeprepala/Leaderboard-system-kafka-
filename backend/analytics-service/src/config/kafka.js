const { Kafka } = require('kafkajs');
require('dotenv').config();

const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];
const clientId = process.env.KAFKA_CLIENT_ID || 'analytics-service';

console.log(`Initializing Kafka Consumer: clientId=${clientId}, brokers=${brokers}`);

const kafka = new Kafka({
  clientId,
  brokers
});

const consumer = kafka.consumer({
  groupId: 'analytics-service-group'
});

module.exports = {
  kafka,
  consumer
};
