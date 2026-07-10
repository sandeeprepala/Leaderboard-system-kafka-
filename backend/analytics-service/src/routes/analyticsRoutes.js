const express = require('express');
const { handleGetUserAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/user/:userId', handleGetUserAnalytics);

module.exports = router;
