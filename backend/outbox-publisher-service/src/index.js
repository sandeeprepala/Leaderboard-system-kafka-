const { Pool } = require('pg');
const { Kafka } = require('kafkajs');
require('dotenv').config();

// ─── Config ──────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS) || 1000;
const BATCH_SIZE       = parseInt(process.env.BATCH_SIZE)       || 100;

// ─── PostgreSQL ───────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ─── Kafka ────────────────────────────────────────────────────────────────────
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'outbox-publisher',
  brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092']
});

const producer = kafka.producer();

// ─── Kafka Connect (with retry loop) ─────────────────────────────────────────
async function connectProducer() {
  let connected = false;
  while (!connected) {
    try {
      await producer.connect();
      console.log('[Outbox Publisher] Kafka producer connected.');
      connected = true;
    } catch (err) {
      console.error('[Outbox Publisher] Kafka connect failed, retrying in 5s...', err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

// ─── Core Poll Cycle ──────────────────────────────────────────────────────────
async function processPendingEvents() {
  const client = await pool.connect();
  try {
    // Fetch the oldest PENDING events up to BATCH_SIZE
    const { rows } = await client.query(
      `SELECT id, event_type, topic, payload
       FROM   outbox
       WHERE  status = 'PENDING'
       ORDER  BY created_at ASC
       LIMIT  $1`,
      [BATCH_SIZE]
    );

    if (rows.length === 0) return;

    console.log(`[Outbox Publisher] Found ${rows.length} pending event(s).`);

    for (const row of rows) {
      try {
        // Publish to Kafka — key by userId for partition ordering
        await producer.send({
          topic: row.topic,
          messages: [{
            key: String(row.payload.userId || row.id),
            value: JSON.stringify(row.payload)
          }]
        });

        // Mark as SENT only after successful publish
        await client.query(
          `UPDATE outbox
           SET    status = 'SENT', published_at = NOW()
           WHERE  id = $1`,
          [row.id]
        );

        console.log(
          `[Outbox Publisher] ✓ Published event ${row.id} (${row.event_type}) → topic '${row.topic}'`
        );
      } catch (publishErr) {
        // Leave as PENDING — will be retried on the next poll cycle
        await client.query(
          `UPDATE outbox SET retry_count = retry_count + 1 WHERE id = $1`,
          [row.id]
        );
        console.error(
          `[Outbox Publisher] ✗ Failed to publish event ${row.id}:`,
          publishErr.message
        );
      }
    }
  } catch (err) {
    console.error('[Outbox Publisher] Error during poll cycle:', err.message);
  } finally {
    client.release();
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function start() {
  await connectProducer();

  console.log(`[Outbox Publisher] Poll loop started — interval: ${POLL_INTERVAL_MS}ms, batch: ${BATCH_SIZE}`);

  // Use recursive setTimeout instead of setInterval so a slow cycle
  // never overlaps with the next one
  const poll = async () => {
    await processPendingEvents();
    setTimeout(poll, POLL_INTERVAL_MS);
  };

  poll();

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[Outbox Publisher] Shutting down...');
    await producer.disconnect();
    await pool.end();
    process.exit(0);
  };

  process.on('SIGINT',  shutdown);
  process.on('SIGTERM', shutdown);
}

start();
