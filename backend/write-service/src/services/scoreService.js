const { pool } = require('../config/db');

const VALID_REGIONS = ['asia', 'america', 'africa', 'europe', 'australia'];

function getTableName(base, region) {
  if (!region) {
    const err = new Error('Region is required');
    err.statusCode = 400;
    throw err;
  }
  const normalized = region.toLowerCase().trim();
  if (!VALID_REGIONS.includes(normalized)) {
    const err = new Error(`Invalid region. Must be one of: ${VALID_REGIONS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  return `${base}_${normalized}`;
}

/**
 * Helper: inserts a PENDING event into the outbox table.
 * Must be called within an existing transaction client.
 */
async function insertOutboxEvent(client, { region, userId, username, score, updatedAt }) {
  const payload = {
    userId,
    username,
    region,
    score,
    updatedAt
  };

  await client.query(
    `INSERT INTO outbox (event_type, topic, payload)
     VALUES ($1, $2, $3)`,
    ['SCORE_UPDATED', 'score-updated', payload]
  );
}

/**
 * Atomically upserts a score and writes an outbox event in one transaction.
 */
async function upsertScore({ userId, region, score }) {
  const normalized = region.toLowerCase().trim();
  const userTable = getTableName('users', normalized);
  const leaderboardTable = getTableName('leaderboard', normalized);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify user exists
    const userCheck = await client.query(
      `SELECT id, username FROM ${userTable} WHERE id = $1`,
      [userId]
    );
    if (userCheck.rows.length === 0) {
      const err = new Error('User not found in specified region shard');
      err.statusCode = 404;
      throw err;
    }
    const finalUsername = userCheck.rows[0].username;

    // 2. Upsert score in leaderboard table
    const result = await client.query(
      `INSERT INTO ${leaderboardTable} (user_id, username, score, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id)
       DO UPDATE SET
         username = EXCLUDED.username,
         score    = EXCLUDED.score,
         updated_at = CURRENT_TIMESTAMP
       RETURNING user_id, username, score, updated_at`,
      [userId, finalUsername, score]
    );
    const record = result.rows[0];

    // 3. Insert outbox event (same transaction)
    await insertOutboxEvent(client, {
      region: normalized,
      userId: record.user_id,
      username: record.username,
      score: record.score,
      updatedAt: record.updated_at.toISOString()
    });

    await client.query('COMMIT');

    return {
      userId: record.user_id,
      username: record.username,
      region: normalized,
      score: record.score,
      updatedAt: record.updated_at
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Atomically increments a score and writes an outbox event in one transaction.
 */
async function incrementScore({ userId, region, points }) {
  const normalized = region.toLowerCase().trim();
  const userTable = getTableName('users', normalized);
  const leaderboardTable = getTableName('leaderboard', normalized);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify user exists
    const userCheck = await client.query(
      `SELECT id, username FROM ${userTable} WHERE id = $1`,
      [userId]
    );
    if (userCheck.rows.length === 0) {
      const err = new Error('User not found in specified region shard');
      err.statusCode = 404;
      throw err;
    }
    const finalUsername = userCheck.rows[0].username;

    // 2. Increment score atomically
    const result = await client.query(
      `INSERT INTO ${leaderboardTable} (user_id, username, score, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id)
       DO UPDATE SET
         username   = EXCLUDED.username,
         score      = ${leaderboardTable}.score + EXCLUDED.score,
         updated_at = CURRENT_TIMESTAMP
       RETURNING user_id, username, score, updated_at`,
      [userId, finalUsername, points]
    );
    const record = result.rows[0];

    // 3. Insert outbox event (same transaction)
    await insertOutboxEvent(client, {
      region: normalized,
      userId: record.user_id,
      username: record.username,
      score: record.score,
      updatedAt: record.updated_at.toISOString()
    });

    await client.query('COMMIT');

    return {
      userId: record.user_id,
      username: record.username,
      region: normalized,
      score: record.score,
      updatedAt: record.updated_at
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Atomically decrements a score (floor 0) and writes an outbox event in one transaction.
 */
async function decrementScore({ userId, region, points }) {
  const normalized = region.toLowerCase().trim();
  const userTable = getTableName('users', normalized);
  const leaderboardTable = getTableName('leaderboard', normalized);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify user exists
    const userCheck = await client.query(
      `SELECT id, username FROM ${userTable} WHERE id = $1`,
      [userId]
    );
    if (userCheck.rows.length === 0) {
      const err = new Error('User not found in specified region shard');
      err.statusCode = 404;
      throw err;
    }
    const finalUsername = userCheck.rows[0].username;

    // 2. Decrement score, clamped at 0
    const result = await client.query(
      `INSERT INTO ${leaderboardTable} (user_id, username, score, updated_at)
       VALUES ($1, $2, 0, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id)
       DO UPDATE SET
         username   = EXCLUDED.username,
         score      = GREATEST(0, ${leaderboardTable}.score - $3),
         updated_at = CURRENT_TIMESTAMP
       RETURNING user_id, username, score, updated_at`,
      [userId, finalUsername, points]
    );
    const record = result.rows[0];

    // 3. Insert outbox event (same transaction)
    await insertOutboxEvent(client, {
      region: normalized,
      userId: record.user_id,
      username: record.username,
      score: record.score,
      updatedAt: record.updated_at.toISOString()
    });

    await client.query('COMMIT');

    return {
      userId: record.user_id,
      username: record.username,
      region: normalized,
      score: record.score,
      updatedAt: record.updated_at
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  upsertScore,
  incrementScore,
  decrementScore
};
