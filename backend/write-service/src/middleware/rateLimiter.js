// Token Bucket Rate Limiting Middleware
// Capacity: 10 tokens
// Refill Rate: 1 token every 3 seconds (0.333 tokens per second)

const BUCKET_CAPACITY = 10;
const REFILL_RATE_MS = 3000; // 1 token every 3 seconds
const tokensPerMs = 1 / REFILL_RATE_MS;

// Map to store bucket state: userId -> { tokens, lastRefill (timestamp in ms) }
const buckets = new Map();

function rateLimiter(req, res, next) {
  const userId = req.user?.id;

  if (!userId) {
    // If not authenticated, proceed (safety fallback, should be verifyToken-protected)
    return next();
  }

  const now = Date.now();
  let bucket = buckets.get(userId);

  if (!bucket) {
    // Initialize bucket to full capacity
    bucket = {
      tokens: BUCKET_CAPACITY,
      lastRefill: now
    };
  } else {
    // Calculate token refill based on elapsed time
    const elapsedMs = now - bucket.lastRefill;
    const tokensToAdd = elapsedMs * tokensPerMs;
    bucket.tokens = Math.min(BUCKET_CAPACITY, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  // Set rate limit metadata headers
  res.set('X-RateLimit-Limit', String(BUCKET_CAPACITY));

  if (bucket.tokens >= 1) {
    // Consume 1 token
    bucket.tokens -= 1;
    buckets.set(userId, bucket);

    // Calculate reset time (seconds until bucket is fully refilled)
    const missingTokens = BUCKET_CAPACITY - bucket.tokens;
    const resetTimeSec = Math.ceil(missingTokens * (REFILL_RATE_MS / 1000));

    res.set('X-RateLimit-Remaining', String(Math.floor(bucket.tokens)));
    res.set('X-RateLimit-Reset', String(resetTimeSec));
    next();
  } else {
    // Exhausted, save partial token refill state
    buckets.set(userId, bucket);

    const missingTokens = BUCKET_CAPACITY - bucket.tokens;
    const resetTimeSec = Math.ceil(missingTokens * (REFILL_RATE_MS / 1000));
    const retryAfterSec = Math.ceil((1 - bucket.tokens) * (REFILL_RATE_MS / 1000));

    res.set('X-RateLimit-Remaining', '0');
    res.set('X-RateLimit-Reset', String(resetTimeSec));
    res.set('Retry-After', String(retryAfterSec));

    return res.status(429).json({
      success: false,
      message: 'Too Many Requests: Score update rate limit exceeded. Please wait.'
    });
  }
}

module.exports = rateLimiter;
