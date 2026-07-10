const leaderboardService = require('../services/leaderboardService');
const { rebuildCacheFromPostgres } = require('../services/rebuildService');

async function handleGetGlobalLeaderboard(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await leaderboardService.getGlobalLeaderboard(limit);
    
    return res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
}

async function handleGetRegionalLeaderboard(req, res, next) {
  try {
    const region = req.params.region;
    if (!region) {
      return res.status(400).json({
        success: false,
        message: 'Region parameter is required'
      });
    }
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await leaderboardService.getRegionalLeaderboard(region, limit);
    
    return res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
}

async function handleGetUserRank(req, res, next) {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID parameter is required'
      });
    }
    
    const rankData = await leaderboardService.getUserRank(userId);
    return res.status(200).json({
      success: true,
      data: rankData
    });
  } catch (error) {
    next(error);
  }
}

async function handleGetTopN(req, res, next) {
  try {
    const n = parseInt(req.query.n) || 10;
    const leaderboard = await leaderboardService.getGlobalLeaderboard(n);
    
    return res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
}

async function handleRebuildCache(req, res, next) {
  try {
    const adminToken = req.headers['x-rebuild-token'];
    const expectedToken = process.env.REBUILD_API_TOKEN || 'super_secret_rebuild_token_here';
    
    if (!adminToken || adminToken !== expectedToken) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid rebuild token'
      });
    }

    const result = await rebuildCacheFromPostgres();
    return res.status(200).json({
      success: true,
      message: 'Cache rebuilt successfully',
      details: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleGetGlobalLeaderboard,
  handleGetRegionalLeaderboard,
  handleGetUserRank,
  handleGetTopN,
  handleRebuildCache
};
