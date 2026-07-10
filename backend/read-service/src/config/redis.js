const { Redis } = require('@upstash/redis');
// Sanitize potential placeholder values set in terminal session environment
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_URL.includes('[YOUR_INSTANCE]')) {
  delete process.env.UPSTASH_REDIS_REST_URL;
}
if (process.env.UPSTASH_REDIS_REST_TOKEN && process.env.UPSTASH_REDIS_REST_TOKEN.includes('your_upstash_token_here')) {
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
}
require('dotenv').config();

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error('CRITICAL: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variables are missing.');
  process.exit(1);
}

console.log(`Initializing Upstash Redis client: url=${url}`);

const redis = new Redis({
  url,
  token
});

module.exports = redis;
