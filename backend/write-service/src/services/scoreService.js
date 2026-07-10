const db = require('../config/db');
const { sendScoreUpdatedEvent } = require('./kafkaProducerService');

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
 * Upserts a score for a user in the leaderboard database and sends a Kafka event.
 * @param {Object} scoreData
 * @param {string} scoreData.userId
 * @param {string} scoreData.region
 * @param {number} scoreData.score
 */
async function upsertScore({ userId, region, score }) {
  const userTable = getTableName('users', region);
  const leaderboardTable = getTableName('leaderboard', region);

  // First verify user exists (safety check, since user_id references users_<region>.id)
  const userCheck = await db.query(`SELECT id, username FROM ${userTable} WHERE id = $1`, [userId]);
  if (userCheck.rows.length === 0) {
    const err = new Error('User not found in specified region shard');
    err.statusCode = 404;
    throw err;
  }

  // Ensure denormalized username matches current state
  const finalUsername = userCheck.rows[0].username;

  const queryText = `
    INSERT INTO ${leaderboardTable} (user_id, username, score, updated_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      username = EXCLUDED.username,
      score = EXCLUDED.score,
      updated_at = CURRENT_TIMESTAMP
    RETURNING user_id, username, score, updated_at;
  `;

  const result = await db.query(queryText, [userId, finalUsername, score]);
  const record = result.rows[0];

  // Map to Kafka event payload
  const event = {
    userId: record.user_id,
    username: record.username,
    region: region.toLowerCase().trim(),
    score: record.score,
    updatedAt: record.updated_at.toISOString()
  };

  // Publish to Kafka topic 'score-updated'
  await sendScoreUpdatedEvent(event);

  return {
    userId: record.user_id,
    username: record.username,
    region: region.toLowerCase().trim(),
    score: record.score,
    updatedAt: record.updated_at
  };
}

async function incrementScore({ userId, region, points }) {
  const userTable = getTableName('users', region);
  const leaderboardTable = getTableName('leaderboard', region);

  // Verify user exists (safety check)
  const userCheck = await db.query(`SELECT id, username FROM ${userTable} WHERE id = $1`, [userId]);
  if (userCheck.rows.length === 0) {
    const err = new Error('User not found in specified region shard');
    err.statusCode = 404;
    throw err;
  }

  const finalUsername = userCheck.rows[0].username;

  const queryText = `
    INSERT INTO ${leaderboardTable} (user_id, username, score, updated_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      username = EXCLUDED.username,
      score = ${leaderboardTable}.score + EXCLUDED.score,
      updated_at = CURRENT_TIMESTAMP
    RETURNING user_id, username, score, updated_at;
  `;

  const result = await db.query(queryText, [userId, finalUsername, points]);
  const record = result.rows[0];

  // Map to Kafka event payload
  const event = {
    userId: record.user_id,
    username: record.username,
    region: region.toLowerCase().trim(),
    score: record.score,
    updatedAt: record.updated_at.toISOString()
  };

  // Publish to Kafka topic 'score-updated'
  await sendScoreUpdatedEvent(event);

  return {
    userId: record.user_id,
    username: record.username,
    region: region.toLowerCase().trim(),
    score: record.score,
    updatedAt: record.updated_at
  };
}

async function decrementScore({ userId, region, points }) {
  const userTable = getTableName('users', region);
  const leaderboardTable = getTableName('leaderboard', region);

  // Verify user exists (safety check)
  const userCheck = await db.query(`SELECT id, username FROM ${userTable} WHERE id = $1`, [userId]);
  if (userCheck.rows.length === 0) {
    const err = new Error('User not found in specified region shard');
    err.statusCode = 404;
    throw err;
  }

  const finalUsername = userCheck.rows[0].username;

  const queryText = `
    INSERT INTO ${leaderboardTable} (user_id, username, score, updated_at)
    VALUES ($1, $2, 0, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      username = EXCLUDED.username,
      score = GREATEST(0, ${leaderboardTable}.score - $3),
      updated_at = CURRENT_TIMESTAMP
    RETURNING user_id, username, score, updated_at;
  `;

  const result = await db.query(queryText, [userId, finalUsername, points]);
  const record = result.rows[0];

  // Map to Kafka event payload
  const event = {
    userId: record.user_id,
    username: record.username,
    region: region.toLowerCase().trim(),
    score: record.score,
    updatedAt: record.updated_at.toISOString()
  };

  // Publish to Kafka topic 'score-updated'
  await sendScoreUpdatedEvent(event);

  return {
    userId: record.user_id,
    username: record.username,
    region: region.toLowerCase().trim(),
    score: record.score,
    updatedAt: record.updated_at
  };
}

module.exports = {
  upsertScore,
  incrementScore,
  decrementScore
};
