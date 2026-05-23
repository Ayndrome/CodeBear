# Architecture

CodeBear is built with enterprise-grade infrastructure patterns focused on scalability, reliability, and observability.

---

## System Overview

```
                        External Services
          +----------+   +----------+   +----------+   +----------+
          |  GitHub  |   |  Gemini  |   |  Sentry  |   |  Slack   |
          |   API    |   |   LLM    |   |  Errors  |   |  Alerts  |
          +----+-----+   +----+-----+   +----+-----+   +----+-----+
               |              |              |              |
               +----Circuit---+----Circuit---+----Error-----+
                   Breaker        Breaker      Tracking
                        |
                   +----+----+
                   |   API   |
                   | Gateway |
                   | Next.js |
                   +----+----+
                        |
          +-------------+-------------+
          |             |             |
     +----+----+   +----+----+   +---+----+
     |  Rate   |   |  Auth   |   | Retry  |
     | Limiter |   |  Layer  |   | Logic  |
     +----+----+   +----+----+   +---+----+
          |             |             |
          +-------------+-------------+
                        |
          +-------------+-------------+
          |             |             |
     +----+----+   +----+----+   +---+----+
     |  Queue  |   |  Cache  |   |   DB   |
     |(Inngest)|   | (Redis) |   |(Prisma)|
     +----+----+   +---------+   +--------+
          |
     +----+------------------------------------------+
     |              Background Jobs                  |
     |   Code Review    Secret Scan    Vuln Scan      |
     +----+------------------------------------------+
          |
     +----+------------------------------------------+
     |            Observability Stack                |
     |  Logs(Pino)  Metrics(Prom)  Traces(OTEL)      |
     +------------------------------------------------+
```

---

## Component Breakdown

### API Gateway — Next.js 15 App Router

Handles request routing, authentication, rate limiting, circuit breaker integration, and request/response logging.

Key files:
- `app/api/webhooks/github/route.ts` — GitHub webhook handler
- `app/api/inngest/route.ts` — Inngest event handler
- `app/api/health/route.ts` — Health check endpoint
- `app/api/metrics/route.ts` — Prometheus metrics

### Queue System — Inngest

Event-driven architecture for async job processing with automatic retries, event replay, and step-based execution.

Event types:
```typescript
'code-review/triggered'       // { repositoryId, prNumber, userId }
'secret-scan/triggered'       // { repositoryId, files }
'vulnerability-scan/triggered'// { repositoryId, dependencies }
'usage-analytics/tracked'     // { userId, action, metadata }
'notification/send'           // { userId, type, data }
```

Key files: `lib/queue/index.ts`, `lib/queue/functions.ts`

### Caching Layer — Redis (ioredis)

```
L1: Review results      30 min TTL
L2: Repository data      1 hr  TTL
L3: User data            2 hr  TTL
L4: GitHub API           5 min TTL
L5: LLM responses        1 hr  TTL
```

Patterns: write-through, cache-aside, automatic invalidation.

Key file: `lib/cache/index.ts`

### Database Layer — PostgreSQL + Prisma

```
Users
  |-- Sessions
  |-- ApiKeys
  |-- Organizations
        |-- Teams
        |-- Repositories
        |     |-- Reviews
        |     |-- SecretScans
        |     +-- VulnScans
        |-- IPAllowlist
        +-- DataRetentionPolicies
```

Key file: `prisma/schema.prisma`

---

## Reliability Patterns

### Circuit Breakers

States: `CLOSED` (normal) → `OPEN` (failing, reject) → `HALF_OPEN` (testing recovery)

Pre-configured:
```
github-api:  5 failures, 60s  timeout
llm-api:     3 failures, 30s  timeout
webhooks:   10 failures, 120s timeout
database:    3 failures, 10s  timeout
```

Key file: `lib/circuit-breaker/index.ts`

### Retry Logic — Exponential Backoff with Jitter

```
maxAttempts:       3
initialDelay:   1000 ms
maxDelay:      10000 ms
backoffMultiplier: 2
jitter:           true
```

Key file: `lib/retry/index.ts`

### Dead Letter Queue

Failed events are stored, scheduled for retry, and tracked through to max attempts or success.

Key file: `lib/dead-letter-queue/index.ts`

---

## Observability

### Structured Logging — Pino

```json
{
  "level": "info",
  "time": "2026-01-03T10:00:00.000Z",
  "correlationId": "uuid-1234",
  "component": "review",
  "repositoryId": "repo-123",
  "prNumber": 42,
  "msg": "Review completed"
}
```

Key file: `lib/logger/index.ts`

### Metrics — Prometheus (25+ custom metrics)

```
http_requests_total
http_request_duration_seconds
reviews_total
review_duration_seconds
github_api_calls_total
llm_tokens_used_total
cache_hits_total
circuit_breaker_state
```

Scrape endpoint: `GET /api/metrics`

### Distributed Tracing — OpenTelemetry

Single trace ID propagates: `GitHub Webhook → API Gateway → Queue → Job Processor → External APIs`

View in Jaeger UI: `http://localhost:16686`

### Alerting — Slack + PagerDuty

```
CRITICAL  -->  PagerDuty + Slack
ERROR     -->  Slack
WARNING   -->  Slack (configurable)
INFO      -->  Logs only
```

---

## Data Flow: Code Review

```
Developer opens PR
      |
      v
GitHub webhook  POST /api/webhooks/github
      |
      v
Webhook handler
  - Verify signature
  - Extract PR data
  - Check rate limit
      |
      v
Queue event: 'code-review/triggered'
      |
      v
Background job
  1. Fetch changed files (GitHub API)
  2. Parse to AST (typescript-estree)
  3. Run 30+ static rules
  4. Generate LLM review + diagrams (Gemini)
  5. Format markdown comment
      |
      v
Post comment to GitHub PR
```

## Data Flow: Error Handling

```
Error occurs
      |
      v
Circuit Breaker open?
  YES --> Reject immediately
  NO  --> Retry logic (attempts 1, 2, 3)
              |
        Success --> Continue
        Failure --> Dead Letter Queue
                        |
                        v
                   Observability
                   - Log error
                   - Track metric
                   - Send to Sentry
                   - Alert if critical
```

---

## Scalability

### Horizontal Scaling

```
            Load Balancer
       +--------+--------+
       |        |        |
  Instance1  Instance2  Instance3
       |        |        |
       +--------+--------+
                |
        +-------+-------+
        |               |
   Redis Cluster    PostgreSQL Primary
                        |
                   PostgreSQL Replicas
```

### Deployment

Production stack: **Vercel** (Next.js) + **Supabase** (PostgreSQL) + **Redis Cloud** + **Inngest Cloud**

---

## Security

```
Layer 1: Rate Limiting
  - Per-user limits
  - Per-endpoint limits
  - Sliding window algorithm
        |
Layer 2: Authentication
  - Session validation
  - API key validation
  - JWT verification
        |
Layer 3: Authorization
  - RBAC checks
  - Resource ownership
  - IP allowlist
        |
Layer 4: Input Validation
  - tRPC schema validation
  - Sanitization
  - Type checking
```

---

Back to [README](../README.md)