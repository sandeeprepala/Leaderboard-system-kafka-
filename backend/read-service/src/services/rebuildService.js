const { Client } = require('pg');
const redis = require('../config/redis');
require('dotenv').config();

/**
 * Rebuilds all Upstash Redis Sorted Sets and Hash tables using PostgreSQL as the source of truth.
 */
async function rebuildCacheFromPostgres() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is required to rebuild cache');
  }

  const pgClient = new Client({
    connectionString: dbUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await pgClient.connect();
    console.log('[Cache Rebuild] Connected to PostgreSQL database.');

    // Fetch all leaderboard entries across all sharded tables
    const shardedQuery = `
      SELECT user_id, username, 'asia' as region, score FROM leaderboard_asia
      UNION ALL
      SELECT user_id, username, 'america' as region, score FROM leaderboard_america
      UNION ALL
      SELECT user_id, username, 'africa' as region, score FROM leaderboard_africa
      UNION ALL
      SELECT user_id, username, 'europe' as region, score FROM leaderboard_europe
      UNION ALL
      SELECT user_id, username, 'australia' as region, score FROM leaderboard_australia
    `;
    const dbResult = await pgClient.query(shardedQuery);
    const rows = dbResult.rows;
    console.log(`[Cache Rebuild] Fetched ${rows.length} rows from PostgreSQL shards.`);

    // Extract unique regions to delete their corresponding sorted sets
    const regions = [...new Set(rows.map(row => row.region))];

    // Prepare list of keys to delete
    const keysToDelete = ['leaderboard:global', 'user:usernames', 'user:regions'];
    for (const region of regions) {
      keysToDelete.push(`leaderboard:${region}`);
    }

    console.log('[Cache Rebuild] Deleting existing Redis keys:', keysToDelete);
    await redis.del(...keysToDelete);

    if (rows.length === 0) {
      console.log('[Cache Rebuild] Leaderboard database is empty. Redis cleared.');
      return { count: 0, regions: [] };
    }

    // Build pipeline for batch operations
    const pipeline = redis.pipeline();

    // Map data structures for bulk hashes
    const userNamesMap = {};
    const userRegionsMap = {};

    for (const row of rows) {
      const userId = row.user_id;
      userNamesMap[userId] = row.username;
      userRegionsMap[userId] = row.region;

      // Add to global and regional ZSETs using username as the member
      pipeline.zadd('leaderboard:global', { score: row.score, member: row.username });
      pipeline.zadd(`leaderboard:${row.region}`, { score: row.score, member: row.username });
    }

    // Add hashes to pipeline
    pipeline.hset('user:usernames', userNamesMap);
    pipeline.hset('user:regions', userRegionsMap);

    console.log('[Cache Rebuild] Writing batch updates to Upstash Redis...');
    await pipeline.exec();
    console.log('[Cache Rebuild] Redis database fully rebuilt.');

    return {
      count: rows.length,
      regions
    };
  } catch (error) {
    console.error('[Cache Rebuild] Rebuild operation failed:', error);
    throw error;
  } finally {
    await pgClient.end();
  }
}

module.exports = {
  rebuildCacheFromPostgres
};
