const db = require('../config/db');

/**
 * Middleware to enforce HTTP API idempotency.
 * Expects 'Idempotency-Key' header.
 * Stores successful responses (2xx) and returns them on duplicate requests.
 * Automatically prunes expired keys older than 24 hours.
 */
async function idempotency(req, res, next) {
  const key = req.headers['idempotency-key'];
  
  if (!key) {
    return next();
  }

  try {
    // 1. Check if the key has been processed before
    const result = await db.query(
      'SELECT response_body, status_code FROM idempotency_keys WHERE key = $1',
      [key]
    );

    if (result.rows.length > 0) {
      const cached = result.rows[0];
      console.log(`[Idempotency] Cache hit for key: "${key}". Returning cached response.`);
      return res.status(cached.status_code).json(cached.response_body);
    }

    // 2. Intercept res.json to capture and save successful responses
    const originalJson = res.json;
    res.json = function (body) {
      res.json = originalJson; // Restore original function

      // Only cache successful status codes (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        db.query(
          'INSERT INTO idempotency_keys (key, response_body, status_code) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING',
          [key, body, res.statusCode]
        ).then(() => {
          // Prune keys older than 24 hours
          return db.query("DELETE FROM idempotency_keys WHERE created_at < NOW() - INTERVAL '24 hours'");
        }).catch(err => {
          console.error('[Idempotency] Error saving key or pruning:', err);
        });
      }

      return originalJson.call(this, body);
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = idempotency;
