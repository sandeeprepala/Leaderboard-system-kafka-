const analyticsRepository = require('../repositories/analyticsRepository');
const redis = require('../config/redis');

/**
 * Polls Redis to check if the score has updated to match the event score.
 * This resolves potential race conditions between the Read Service consumer and this consumer.
 */
async function getRankAndTotalWithRetry(username, expectedScore, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const scoreInRedis = await redis.zscore('leaderboard:global', username);

    if (scoreInRedis !== null && Number(scoreInRedis) === expectedScore) {
      const rankZero = await redis.zrevrank('leaderboard:global', username);
      const totalPlayers = await redis.zcard('leaderboard:global');
      
      return {
        rank: rankZero !== null ? rankZero + 1 : null,
        totalPlayers: totalPlayers || 1
      };
    }

    // Wait 100ms before retrying
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Fallback to current Redis values if sync did not complete within the window
  const rankZero = await redis.zrevrank('leaderboard:global', username);
  const totalPlayers = await redis.zcard('leaderboard:global');
  
  return {
    rank: rankZero !== null ? rankZero + 1 : null,
    totalPlayers: totalPlayers || 1
  };
}

/**
 * Processes incoming 'score-updated' event, updates metrics, and logs information.
 * Calculates percentile rankings using Redis.
 * @param {Object} event 
 */
async function processScoreUpdatedEvent(event) {
  const { userId, username, score, updatedAt } = event;
  
  if (!userId || !username || score === undefined) {
    console.error('[Analytics Service] Invalid score-updated event message payload:', event);
    return;
  }

  console.log(`[Analytics Service] Processing event for user=${username}, score=${score}`);

  // 1. General aggregate logging
  await analyticsRepository.saveScoreUpdate(event);

  // 2. Fetch current global rank & total leaderboard size from Redis using username
  const { rank, totalPlayers } = await getRankAndTotalWithRetry(username, Number(score));

  // 3. Compute percentile ranking (top N%)
  let percentile = null;
  if (rank !== null && totalPlayers > 0) {
    percentile = Number(((rank / totalPlayers) * 100).toFixed(2));
  }

  // 4. Save detailed user history record
  await analyticsRepository.saveUserHistoryRecord(userId, username, {
    score: Number(score),
    rank,
    percentile,
    updatedAt
  });

  console.log(`[Analytics Service] Saved history snapshot for ${username}: rank=${rank}, percentile=${percentile}%`);
}

module.exports = {
  processScoreUpdatedEvent
};
