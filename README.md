# Codedale — Gamified CS Leaderboard System (Kafka Edition)

> A production-grade, event-driven microservices platform that lets students compete in Computer Science quizzes and tracks their scores across a globally sharded, real-time leaderboard. Built on Apache Kafka, PostgreSQL sharding, Upstash Redis Sorted Sets, and a React + Vite glassmorphism frontend.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Service-by-Service Breakdown](#service-by-service-breakdown)
   - [API Gateway (Port 8000)](#api-gateway-port-8000)
   - [Write Service (Port 8001)](#write-service-port-8001)
   - [Read Service (Port 8002)](#read-service-port-8002)
   - [Analytics Service (Port 8003)](#analytics-service-port-8003)
   - [Notification Service](#notification-service)
   - [React Frontend (Port 5173)](#react-frontend-port-5173)
4. [Event-Driven Pipeline (Kafka)](#event-driven-pipeline-kafka)
5. [Database Architecture — Regional Sharding](#database-architecture--regional-sharding)
6. [Redis Caching Strategy](#redis-caching-strategy)
7. [Frontend Architecture & Page Flow](#frontend-architecture--page-flow)
8. [Key Optimizations](#key-optimizations)
9. [Key Features](#key-features)
10. [Security Model](#security-model)
11. [API Reference](#api-reference)
12. [Environment Variables](#environment-variables)
13. [Running Locally](#running-locally)
14. [Docker Compose Deployment](#docker-compose-deployment)
15. [Tech Stack Summary](#tech-stack-summary)
16. [Project Structure](#project-structure)

---

## Project Overview

**Codedale** is a full-stack web application that lets users:

1. **Register** and select a geographic **region shard** (Asia, America, Africa, Europe, Australia).
2. Take a **10-question, timed CS quiz** across domains like Data Structures, OOP, OS, Databases, and Networking.
3. Score **points per correct answer** that are immediately written to a **regionally sharded PostgreSQL** table and published as a **Kafka event**.
4. See themselves climb a **real-time leaderboard** — read directly from **Upstash Redis Sorted Sets** — that refreshes automatically every 4 seconds.
5. Inspect deep **performance analytics** including score progression charts, percentile rankings, and quiz attempt counts.

The system is engineered as five independent Node.js microservices communicating via **Apache Kafka** (KRaft mode, no Zookeeper), containerised with Docker Compose, and fronted by an **API Gateway** reverse proxy.

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                               React Client (Vite)                                │
│  Landing ─ Login ─ Signup ─ Dashboard ─ Quiz ─ Leaderboard ─ Analytics ─ Profile│
└────────────────────────────────────┬─────────────────────────────────────────────┘
                                     │ HTTP/REST (Bearer JWT)
                                     ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                         API Gateway  :8000                                      │
│  http-proxy-middleware ─ JWT verify ─ Routes to downstream services             │
└───────┬──────────────────────┬──────────────────────┬──────────────────────────┘
        │ /api/auth            │ /api/scores           │ /api/leaderboard  /api/analytics
        ▼                      ▼                        ▼
┌──────────────┐   ┌──────────────────────┐   ┌──────────────────────┐  ┌────────────────────┐
│ Write Service│   │  Write Service        │   │  Read Service :8002  │  │ Analytics Svc :8003│
│   :8001      │   │  (score endpoints)   │   │                      │  │                    │
│ – Auth       │   │  – Idempotency MW    │   │  – Kafka Consumer    │  │ – Kafka Consumer   │
│ – JWT issue  │   │  – Token Bucket RL   │   │  – Redis ZSET reads  │  │ – In-mem analytics │
│ – PostgreSQL │   │  – PostgreSQL Upsert │   │  – Cache Rebuild     │  │ – Percentile calc  │
│   shards     │   │  – Kafka Produce     │   │    (admin API)       │  │                    │
└──────────────┘   └──────────┬───────────┘   └──────────────────────┘  └────────────────────┘
                               │ score-updated (topic)
                               ▼
                    ┌─────────────────────────┐
                    │   Apache Kafka (KRaft)   │
                    │   topic: score-updated   │
                    │   3 consumer groups      │
                    └────────────┬────────────┘
                                 │ fan-out
              ┌──────────────────┼──────────────────────┐
              ▼                  ▼                        ▼
       Read Service       Analytics Service       Notification Service
       (group: read)      (group: analytics)      (group: notification)
       Updates Redis       Logs metrics            Logs notification
       ZSET + Hashes       Computes percentile     "Notification sent"
              │
              ▼
     Upstash Redis
     leaderboard:global   (ZSET)
     leaderboard:asia     (ZSET)
     leaderboard:america  (ZSET)
     leaderboard:africa   (ZSET)
     leaderboard:europe   (ZSET)
     leaderboard:australia(ZSET)
     user:usernames       (Hash)
     user:regions         (Hash)
```

---

## Service-by-Service Breakdown

### API Gateway (Port 8000)

**File:** [`backend/api-gateway/src/server.js`](backend/api-gateway/src/server.js)

The API Gateway is the **single entry point** for the entire system. It uses `http-proxy-middleware` to act as a reverse proxy that routes client requests to the correct downstream microservice. It performs:

| Responsibility | Detail |
|---|---|
| **Reverse Proxy** | Forwards traffic to Write, Read, and Analytics services |
| **JWT Verification** (gateway-level) | `verifyJWT` middleware validates tokens for protected endpoints |
| **CORS** | Configured for cross-origin access |
| **Cookie Parsing** | Supports `cookie-parser` for both cookie and `Authorization` header tokens |
| **Centralized Error Handling** | Single `errorHandler` middleware that formats all 4xx/5xx responses |
| **Graceful Shutdown** | Listens on `SIGINT`/`SIGTERM` and closes the server cleanly |

**Routing Table:**

| Gateway Path | Downstream URL | Purpose |
|---|---|---|
| `/api/auth/*` | `write-service:8001/api/auth/*` | Register/Login |
| `/api/scores/*` | `write-service:8001/api/scores/*` | Score mutations |
| `/api/leaderboard/*` | `read-service:8002/api/leaderboard/*` | Rankings reads |
| `/api/analytics/*` | `analytics-service:8003/api/analytics/*` | User analytics |
| `GET /health` | (local) | Gateway health check |

---

### Write Service (Port 8001)

**File:** [`backend/write-service/src/server.js`](backend/write-service/src/server.js)

The Write Service is the **command side** of the CQRS (Command Query Responsibility Segregation) pattern. It owns all state mutations:

#### Auth Module (`/api/auth`)

| Endpoint | Description |
|---|---|
| `POST /api/auth/register` | Registers a user in their chosen regional shard; checks for username/email uniqueness **across all 5 shards** |
| `POST /api/auth/login` | Authenticates the user; if no region is specified, performs **sequential shard discovery** until the correct table is found |

**Auth Flow:**
1. `bcryptjs` (10 salt rounds) hashes the password before storage.
2. On login, a **JWT** is issued containing `{ id, username, email, region }` with a 24-hour expiry.
3. The JWT `region` field is critical — it pins every subsequent score mutation to the user's correct shard.

#### Score Module (`/api/scores`)

The score endpoints are protected by three middleware layers applied in order:

```
verifyToken → rateLimiter → idempotency → controller
```

| Endpoint | Description |
|---|---|
| `POST /api/scores/increment` | Adds points atomically using PostgreSQL `ON CONFLICT DO UPDATE SET score = score + EXCLUDED.score` |
| `POST /api/scores/decrement` | Subtracts points, floor-clamped at 0 using `GREATEST(0, score - $3)` |
| `POST /api/scores/upsert` | Sets the score to an absolute value |

**Kafka Production:** After every successful DB write, `sendScoreUpdatedEvent()` publishes a message to the `score-updated` topic keyed by `userId`. This ensures Kafka's **partitioned ordering** guarantees: all events for the same user land in the same partition, preserving causal ordering.

---

### Read Service (Port 8002)

**File:** [`backend/read-service/src/server.js`](backend/read-service/src/server.js)

The Read Service is the **query side** of CQRS. It **never touches PostgreSQL** for live reads — all ranking data comes from **Upstash Redis Sorted Sets**, making leaderboard queries O(log N) operations at sub-millisecond latency.

#### Kafka Consumer

On startup, it connects to Kafka and subscribes to `score-updated` (consumer group: `read-service`). For every event received:

```javascript
// Redis pipeline (atomic batch - no multiple round-trips)
pipeline.hset('user:usernames', { [userId]: username });  // Map userId → username
pipeline.hset('user:regions',   { [userId]: region   });  // Map userId → region
pipeline.zadd('leaderboard:global', { score, member: username });  // Global ZSET
pipeline.zadd(`leaderboard:${region}`, { score, member: username }); // Regional ZSET
await pipeline.exec();
```

Using a **Redis pipeline** batches all 4 commands into a single network round-trip.

#### Leaderboard Endpoints

| Endpoint | Description | Data Source |
|---|---|---|
| `GET /api/leaderboard/global?limit=N` | Top N global players | `ZREVRANGE leaderboard:global` |
| `GET /api/leaderboard/region/:region?limit=N` | Top N by region | `ZREVRANGE leaderboard:{region}` |
| `GET /api/leaderboard/user/:userId` | User's score + global rank + regional rank | `ZSCORE`, `ZREVRANK` |
| `POST /api/leaderboard/rebuild` | Admin endpoint: full Redis rebuild from PostgreSQL | DB scan → pipeline |
| `GET /api/leaderboard/top?n=N` | Alias for global top-N | `ZREVRANGE leaderboard:global` |

#### Cache Rebuild Service

The `rebuildCacheFromPostgres()` function provides **disaster recovery**: if Redis data is lost or corrupted, a single authenticated API call reads all 5 regional shards from PostgreSQL and repopulates every Redis key using a batched pipeline. This uses a direct `pg.Client` (not the pool) to avoid interfering with the Write Service's connection pool.

---

### Analytics Service (Port 8003)

**File:** [`backend/analytics-service/src/server.js`](backend/analytics-service/src/server.js)

The Analytics Service is an **independent Kafka consumer** (consumer group: `analytics-service`) that processes the same `score-updated` events as the Read Service — but for a completely different purpose: computing business intelligence metrics.

#### Processing Pipeline

For each event:
1. **Increment aggregate counters** (`totalScoreUpdatesCount`, `regionalScoreUpdatesCount`) in-memory.
2. **Retry-poll Redis** (up to 3 attempts, 100ms apart) to check if the Read Service has already synced the score. This resolves potential **inter-consumer race conditions**.
3. **Compute percentile rank**: `percentile = (rank / totalPlayers) * 100`.
4. **Store a history snapshot** in the in-memory `userAnalyticsDb` map for the user.

#### Analytics Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/analytics/user/:userId` | Returns `{ totalPlays, currentScore, currentRank, percentile, history[] }` |
| `GET /api/analytics/stats` | Aggregated system-wide event count and per-region breakdown |

> **Note:** Analytics data is currently stored in-memory (JavaScript `Map` / plain objects). Data resets on service restart. This is an intentional MVP trade-off — persistent analytics would use a time-series database (e.g., InfluxDB or TimescaleDB).

---

### Notification Service

**File:** [`backend/notification-service/src/server.js`](backend/notification-service/src/server.js)

A pure **Kafka consumer** — it has no HTTP server at all. It subscribes to `score-updated` (consumer group: `notification-service`) and simulates dispatching an email/WebSocket alert:

```
Notification sent to user {username}
[Notification Service] [Email/WS Queue] User {username} score updated to {score}. Dispatching alert.
```

This service demonstrates the **fan-out power of Kafka**: by simply starting a new consumer group, a new downstream processor gets every event without any changes to the producer or existing consumers.

All three services (Read, Analytics, Notification) implement the same **exponential-backoff reconnect loop**:
- 5-second retry on connection failure
- `CRASH` event listener re-triggers `startService()` after 5 seconds on consumer group coordinator failures

---

### React Frontend (Port 5173)

**File:** [`frontend/src/App.jsx`](frontend/src/App.jsx)

Built with **React 19 + Vite**, styled with **Tailwind CSS** (dark glassmorphism design system), animated with **Framer Motion**, and served via **Nginx** in production (Docker).

#### Page Map

| Route | Page | Auth Required |
|---|---|---|
| `/` | Landing | No |
| `/login` | Login | No |
| `/signup` | Signup | No |
| `/home` | Dashboard | ✅ Yes |
| `/quiz` | CS Quiz Engine | ✅ Yes |
| `/leaderboard` | Global & Regional Rankings | ✅ Yes |
| `/profile` | Score Sync Log & Profile | ✅ Yes |
| `/analytics` | Score Progression Chart | ✅ Yes |

**Protected Route Guard:** `<ProtectedRoute>` checks `useAuth()` — if no user is in context, redirects to `/login`. Shows a loading spinner while auth state initializes.

---

## Event-Driven Pipeline (Kafka)

The core data pipeline is powered by **Apache Kafka** running in **KRaft mode** (no Zookeeper dependency) with a single broker — sufficient for development and demonstrating the pub/sub pattern.

### Topic: `score-updated`

**Producer:** Write Service  
**Consumers:** Read Service, Analytics Service, Notification Service (3 independent consumer groups)

**Message Schema:**
```json
{
  "userId": "uuid-string",
  "username": "sandeep",
  "region": "asia",
  "score": 1200,
  "updatedAt": "2026-07-11T10:00:00.000Z"
}
```

**Message Key:** `userId` — ensures all events for a given user land in the **same partition**, maintaining per-user ordering.

### Why Kafka?

| Property | Benefit in This System |
|---|---|
| **Fan-out** | 3 consumer groups each get an independent copy of every event with zero coupling |
| **Durability** | Events are persisted to disk; consumers can replay from the beginning |
| **Decoupling** | Write Service doesn't know or care what happens downstream |
| **Ordered delivery** | User-keyed partitioning guarantees causal ordering for score updates |
| **Resilience** | Consumer group offset commits mean no event is skipped on restart |

### Kafka Configuration (docker-compose)

| Setting | Value |
|---|---|
| Mode | KRaft (combined broker + controller in one node) |
| `KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR` | 1 |
| `KAFKA_MIN_INSYNC_REPLICAS` | 1 |
| Internal broker listener | `PLAINTEXT://kafka:29092` |
| External host listener | `PLAINTEXT_HOST://localhost:9092` |
| Heap | `-Xms128m -Xmx256m` (optimized for local dev) |

---

## Database Architecture — Regional Sharding

**File:** [`schema.sql`](schema.sql)  
**Hosted on:** Supabase (PostgreSQL 15, AWS ap-southeast-2)

Rather than a single monolithic `users` and `leaderboard` table, the database is **horizontally partitioned** by geography into **5 regional shards**:

| Shard | Tables |
|---|---|
| Asia | `users_asia`, `leaderboard_asia` |
| America | `users_america`, `leaderboard_america` |
| Africa | `users_africa`, `leaderboard_africa` |
| Europe | `users_europe`, `leaderboard_europe` |
| Australia | `users_australia`, `leaderboard_australia` |

### users_{region} Schema

```sql
CREATE TABLE users_asia (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(50) UNIQUE NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### leaderboard_{region} Schema

```sql
CREATE TABLE leaderboard_asia (
    user_id    UUID PRIMARY KEY REFERENCES users_asia(id) ON DELETE CASCADE,
    username   VARCHAR(50) NOT NULL,     -- Denormalized for fast reads
    score      INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance index: all leaderboard queries ORDER BY score DESC
CREATE INDEX idx_leaderboard_asia_score ON leaderboard_asia(score DESC);
```

### Idempotency Keys Table

```sql
CREATE TABLE idempotency_keys (
    key           VARCHAR(255) PRIMARY KEY,
    response_body JSONB NOT NULL,
    status_code   INT NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Design Decisions

**Why denormalize `username` into `leaderboard_*`?**
Leaderboard reads only need `username` and `score`. Denormalizing avoids a JOIN against `users_*` on every read, turning leaderboard queries into simple `SELECT` statements.

**Why regional sharding?**
- Each shard only stores data for its region — smaller table sizes, faster index scans.
- In a production multi-region deployment, each shard would sit in the geographically closest database cluster, reducing write latency for users.
- Shard isolation: a full table-lock on `leaderboard_europe` doesn't affect `leaderboard_asia`.

**Cross-shard uniqueness check on registration:**
Since `UNIQUE` constraints don't cross tables, the auth service performs a sequential `SELECT` loop across all 5 `users_*` tables before inserting a new user, enforcing global username/email uniqueness.

---

## Redis Caching Strategy

**Provider:** [Upstash Redis](https://upstash.com/) (HTTP REST-based serverless Redis)  
**Client:** `@upstash/redis`

Upstash is used instead of a self-hosted Redis container to demonstrate production-grade cloud Redis integration. The REST-based client means no persistent TCP connection management is needed.

### Data Model

| Key | Type | Contents |
|---|---|---|
| `leaderboard:global` | Sorted Set (ZSET) | `member=username`, `score=score` |
| `leaderboard:asia` | Sorted Set | Regional subset |
| `leaderboard:america` | Sorted Set | Regional subset |
| `leaderboard:africa` | Sorted Set | Regional subset |
| `leaderboard:europe` | Sorted Set | Regional subset |
| `leaderboard:australia` | Sorted Set | Regional subset |
| `user:usernames` | Hash | `userId → username` |
| `user:regions` | Hash | `userId → region` |

### Why Sorted Sets?

Redis Sorted Sets (`ZSET`) are the **perfect data structure** for leaderboards:

| Operation | Complexity | Use Case |
|---|---|---|
| `ZADD` | O(log N) | Add/update a player's score |
| `ZREVRANGE … WITHSCORES` | O(log N + M) | Get top-M players |
| `ZREVRANK` | O(log N) | Get a player's rank |
| `ZSCORE` | O(1) | Get a player's score |
| `ZCARD` | O(1) | Total player count (for percentile) |

A query for the top 20 players takes **one ZREVRANGE command** — no SQL `ORDER BY`, no table scans. This is O(log N + 20) regardless of how many millions of players exist.

### Username as ZSET Member

The member stored in the ZSET is `username` (not `userId`). This means the leaderboard response is directly readable without a secondary lookup. `user:usernames` and `user:regions` hash maps provide reverse lookup (userId → username/region) when only a userId is available (e.g., `GET /leaderboard/user/:userId`).

---

## Frontend Architecture & Page Flow

### State Management — React Context

The app uses **4 React Contexts** instead of Redux, keeping state management lightweight:

| Context | State Managed | Key Functions |
|---|---|---|
| `AuthContext` | `user`, `loading` | `login()`, `register()`, `logout()`, `refreshUserStats()` |
| `LeaderboardContext` | `globalLeaderboard`, `regionalLeaderboard`, `loading` | `refreshLeaderboards()`, 4-second polling interval |
| `NotificationContext` | (no state, side-effects only) | Score-change toast, 25-second mock activity notifications |
| `ThemeContext` | Dark/light mode toggle | `toggleTheme()` |

### Authentication Flow

```
User enters credentials
        │
        ▼
POST /api/auth/login → API Gateway → Write Service
        │
        ▼
JWT returned → decoded client-side (no library)
        │
        ├── exp check (token still valid?)
        ├── user object constructed from payload
        └── GET /api/leaderboard/user/:id → sync score + rank
                    │
                    ▼
              user state populated
              → ProtectedRoutes unlocked
```

Tokens are stored in `localStorage` and attached via an Axios request interceptor:
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

The base URL is resolved **dynamically at runtime**: if the `window.location.hostname` is not `localhost`, it assumes Docker deployment and points to the host machine's IP on port 8000.

### Quiz Engine

The `Quiz.jsx` page is the most complex component. Its flow:

```
Component mount
  → Shuffle question pool → pick 10 random questions
  → Start 10-minute countdown timer

User selects an answer
  → isCorrect? → if YES and not already credited:
        → Generate idempotency key: "quiz-session-{startTime}-q-{questionId}"
        → POST /api/scores/increment { points: question.marks }
           (with Idempotency-Key header)
        → On success: refreshUserStats() + refreshLeaderboards()
        → Toast notification

Timer expires OR "Submit Quiz" clicked
  → Final refreshUserStats() + refreshLeaderboards()
  → Animated transition to Summary screen
```

**Idempotency key design:** `quiz-session-{sessionStartTime}-q-{questionId}` ensures that even if the user clicks the answer multiple times (e.g., rapid double-click or network retry), the score is only credited **once** for that question in that session.

### Leaderboard Polling

`LeaderboardContext` sets up a `setInterval` with 4-second frequency:
```javascript
setInterval(() => {
  fetchGlobal();
  if (user?.region) fetchRegional(user.region);
}, 4000);
```

This makes the leaderboard feel "live" without requiring WebSockets. The interval is cleaned up on component unmount.

### Page Descriptions

| Page | What It Shows | Backend Calls |
|---|---|---|
| **Landing** | Hero section, feature cards, interactive SVG architecture diagram | None |
| **Login / Signup** | Auth forms with region selector | `POST /api/auth/login` or `/register` |
| **Home (Dashboard)** | Score, global rank, regional rank, quiz attempt count; "Start CS Quiz" CTA | `GET /leaderboard/user/:id`, `GET /analytics/user/:id` |
| **Quiz** | 10-question timer quiz + live leaderboard side panel | `POST /scores/increment`, `GET /leaderboard/global`, `GET /leaderboard/region/:r` |
| **Leaderboard** | Podium (top 3) + full ranked list; global/regional tabs | `GET /leaderboard/global`, `GET /leaderboard/region/:r` |
| **Analytics** | Score progression area chart (Recharts), percentile, peak score, Kafka event count | `GET /analytics/user/:id` |
| **Profile** | User info + Score Synchronization Log (timestamped history) | `GET /analytics/user/:id` |

---

## Key Optimizations

### 1. Redis Pipeline Batching
Every Kafka event in the Read Service triggers 4 Redis operations. Instead of 4 network round-trips, all 4 commands are batched into a **single pipeline execution**:
```javascript
const pipeline = redis.pipeline();
pipeline.hset(...);
pipeline.hset(...);
pipeline.zadd('leaderboard:global', ...);
pipeline.zadd(`leaderboard:${region}`, ...);
await pipeline.exec(); // 1 round-trip instead of 4
```

### 2. Token Bucket Rate Limiting (In-Memory)
The Write Service implements a **Token Bucket** algorithm for score endpoints:
- **Capacity:** 10 tokens per user
- **Refill rate:** 1 token every 3 seconds
- **State:** In-memory `Map<userId, { tokens, lastRefill }>`
- **Headers returned:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`

This prevents score flooding without a distributed lock or external rate-limit service.

### 3. Idempotent Score Updates (PostgreSQL + Idempotency Table)
Two-layer idempotency:
- **Database level:** `INSERT ... ON CONFLICT DO UPDATE` (upsert) ensures scores are applied atomically.
- **API level:** `Idempotency-Key` header stores the full response in `idempotency_keys` table. Duplicate requests return the cached 2xx response immediately, skipping all processing. Keys are automatically pruned after 24 hours.

### 4. CQRS — Separation of Read and Write Paths
Reads never hit PostgreSQL. The Write Service writes to PostgreSQL and publishes to Kafka. The Read Service consumes Kafka and writes to Redis. Client leaderboard queries hit only Redis. This means:
- **PostgreSQL** is never under load from read traffic.
- **Redis** serves all ranking queries at microsecond speed.
- Read and Write services scale independently.

### 5. Kafka Partitioning by User ID
```javascript
await producer.send({
  topic: 'score-updated',
  messages: [{ key: event.userId, value: JSON.stringify(event) }]
});
```
Kafka routes messages with the same key to the same partition, guaranteeing that all score events for user X are processed **in order** by each consumer group. This prevents a newer score being overwritten by a lagging older event.

### 6. Crash Recovery & Reconnect Loops
All Kafka consumers implement:
```javascript
// On connection failure:
while (!connected && isRunning) {
  try { await consumer.connect(); ... }
  catch { await new Promise(r => setTimeout(r, 5000)); }
}

// On group coordinator crash:
consumer.on(consumer.events.CRASH, () => setTimeout(startService, 5000));
```

### 7. Percentile with Retry-on-Stale Cache
The Analytics Service uses a **polling retry** to avoid computing percentile on stale Redis data:
```javascript
async function getRankAndTotalWithRetry(username, expectedScore, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const scoreInRedis = await redis.zscore('leaderboard:global', username);
    if (Number(scoreInRedis) === expectedScore) return { rank, totalPlayers };
    await new Promise(r => setTimeout(r, 100)); // wait 100ms
  }
  return fallbackValues;
}
```
This resolves race conditions between the two consumers without requiring distributed locks.

### 8. Denormalized `username` in Leaderboard Tables
Leaderboard queries need only `username` and `score`. Storing `username` directly in `leaderboard_*` tables avoids a JOIN to `users_*` on every leaderboard read. When a username changes (not currently implemented), the upsert automatically updates it:
```sql
ON CONFLICT (user_id) DO UPDATE SET username = EXCLUDED.username, ...
```

### 9. Score Floor Guard (Decrement)
Prevents scores going negative:
```sql
score = GREATEST(0, leaderboard_asia.score - $3)
```

### 10. Descriptor Indexes on Score Column
Each leaderboard table has a **DESC index on `score`**:
```sql
CREATE INDEX idx_leaderboard_asia_score ON leaderboard_asia(score DESC);
```
This means `ORDER BY score DESC` queries (used in cache rebuild) are serviced by an index scan, not a full table sort.

### 11. Frontend: Skeleton Loading States
All data-heavy components (`Home`, `Analytics`, `Leaderboard`, `Profile`) render skeleton placeholder UIs while data loads, preventing layout shift and giving a premium UX impression. Implemented via reusable `<StatSkeleton>` and `<ListSkeleton>` components.

### 12. Dynamic API Base URL
The Axios client detects at runtime whether it's running on `localhost` or inside a Docker container, pointing to the correct gateway URL without environment-specific build steps.

---

## Key Features

### 🏆 Real-Time Leaderboard
- Global leaderboard ranks all players across all regions.
- Regional leaderboard shows rankings within a continent shard.
- Automatically refreshes every **4 seconds** via polling.
- Highlights the logged-in user's row with a glowing accent border.
- **Podium display** for top 3 players (gold / silver / bronze).

### 🎯 10-Question CS Quiz Engine
- Questions drawn from a **randomised pool** (shuffled on each load).
- 10-minute countdown timer with auto-submit on expiry.
- Per-question variable marks — harder questions worth more points.
- Points credited **immediately** on correct answer selection via API call.
- Idempotency prevents double-crediting on accidental double-click.
- **Live leaderboard side-panel** updates as you answer questions.

### 🌍 Geographic Regional Sharding
- 5 region choices at signup: Asia, America, Africa, Europe, Australia.
- All score writes go to the user's shard (`leaderboard_asia`, etc.).
- Regional leaderboard shows only same-region competitors.
- Region is embedded in the JWT and decoded client-side.

### 📊 Performance Analytics
- **Score Progression Area Chart** (Recharts) showing score over quiz sessions.
- **Percentile ranking** — "You are in the top X% globally."
- **Peak high score** tracker.
- **Kafka message count** — shows how many events were processed for the user.
- **Pipeline shard** indicator showing which DB shard the user's data lives in.

### 📋 Score Synchronization Log (Profile)
- Timestamped history of every score update event processed by the Analytics Service.
- Shows `score`, `rank`, and `percentile` at each snapshot.
- Demonstrates the full event pipeline: quiz answer → Kafka → Analytics → log entry.

### 🔔 Notification System
- Detects when the logged-in user's score increases and shows a toast: `🎉 Score Updated! You earned +N marks!`
- Simulated real-time activity feed every 25 seconds showing system-wide events.

### 🔐 JWT Authentication
- 24-hour JWT with region-encoded payload.
- Cookie-first, `Authorization: Bearer` fallback.
- Client-side expiry check on page load — expired tokens are cleared automatically.

### 🛡️ Admin Cache Rebuild
- `POST /api/leaderboard/rebuild` with `X-Rebuild-Token` header rebuilds all Redis ZSETs from PostgreSQL as the source of truth.
- Enables **disaster recovery** without downtime.

### 🐳 Full Docker Compose Stack
One command (`docker compose up`) brings up the entire system:
- Kafka (KRaft, single-broker)
- Write Service
- Read Service
- Analytics Service
- Notification Service
- API Gateway
- Frontend (Nginx)

---

## Security Model

| Layer | Mechanism |
|---|---|
| **Authentication** | JWT (RS256-compatible, currently HS256 with shared secret) |
| **Password Storage** | `bcryptjs` with 10 salt rounds |
| **Token transport** | Cookie-first, Bearer header fallback |
| **Score rate limiting** | Token Bucket (10 req / 30s per user) |
| **Idempotency** | 24-hour key deduplication in PostgreSQL |
| **Admin endpoints** | Separate `X-Rebuild-Token` header (not JWT) |
| **SSL (Supabase)** | `{ rejectUnauthorized: false }` in production (managed SSL by Supabase) |

---

## API Reference

### Auth Endpoints (via Gateway → Write Service)

```
POST /api/auth/register
Body: { username, email, password, region }
Response: { success, data: { id, username, email, region, created_at } }

POST /api/auth/login
Body: { email, password, region? }
Response: { success, data: { token, user: { id, username, email, region } } }
```

### Score Endpoints (Protected — JWT required)

```
POST /api/scores/increment
Headers: Authorization: Bearer <token>, Idempotency-Key: <unique-key>
Body: { points: number }
Response: { success, data: { userId, username, region, score, updatedAt } }

POST /api/scores/decrement
(same structure as increment)

POST /api/scores/upsert
Body: { userId, region, score }
Response: { success, data: { userId, username, region, score, updatedAt } }
```

### Leaderboard Endpoints (Read Service)

```
GET /api/leaderboard/global?limit=20
Response: { success, data: [{ username, score, rank }] }

GET /api/leaderboard/region/:region?limit=20
Response: { success, data: [{ username, score, rank }] }

GET /api/leaderboard/user/:userId
Response: { success, data: { userId, username, region, score, globalRank, regionalRank } }

GET /api/leaderboard/top?n=10
Response: { success, data: [{ username, score, rank }] }

POST /api/leaderboard/rebuild
Headers: X-Rebuild-Token: <token>
Response: { success, message, details: { count, regions } }
```

### Analytics Endpoints

```
GET /api/analytics/user/:userId
Response: { success, data: { userId, username, totalPlays, currentScore, currentRank, percentile, history[] } }

GET /api/analytics/stats
Response: { success, data: { totalScoreUpdatesCount, regionalScoreUpdatesCount } }
```

---

## Environment Variables

### Write Service (`.env`)

```env
PORT=8001
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@host:5432/postgres
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=write-service
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h
```

### Read Service (`.env`)

```env
PORT=8002
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=read-service
REBUILD_API_TOKEN=your_rebuild_secret
```

### Analytics Service (`.env`)

```env
PORT=8003
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=analytics-service
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

### Notification Service (`.env`)

```env
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=notification-service
```

### API Gateway (`.env`)

```env
PORT=8000
WRITE_SERVICE_URL=http://localhost:8001
READ_SERVICE_URL=http://localhost:8002
ANALYTICS_SERVICE_URL=http://localhost:8003
JWT_SECRET=your_secret_key
```

---

## Running Locally

### Prerequisites

- **Node.js** >= 18
- **Docker & Docker Compose** (for Kafka)
- **Upstash Redis** account ([upstash.com](https://upstash.com))
- **Supabase** PostgreSQL (or any PostgreSQL 14+ instance)

### Step 1 — Start Kafka

```bash
docker compose up kafka -d
```

### Step 2 — Set Up Database

Run `schema.sql` against your PostgreSQL instance to create all 11 tables (10 regional + idempotency_keys).

### Step 3 — Install Dependencies

```bash
npm run install:all
# Also install frontend:
cd frontend && npm install
```

### Step 4 — Configure Environment Variables

Copy `.env.example` files in each service directory and fill in your credentials.

### Step 5 — Start All Backend Services

```bash
# From the root directory:
npm run dev:all
```

This starts all 5 backend services concurrently with color-coded logs.

### Step 6 — Start Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173`

---

## Docker Compose Deployment

```bash
docker compose up --build
```

| Service | Port | Container Name |
|---|---|---|
| Kafka | 9092 | kafka-leaderboard |
| Write Service | 8001 | write-service |
| Read Service | 8002 | read-service |
| Analytics Service | 8003 | analytics-service |
| Notification Service | — | notification-service |
| API Gateway | 8000 | api-gateway |
| Frontend (Nginx) | 5173 | frontend-leaderboard |

The frontend Docker container serves the Vite production build via **Nginx**. The `nginx.conf` routes all requests to `index.html` (SPA fallback) and passes `/api/` requests to the API Gateway container.

---

## Tech Stack Summary

### Backend

| Technology | Role |
|---|---|
| **Node.js + Express** | All 5 microservices |
| **Apache Kafka (KRaft)** | Event streaming backbone |
| **KafkaJS** | Kafka client library |
| **PostgreSQL (Supabase)** | Persistent, sharded source of truth |
| **node-postgres (pg)** | PostgreSQL connection pool |
| **Upstash Redis** | Serverless Redis for leaderboard cache |
| **@upstash/redis** | HTTP REST Redis client |
| **bcryptjs** | Password hashing |
| **jsonwebtoken** | JWT issuance & verification |
| **http-proxy-middleware** | API Gateway reverse proxy |
| **morgan** | HTTP request logging |
| **dotenv** | Environment configuration |

### Frontend

| Technology | Role |
|---|---|
| **React 19** | UI framework |
| **Vite** | Build tool & dev server |
| **Tailwind CSS v3** | Utility-first styling |
| **Framer Motion** | Animations & page transitions |
| **React Router v7** | Client-side routing |
| **Axios** | HTTP client with interceptors |
| **Recharts** | Score progression area chart |
| **react-hot-toast** | Toast notification system |
| **react-icons (Feather)** | Icon library |

### Infrastructure

| Technology | Role |
|---|---|
| **Docker + Docker Compose** | Container orchestration |
| **Nginx** | Frontend production server |
| **Supabase** | Managed PostgreSQL |
| **Upstash** | Managed Redis |

---

## Project Structure

```
Leaderboard System (Kafka)/
├── docker-compose.yaml          # Full stack orchestration
├── schema.sql                   # All 11 PostgreSQL table definitions
├── package.json                 # Root-level npm scripts (concurrently)
│
├── backend/
│   ├── api-gateway/             # Port 8000 — reverse proxy
│   │   └── src/
│   │       ├── server.js        # Proxy routes & middleware setup
│   │       └── middleware/
│   │           ├── auth.js      # Gateway-level JWT verify
│   │           └── errorHandler.js
│   │
│   ├── write-service/           # Port 8001 — auth + score writes
│   │   └── src/
│   │       ├── server.js
│   │       ├── config/
│   │       │   ├── db.js        # pg.Pool connection
│   │       │   └── kafka.js     # KafkaJS producer
│   │       ├── middleware/
│   │       │   ├── auth.js      # JWT verify (cookie/Bearer)
│   │       │   ├── idempotency.js  # Idempotency-Key handling
│   │       │   └── rateLimiter.js  # Token Bucket rate limiter
│   │       ├── services/
│   │       │   ├── authService.js       # Register/login logic
│   │       │   ├── scoreService.js      # Upsert/increment/decrement
│   │       │   └── kafkaProducerService.js
│   │       ├── controllers/
│   │       └── routes/
│   │
│   ├── read-service/            # Port 8002 — leaderboard reads
│   │   └── src/
│   │       ├── server.js
│   │       ├── config/
│   │       │   ├── kafka.js     # KafkaJS consumer
│   │       │   └── redis.js     # Upstash Redis client
│   │       ├── services/
│   │       │   ├── kafkaConsumerService.js  # Kafka → Redis sync
│   │       │   ├── leaderboardService.js    # ZSET read operations
│   │       │   └── rebuildService.js        # PG → Redis full rebuild
│   │       ├── controllers/
│   │       └── routes/
│   │
│   ├── analytics-service/       # Port 8003 — event analytics
│   │   └── src/
│   │       ├── server.js
│   │       ├── config/
│   │       ├── repositories/
│   │       │   └── analyticsRepository.js  # In-memory analytics store
│   │       ├── services/
│   │       │   └── analyticsService.js     # Percentile calculation
│   │       ├── controllers/
│   │       └── routes/
│   │
│   └── notification-service/    # No HTTP server — pure Kafka consumer
│       └── src/
│           ├── server.js
│           ├── config/
│           └── services/
│               └── notificationService.js
│
└── frontend/                    # React 19 + Vite SPA
    └── src/
        ├── App.jsx              # Router + ProtectedRoute
        ├── main.jsx             # Context provider tree
        ├── api/
        │   ├── axios.js         # Configured Axios instance
        │   ├── auth.js          # Auth API calls
        │   ├── leaderboard.js   # Leaderboard & score API calls
        │   └── analytics.js     # Analytics API calls
        ├── context/
        │   ├── AuthContext.jsx
        │   ├── LeaderboardContext.jsx
        │   ├── NotificationContext.jsx
        │   └── ThemeContext.jsx
        ├── pages/
        │   ├── Landing.jsx
        │   ├── Login.jsx
        │   ├── Signup.jsx
        │   ├── Home.jsx
        │   ├── Quiz.jsx
        │   ├── Leaderboard.jsx
        │   ├── Analytics.jsx
        │   └── Profile.jsx
        └── components/
            ├── Navbar.jsx
            ├── Sidebar.jsx
            ├── GlassCard.jsx
            ├── Button.jsx
            ├── Loader.jsx
            └── Skeletons.jsx
```

---

## Design Philosophy

This system was built to demonstrate a set of advanced backend engineering patterns that are commonly discussed in system design interviews and used in production at scale:

| Pattern | Where Applied |
|---|---|
| **CQRS** | Write Service (PostgreSQL) vs Read Service (Redis) |
| **Event Sourcing** | All state changes flow through Kafka events |
| **Fan-out** | 1 Kafka event → 3 independent consumer groups |
| **Horizontal Sharding** | 5 regional PostgreSQL table shards |
| **Cache-Aside** | Redis rebuilt from PG on demand, kept live via Kafka |
| **Idempotency** | Database-backed 24-hour key deduplication |
| **Rate Limiting** | Token Bucket per-user in write path |
| **Graceful Shutdown** | SIGINT/SIGTERM → drain → disconnect |
| **Retry Loops** | Kafka connection with 5-second backoff |

---

*Built by Sandeep Repala — Codedale © 2026*
