const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const VALID_REGIONS = ['asia', 'america', 'africa', 'europe', 'australia'];

function getTableName(base, region) {
  if (!region) {
    const err = new Error('Region is required');
    err.statusCode = 400;
    throw err;
  }
  const normalized = region.toLowerCase().trim();
  if (!VALID_REGIONS.includes(normalized)) {
    const err = new Error(`Invalid region. Must be one of: ${VALID_REGIONS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  return `${base}_${normalized}`;
}

async function registerUser({ username, email, password, region }) {
  const tableName = getTableName('users', region);

  // Check if username or email already exists in ANY of the regional shards
  for (const r of VALID_REGIONS) {
    const checkRes = await db.query(
      `SELECT id FROM users_${r} WHERE username = $1 OR email = $2`,
      [username, email]
    );
    if (checkRes.rows.length > 0) {
      const err = new Error('Username or email already exists');
      err.statusCode = 400;
      throw err;
    }
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Insert into DB in the specific regional shard
  const result = await db.query(
    `INSERT INTO ${tableName} (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at`,
    [username, email, passwordHash]
  );

  const savedUser = result.rows[0];
  savedUser.region = region.toLowerCase().trim(); // Attach region for response consistency
  return savedUser;
}

async function loginUser({ email, password, region }) {
  let user = null;
  let userRegion = null;

  if (region) {
    // If region is specified, query only that shard
    const tableName = getTableName('users', region);
    const result = await db.query(
      `SELECT id, username, email, password_hash FROM ${tableName} WHERE email = $1`,
      [email]
    );
    if (result.rows.length > 0) {
      user = result.rows[0];
      userRegion = region.toLowerCase().trim();
    }
  } else {
    // Sequentially search across all regional shards (auto-discovery)
    for (const r of VALID_REGIONS) {
      const result = await db.query(
        `SELECT id, username, email, password_hash FROM users_${r} WHERE email = $1`,
        [email]
      );
      if (result.rows.length > 0) {
        user = result.rows[0];
        userRegion = r;
        break;
      }
    }
  }

  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  // Generate JWT including the user's specific region shard
  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email, region: userRegion },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      region: userRegion
    }
  };
}

module.exports = {
  registerUser,
  loginUser
};
