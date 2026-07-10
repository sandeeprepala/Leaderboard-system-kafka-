const analyticsRepository = require('../repositories/analyticsRepository');

async function handleGetUserAnalytics(req, res, next) {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID parameter is required'
      });
    }

    const userStats = await analyticsRepository.getUserAnalytics(userId);
    if (!userStats) {
      return res.status(404).json({
        success: false,
        message: `Analytics logs not found for user ID: ${userId}`
      });
    }

    return res.status(200).json({
      success: true,
      data: userStats
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleGetUserAnalytics
};
