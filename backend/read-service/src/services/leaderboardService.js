const redis = require('../config/redis');

/**
 * Common formatting function for leaderboard ZSET outputs.
 * Fetches usernames associated with list of user IDs from Redis hash.
 */
async function getFormattedLeaderboard(zsetKey, limit = 10) {
  // fetch top elements sorted descending
  const result = await redis.zrange(zsetKey, 0, limit - 1, {
    rev: true,
    withScores: true
  });

  if (!result || result.length === 0) {
    return [];
  }

  const leaderboard = [];
  // result format is: [username1, score1, username2, score2, ...]
  for (let i = 0; i < result.length; i += 2) {
    leaderboard.push({
      username: result[i],
      score: Number(result[i + 1]),
      rank: Math.floor(i / 2) + 1
    });
  }

  return leaderboard;
}

/**
 * Gets global leaderboard
 */
async function getGlobalLeaderboard(limit = 10) {
  return getFormattedLeaderboard('leaderboard:global', limit);
}

/**
 * Gets regional leaderboard
 */
async function getRegionalLeaderboard(region, limit = 10) {
  return getFormattedLeaderboard(`leaderboard:${region}`, limit);
}

/**
 * Gets user rank and scores
 */
async function getUserRank(userId) {
  // Retrieve user metadata from Redis hash tables first
  const username = await redis.hget('user:usernames', userId);
  const region = await redis.hget('user:regions', userId) || 'Unknown';

  if (!username) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const globalScore = await redis.zscore('leaderboard:global', username);
  if (globalScore === null) {
    const err = new Error('User score not found on the leaderboard');
    err.statusCode = 404;
    throw err;
  }

  const globalRankZeroBased = await redis.zrevrank('leaderboard:global', username);
  const globalRank = globalRankZeroBased !== null ? globalRankZeroBased + 1 : null;

  let regionalRank = null;
  if (region !== 'Unknown') {
    const regionalRankZeroBased = await redis.zrevrank(`leaderboard:${region}`, username);
    regionalRank = regionalRankZeroBased !== null ? regionalRankZeroBased + 1 : null;
  }

  return {
    userId,
    username,
    region,
    score: Number(globalScore),
    globalRank,
    regionalRank
  };
}

module.exports = {
  getGlobalLeaderboard,
  getRegionalLeaderboard,
  getUserRank,
  getFormattedLeaderboard
};
