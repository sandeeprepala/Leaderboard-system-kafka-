-- 1. ASIA SHARD
CREATE TABLE IF NOT EXISTS users_asia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leaderboard_asia (
    user_id UUID PRIMARY KEY REFERENCES users_asia(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_asia_score ON leaderboard_asia(score DESC);

-- 2. AMERICA SHARD
CREATE TABLE IF NOT EXISTS users_america (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leaderboard_america (
    user_id UUID PRIMARY KEY REFERENCES users_america(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_america_score ON leaderboard_america(score DESC);

-- 3. AFRICA SHARD
CREATE TABLE IF NOT EXISTS users_africa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leaderboard_africa (
    user_id UUID PRIMARY KEY REFERENCES users_africa(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_africa_score ON leaderboard_africa(score DESC);

-- 4. EUROPE SHARD
CREATE TABLE IF NOT EXISTS users_europe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leaderboard_europe (
    user_id UUID PRIMARY KEY REFERENCES users_europe(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_europe_score ON leaderboard_europe(score DESC);

-- 5. AUSTRALIA SHARD
CREATE TABLE IF NOT EXISTS users_australia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leaderboard_australia (
    user_id UUID PRIMARY KEY REFERENCES users_australia(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_australia_score ON leaderboard_australia(score DESC);

-- 6. IDEMPOTENCY KEYS FOR DEDUPLICATION
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    response_body JSONB NOT NULL,
    status_code INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. OUTBOX TABLE FOR TRANSACTIONAL OUTBOX PATTERN
CREATE TABLE IF NOT EXISTS outbox (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type   VARCHAR(100) NOT NULL,
    topic        VARCHAR(100) NOT NULL,
    payload      JSONB NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    retry_count  INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE
);

-- Partial index: only indexes PENDING rows — makes the poll query extremely fast
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox(created_at ASC) WHERE status = 'PENDING';
