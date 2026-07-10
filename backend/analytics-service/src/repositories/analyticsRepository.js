// Analytics Repository
// Encapsulates database/in-memory storage logic for analytics.

let totalScoreUpdatesCount = 0;
const regionalScoreUpdatesCount = {};

// In-memory store for user analytics logs
// userId -> { userId, username, totalPlays, currentScore, currentRank, percentile, history: [...] }
const userAnalyticsDb = {};

/**
 * Saves a score update event record to the persistence layer.
 * @param {Object} event 
 */
async function saveScoreUpdate(event) {
  totalScoreUpdatesCount++;
  
  const { region } = event;
  if (region) {
    regionalScoreUpdatesCount[region] = (regionalScoreUpdatesCount[region] || 0) + 1;
  }
}

/**
 * Records a detailed history snapshot of user rank and score.
 * @param {string} userId
 * @param {string} username
 * @param {Object} snapshot
 * @param {number} snapshot.score
 * @param {number|null} snapshot.rank
 * @param {number|null} snapshot.percentile
 * @param {string} snapshot.updatedAt
 */
async function saveUserHistoryRecord(userId, username, { score, rank, percentile, updatedAt }) {
  if (!userAnalyticsDb[userId]) {
    userAnalyticsDb[userId] = {
      userId,
      username,
      totalPlays: 0,
      currentScore: 0,
      currentRank: null,
      percentile: null,
      history: []
    };
  }

  const userStats = userAnalyticsDb[userId];
  userStats.username = username;
  userStats.totalPlays += 1;
  userStats.currentScore = score;
  userStats.currentRank = rank;
  userStats.percentile = percentile;

  userStats.history.push({
    score,
    rank,
    percentile,
    updatedAt: updatedAt || new Date().toISOString()
  });
}

/**
 * Retrieves analytics and historical metrics for a specific user.
 * @param {string} userId
 */
async function getUserAnalytics(userId) {
  return userAnalyticsDb[userId] || null;
}

/**
 * Retrieves aggregated statistics.
 */
async function getStats() {
  return {
    totalScoreUpdatesCount,
    regionalScoreUpdatesCount
  };
}

module.exports = {
  saveScoreUpdate,
  saveUserHistoryRecord,
  getUserAnalytics,
  getStats
};
