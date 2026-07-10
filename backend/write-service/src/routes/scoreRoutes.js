const express = require('express');
const { handleUpdateScore, handleIncrementScore, handleDecrementScore } = require('../controllers/scoreController');

const verifyToken = require('../middleware/auth');
const idempotency = require('../middleware/idempotency');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/', verifyToken, idempotency, rateLimiter, handleUpdateScore);
router.post('/increment', verifyToken, idempotency, rateLimiter, handleIncrementScore);
router.post('/decrement', verifyToken, idempotency, rateLimiter, handleDecrementScore);

module.exports = router;
