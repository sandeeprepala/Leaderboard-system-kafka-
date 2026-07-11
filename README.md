# Codedale — Gamified CS Leaderboard System (Transactional Outbox & Kafka Edition)

> A production-grade, event-driven microservices platform that lets students compete in Computer Science quizzes and tracks their scores across a globally sharded, real-time leaderboard. Built using the **Transactional Outbox Pattern**, Apache Kafka, PostgreSQL sharding, Upstash Redis Sorted Sets, and a React + Vite glassmorphism frontend.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Transactional Outbox Pattern](#transactional-outbox-pattern)
   - [What is the Transactional Outbox Pattern?](#what-is-the-transactional-outbox-pattern)
   - [Why use it? (Advantages)](#why-use-it-advantages)
   - [Outbox Table Schema](#outbox-table-schema)
4. [Service-by-Service Breakdown](#service-by-service-breakdown)
   - [API Gateway (Port 8000)](#api-gateway-port-8000)
   - [Write Service (Port 8001)](#write-service-port-8001)
   - [Outbox Publisher Service (Background Poll Loop)](#outbox-publisher-service-background-poll-loop)
   - [Read Service (Port 8002)](#read-service-port-8002)
   - [Analytics Service (Port 8003)](#analytics-service-port-8003)
   - [Notification Service](#notification-service)
   - [React Frontend (Port 5173)](#react-frontend-port-5173)
5. [Event-Driven Pipeline (Kafka)](#event-driven-pipeline-kafka)
6. [Database Architecture — Regional Sharding](#database-architecture--regional-sharding)
7. [Redis Caching Strategy](#redis-caching-strategy)
8. [Frontend Architecture & Page Flow](#frontend-architecture--page-flow)
9. [Key Optimizations](#key-optimizations)
10. [Key Features](#key-features)
11. [Security Model](#security-model)
12. [API Reference](#api-reference)
13. [Environment Variables](#environment-variables)
14. [Running Locally](#running-locally)
15. [Docker Compose Deployment](#docker-compose-deployment)
16. [Tech Stack Summary](#tech-stack-summary)
17. [Project Structure](#project-structure)

---

## Project Overview

**Codedale** is a full-stack web application that lets users:

1. **Register** and select a geographic **region shard** (Asia, America, Africa, Europe, Australia).
2. Take a **10-question, timed CS quiz** across domains like Data Structures, OOP, OS, Databases, and Networking.
3. Score **points per correct answer** that are committed atomically to a **regionally sharded PostgreSQL** table along with an event queue record via local transaction.
4. Climb a **real-time leaderboard** read from **Upstash Redis Sorted Sets**, synced asynchronously.
5. Inspect **performance analytics** including score progression charts, percentile rankings, and quiz attempt counts.

The system is engineered as decoupled microservices communicating via **Apache Kafka** (KRaft mode, no Zookeeper), containerised with Docker Compose, and fronted by an **API Gateway** reverse proxy.

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                               React Client (Vite)                                │
│  Landing ─ Login ─ Signup ─ Dashboard ─ Quiz ─ Leaderboard ─ Analytics ─ Profile │
└────────────────────────────────────┬─────────────────────────────────────────────┘
                                     │ HTTP/REST (Bearer JWT)
                                     ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                         API Gateway  :8000                                     │
│  http-proxy-middleware ─ JWT verify ─ Routes to downstream services            │
└───────┬──────────────────────┬──────────────────────┬──────────────────────────┘
        │ /api/auth            │ /api/scores           │ /api/leaderboard  /api/analytics
        ▼                      ▼                        ▼
┌──────────────┐   ┌──────────────────────┐   ┌──────────────────────┐  ┌────────────────────┐
│ Write Service│   │  Write Service       │   │  Read Service :8002  │  │ Analytics Svc :8003│
│   :8001      │   │  (score endpoints)   │   │                      │  │                    │
│ – Auth       │   │  – Idempotency MW    │   │  – Kafka Consumer    │  │ – Kafka Consumer   │
│ – JWT issue  │   │  – Token Bucket RL   │   │  – Redis ZSET reads  │  │ – In-mem analytics │
│ – PostgreSQL │   │  – pg Transaction    │   │  – Cache Rebuild     │  │ – Percentile calc  │
│   shards     │   │    (Score + Outbox)  │   │    (admin API)       │  │                    │
└──────────────┘   └──────────┬───────────┘   └──────────────────────┘  └────────────────────┘
                              │ Writes to
                              ▼
                   ┌──────────────────────┐
                   │  PostgreSQL (Outbox) │
                   │  status: 'PENDING'   │
                   └──────────┬───────────┘
                              │ Polls every 1s
                              ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                   Outbox Publisher Service (Background service)                │
│   Reads PENDING rows ─ Publishes to Kafka ─ Marks status as 'SENT'             │
└─────────────────────────────┬──────────────────────────────────────────────────┘
                              │ score-updated (topic)
                              ▼
                   ┌─────────────────────────┐
                   │   Apache Kafka (KRaft)   │
                   │   topic: score-updated  │
                   │   3 consumer groups     │
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

## Transactional Outbox Pattern

### What is the Transactional Outbox Pattern?

In distributed microservices, a common challenge is executing a local state change (e.g. updating a user's score in PostgreSQL) and notifying other services (e.g. publishing a `score-updated` event to Kafka) in an atomic and reliable manner. 

If a network glitch or crash occurs right after updating the database but before publishing to Kafka, downstream services like the Leaderboard Cache (Redis) and Analytics will be out of sync.

The **Transactional Outbox Pattern** solves this. Instead of publishing directly to Kafka, the Write Service uses a single local database transaction to:
1. Perform the business update (update user score in region shard).
2. Insert a record describing the event into a local `outbox` table with status `PENDING`.

A separate, independent background process (`outbox-publisher-service`) constantly polls the `outbox` table for `PENDING` events, publishes them to Kafka, and marks them as `SENT` on success.

```
Write Service ────► [ PostgreSQL ] ◄─── Polls & Publishes ───► [ Outbox Publisher ] ───► Kafka
                  ├─────────────────┤
                  │ Leaderboard     │
                  │ Outbox (Pending)│
                  └─────────────────┘
```

### Why use it? (Advantages)

* **Guaranteed Event Delivery (At-Least-Once):** Events are guaranteed to be published to Kafka if and only if the database transaction succeeds. If the broker is offline, the outbox publisher retries until it is online. No events are ever lost.
* **No Dual-Write Vulnerabilities:** Traditional dual-writes can leave the database and Kafka out of sync. Here, the database is the single source of truth.
* **Reduced Latency on Write Path:** The Write Service does not have to wait for the Kafka cluster to acknowledge the message. It completes the local DB transaction and responds to the client immediately, delegating the message publication to the background service.
* **High Resiliency:** If the publisher crashes, it picks up right where it left off, reading `PENDING` records.

### Outbox Table Schema

The `outbox` table stores the messages to be published:

```sql
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

-- Index for high-performance status polling
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox(created_at ASC) WHERE status = 'PENDING';
```

---

## Service-by-Service Breakdown

### API Gateway (Port 8000)

**File:** [`backend/api-gateway/src/server.js`](backend/api-gateway/src/server.js)

The reverse proxy and entry point for all API requests. Routes requests to the appropriate downstream microservice.

| Responsibility | Detail |
|---|---|
| **Reverse Proxy** | Routing traffic for `/api/auth`, `/api/scores`, `/api/leaderboard`, `/api/analytics` |
| **JWT Verification** | Validates incoming Bearer JWT tokens |
| **Centralized Error Handling** | Common middleware formats all 4xx/5xx responses |

---

### Write Service (Port 8001)

**File:** [`backend/write-service/src/server.js`](backend/write-service/src/server.js)

Acts as the command side of CQRS. Handles authentication and executes score mutations:

#### Score Module (`/api/scores`)
The score update endpoints (`/increment`, `/decrement`, `/upsert`) are protected by Token Bucket rate limits and Idempotency key checks. The Write Service:
1. Starts a PostgreSQL transaction.
2. Updates the regional leaderboard table (e.g. `leaderboard_asia`).
3. Inserts a `SCORE_UPDATED` event record into the `outbox` table.
4. Commits the transaction. If any step fails, the entire change rolls back.

---

### Outbox Publisher Service (Background Poll Loop)

**File:** [`backend/outbox-publisher-service/src/index.js`](backend/outbox-publisher-service/src/index.js)

An independent background daemon that runs alongside the services:
1. **Polls Outbox:** Runs a recursive timeout loop that queries `SELECT * FROM outbox WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT 100`.
2. **Publishes to Kafka:** For each row, publishes the payload to the specified topic, using the `userId` as the Kafka message key to ensure in-order partition guarantees.
3. **Updates Status:** Upon successful broker acknowledgment, updates the status to `SENT` and sets `published_at = NOW()`.
4. **Retry Loop:** If the publish fails, increments `retry_count` and leaves it as `PENDING` to be retried in the next loop.

---

### Read Service (Port 8002)

**File:** [`backend/read-service/src/server.js`](backend/read-service/src/server.js)

The query side of CQRS. Listens to Kafka's `score-updated` events and populates Upstash Redis caches, exposing sub-millisecond ranking queries.

#### Kafka Consumer
* **Consumer Group:** `read-service-group`
* Subscribes to `score-updated` topic.
* Updates Redis global ZSET (`leaderboard:global`), regional ZSETs (`leaderboard:asia`, etc.), and user metadata hashes (`user:usernames`, `user:regions`) in an atomic **Redis pipeline**.

---

### Analytics Service (Port 8003)

**File:** [`backend/analytics-service/src/server.js`](backend/analytics-service/src/server.js)

Consumes the same `score-updated` events to build user score progression logs, compute percentile rankings, and track aggregate play statistics.

* **Consumer Group:** `analytics-service-group`
* Computes user percentiles on-the-fly using Redis ZSET metadata (`ZREVRANK`, `ZCARD`).
* Stores a timestamped progression array in-memory for user progress rendering.

---

### Notification Service

**File:** [`backend/notification-service/src/server.js`](backend/notification-service/src/server.js)

A standalone background Kafka consumer (group: `notification-service-group`).
* Logs simulated notification actions (e.g., dispatching alert metrics or WS push tokens) whenever a score updates.

---

### React Frontend (Port 5173)

**File:** [`frontend/src/App.jsx`](frontend/src/App.jsx)

Dark glassmorphism SPA built with React 19, Tailwind CSS, Framer Motion, and Recharts. Includes:
* Timer-based randomly shuffled computer science quiz engine.
* Real-time global and regional leaderboard standings (4-second polling).
* Interactive SVG under-the-hood architecture routing diagram.
* Progression chart visualization & profile synchronization log.

---

## Event-Driven Pipeline (Kafka)

### Topic: `score-updated`

**Producer:** Outbox Publisher Service  
**Consumers:** Read Service, Analytics Service, Notification Service (3 separate consumer groups)

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

**Message Key:** `userId` (Guarantees that all events for a specific user end up in the same partition, preserving causal ordering).

---

## Database Architecture — Regional Sharding

**File:** [`schema.sql`](schema.sql)  
**Hosted on:** Supabase (PostgreSQL 15, AWS Sydney)

The database partitions table structures into **5 geographical region shards** (`users_asia`, `leaderboard_asia`, etc.) to simulate geographic proximity optimizations.

It also contains the `idempotency_keys` table for deduplication of client score postings, and the `outbox` table which stores transactional events awaiting publication to Kafka.

---

## Redis Caching Strategy

**Provider:** Upstash Redis (HTTP REST-based Serverless Redis)  
**Client:** `@upstash/redis`

Redis acts as the fast read layer for leaderboards. The data model uses Sorted Sets (`ZSET`) for global and regional leaderboards:

* `leaderboard:global`
* `leaderboard:asia`, `leaderboard:america`, `leaderboard:africa`, `leaderboard:europe`, `leaderboard:australia`

And hash maps (`user:usernames` and `user:regions`) for fast user profile indexing.

---

## Key Optimizations

1. **Transactional Outbox:** Write Service relies only on PostgreSQL transactions, eliminating dual-writes. Outbox publisher ensures at-least-once delivery to Kafka.
2. **Partial Poll Index:** Outbox polling uses a partial index `WHERE status = 'PENDING'` to keep `SELECT` queries extremely fast.
3. **Redis Pipeline Batching:** Read Service consumer uses a Redis pipeline to write metadata and ZSET scores in a single REST request.
4. **Token Bucket Rate Limiting:** Prevent score increment flooding at Write Service endpoint.
5. **Deduplication via Idempotency Table:** Prevent duplicate postings of quiz questions using custom idempotency headers.
6. **Kafka Partition Key:** Keying events by `userId` preserves chronological order of user score changes across partitions.

---

## Tech Stack Summary

* **Backend:** Node.js, Express, KafkaJS, `pg` (node-postgres), dotenv
* **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, Recharts, Axios, React Hot Toast
* **Infrastructure:** Apache Kafka (KRaft mode), Upstash Redis, PostgreSQL (Supabase), Docker Compose, Nginx

---

## Project Structure

```
Leaderboard System (Kafka)/
├── docker-compose.yaml          # Full stack orchestration (all 6 services)
├── schema.sql                   # SQL schema including sharded tables + outbox
├── package.json                 # Root package file for dev scripts
│
├── backend/
│   ├── api-gateway/             # Port 8000 — reverse proxy & JWT gateway
│   │
│   ├── write-service/           # Port 8001 — score mutations & outbox transaction writes
│   │   └── src/
│   │       ├── services/
│   │       │   └── scoreService.js # Atomically writes score and outbox rows
│   │
│   ├── outbox-publisher-service/# Background publisher polling outbox and writing to Kafka
│   │   └── src/
│   │       └── index.js         # Core polling recursive loop
│   │
│   ├── read-service/            # Port 8002 — updates Redis cache & reads ranking ZSETs
│   │
│   ├── analytics-service/       # Port 8003 — builds history progression & percentiles
│   │
│   └── notification-service/    # Standalone Kafka consumer logging WS/Email pushes
│
└── frontend/                    # React 19 Glassmorphism Web App
```

---

## Design Philosophy

This project showcases production-level system design patterns used to achieve resilience, performance, and scalability:

| Pattern | Where Applied |
|---|---|
| **Transactional Outbox** | Atomic score update + event logging in PostgreSQL, published asynchronously by `outbox-publisher-service` |
| **CQRS** | Read path (Redis Sorted Sets) separated from Write path (PostgreSQL shards) |
| **Event Sourcing** | Score changes are treated as events flowing through Kafka brokers |
| **Fan-out** | A single `score-updated` event is distributed to Read, Analytics, and Notification consumer groups |
| **Horizontal Sharding** | Regional table partitioning for global scaling |
| **At-Least-Once Delivery** | Offset management in Kafka consumers and status tracking in the PostgreSQL outbox table |

---

*Built by Sandeep Repala — Codedale © 2026*
