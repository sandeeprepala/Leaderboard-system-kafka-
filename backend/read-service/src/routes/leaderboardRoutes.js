const express = require('express');
const {
  handleGetGlobalLeaderboard,
  handleGetRegionalLeaderboard,
  handleGetUserRank,
  handleGetTopN,
  handleRebuildCache
} = require('../controllers/leaderboardController');

const router = express.Router();

router.get('/global', handleGetGlobalLeaderboard);
router.get('/region/:region', handleGetRegionalLeaderboard);
router.get('/user/:userId', handleGetUserRank);
router.get('/top', handleGetTopN);
router.post('/rebuild', handleRebuildCache);

module.exports = router;
