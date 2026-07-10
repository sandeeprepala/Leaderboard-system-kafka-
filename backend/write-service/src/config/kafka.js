const { Kafka } = require('kafkajs');
require('dotenv').config();

const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];
const clientId = process.env.KAFKA_CLIENT_ID || 'write-service';

console.log(`Initializing Kafka Producer: clientId=${clientId}, brokers=${brokers}`);

const kafka = new Kafka({
  clientId,
  brokers
});

const producer = kafka.producer();

module.exports = {
  kafka,
  producer
};
