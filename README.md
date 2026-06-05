# 🐬 CodeDolphin

**Enterprise-Grade AI Code Review Platform for React, Next.js & TypeScript**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A production-ready code review platform with enterprise-grade infrastructure including distributed tracing, circuit breakers, dead letter queues, and comprehensive observability.

## 🌟 Highlights

- **🏗️ Enterprise Architecture**: Circuit breakers, retry logic, dead letter queues
- **📊 Full Observability**: Prometheus metrics, OpenTelemetry tracing, Sentry error tracking
- **⚡ High Performance**: Redis caching, rate limiting, queue-based processing
- **🔒 Security First**: Secret scanning, vulnerability detection, IP allowlisting
- **🤖 AI-Powered**: LLM-based code analysis with Gemini integration
- **📈 Production Ready**: Health checks, alerting, structured logging

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Infrastructure](#-infrastructure)
- [Observability](#-observability)
- [Security](#-security)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## ✨ Features

### Core Functionality

- **🔍 Static Analysis**
  - AST-based code analysis for React, Next.js, and TypeScript
  - 30+ built-in rules (hooks, server/client patterns, performance, security)
  - Custom rule engine with regex and AST matching
  - Real-time code quality metrics

- **🤖 AI-Powered Reviews**
  - LLM integration (Gemini) for intelligent code analysis
  - Automatic summary generation
  - Architecture diagram creation (Mermaid)
  - Context-aware suggestions

- **📊 GitHub Integration**
  - Automatic PR review comments
  - Webhook-based event processing
  - Multi-repository support
  - Team collaboration features

### Enterprise Infrastructure

- **⚡ Scalability**
  - Queue system with Inngest (event-driven architecture)
  - Multi-layer Redis caching strategy
  - Rate limiting with sliding window algorithm
  - Horizontal scaling support

- **🛡️ Reliability**
  - Circuit breakers for external services (GitHub, LLM, webhooks)
  - Retry logic with exponential backoff and jitter
  - Dead letter queue for failed events
  - Health checks (database, Redis, GitHub API, memory, disk)

- **📈 Observability**
  - Structured logging with Pino (JSON + correlation IDs)
  - Error tracking with Sentry (performance monitoring + session replay)
  - Prometheus metrics (25+ custom metrics)
  - Distributed tracing with OpenTelemetry
  - Alerting via Slack and PagerDuty

- **🔒 Security & Compliance**
  - Secret scanning with pattern detection
  - Vulnerability scanning for dependencies
  - IP allowlisting with CIDR support
  - Data retention policies
  - Encryption key management

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub Webhook                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (Next.js)                        │
│  • Rate Limiting  • Auth  • Routing  • Circuit Breakers         │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Queue      │    │   Cache      │    │  Database    │
│  (Inngest)   │    │  (Redis)     │    │ (PostgreSQL) │
└──────┬───────┘    └──────────────┘    └──────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                    Background Jobs                        │
│  • Code Review  • Secret Scan  • Vuln Scan  • Analytics  │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                  Observability Stack                      │
│  • Logs (Pino)  • Metrics (Prometheus)  • Traces (OTEL)  │
│  • Errors (Sentry)  • Alerts (Slack/PagerDuty)           │
└──────────────────────────────────────────────────────────┘
```

### Data Flow

1. **GitHub Webhook** → Triggers on PR events
2. **API Gateway** → Rate limiting, authentication, circuit breakers
3. **Queue System** → Async job processing with Inngest
4. **Code Analysis** → AST parsing + static rules + LLM analysis
5. **Caching Layer** → Redis for performance optimization
6. **Database** → PostgreSQL for persistent storage
7. **Observability** → Logs, metrics, traces, alerts

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Query (tRPC)

### Backend
- **Runtime**: Node.js
- **API**: tRPC (type-safe APIs)
- **Database**: PostgreSQL (Prisma ORM)
- **Cache**: Redis (ioredis)
- **Queue**: Inngest (event-driven)

### Infrastructure
- **Logging**: Pino (structured JSON logs)
- **Error Tracking**: Sentry (performance + session replay)
- **Metrics**: Prometheus (prom-client)
- **Tracing**: OpenTelemetry (OTLP exporter)
- **Alerting**: Slack + PagerDuty

### AI/ML
- **LLM**: Google Gemini
- **Code Analysis**: TypeScript Compiler API
- **Diagrams**: Mermaid.js

### DevOps
- **Hosting**: Vercel
- **Database**: Supabase / Railway
- **Monitoring**: Grafana + Jaeger
- **CI/CD**: GitHub Actions

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- GitHub App credentials

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/codedolphin.git
cd codedolphin

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Setup database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/codedolphin"

# Redis
REDIS_URL="redis://localhost:6379"

# GitHub
GITHUB_CLIENT_ID="your_github_app_client_id"
GITHUB_CLIENT_SECRET="your_github_app_client_secret"
GITHUB_WEBHOOK_SECRET="your_webhook_secret"
GITHUB_APP_ID="your_app_id"
GITHUB_PRIVATE_KEY="your_private_key"

# AI
GEMINI_API_KEY="your_gemini_api_key"

# Observability
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_TRACES_SAMPLE_RATE="0.1"
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318/v1/traces"

# Alerting
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xxx"
PAGERDUTY_INTEGRATION_KEY="your_pagerduty_key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
LOG_LEVEL="info"
```

---

## 🏗️ Infrastructure

### Queue System (Inngest)

**Event-driven architecture for async processing:**

```typescript
// Trigger code review
await triggerCodeReview({
  repositoryId: 'repo-123',
  prNumber: 42,
  userId: 'user-456'
});

// Events automatically processed in background
// - Code analysis
// - Secret scanning
// - Vulnerability scanning
// - Notification sending
```

**Features:**
- Automatic retries with exponential backoff
- Event replay for debugging
- Step-based execution
- Built-in monitoring

### Caching Strategy (Redis)

**Multi-layer caching for performance:**

```typescript
// Generic cache
await cache.set('key', data, 3600); // 1 hour TTL

// Domain-specific caches
await cacheReview(reviewId, reviewData, 1800);
await cacheRepository(repoId, repoData, 3600);
await cacheUser(userId, userData, 7200);
```

**Cache Patterns:**
- Review results (30 min)
- Repository data (1 hour)
- User data (2 hours)
- GitHub API responses (5 min)
- LLM responses (1 hour)

### Rate Limiting

**Sliding window algorithm with Redis:**

```typescript
// API rate limiting
await checkRateLimit(userId, 'api', 100, 60000); // 100 req/min

// Feature-specific limits
await checkReviewRateLimit(userId);     // 50 reviews/hour
await checkGitHubAPIRateLimit(userId);  // 1000 calls/hour
```

### Circuit Breakers

**Graceful degradation for external services:**

```typescript
// GitHub API with circuit breaker
const data = await githubCircuitBreaker.execute(() =>
  fetch('https://api.github.com/...')
);

// Pre-configured breakers:
// - GitHub API (5 failures, 1min timeout)
// - LLM API (3 failures, 30s timeout)
// - Webhooks (10 failures, 2min timeout)
// - Database (3 failures, 10s timeout)
```

### Retry Logic

**Exponential backoff with jitter:**

```typescript
// Automatic retry with backoff
const result = await retryWithBackoff(
  () => apiCall(),
  {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
  }
);

// Pre-configured strategies:
// - GitHub API: 3 attempts, 2s-10s
// - LLM API: 3 attempts, 1s-15s
// - Database: 3 attempts, 500ms-5s
```

### Dead Letter Queue

**Handle failed events:**

```typescript
// Execute with DLQ fallback
await executeWithDLQ(
  'code-review/process',
  { repositoryId, prNumber },
  () => processReview(),
  3 // max attempts
);

// Failed events stored for retry
// - Automatic retry scheduling
// - Exponential backoff (1min to 1hour)
// - Manual retry support
```

---

## 📊 Observability

### Structured Logging (Pino)

**JSON logs with correlation IDs:**

```typescript
import { createReviewLogger } from '@/lib/logger';

const log = createReviewLogger(repoId, prNumber, userId);
log.info({ event: 'review_started' });
log.error({ err: error }, 'Review failed');
```

**Output:**
```json
{
  "level": "info",
  "time": "2026-01-03T10:00:00.000Z",
  "correlationId": "uuid-1234",
  "component": "review",
  "repositoryId": "repo-123",
  "prNumber": 42,
  "userId": "user-456",
  "event": "review_started",
  "msg": "Review started"
}
```

### Error Tracking (Sentry)

**Automatic error capture with context:**

```typescript
import { captureException } from '@/lib/monitoring/sentry';

try {
  await processReview();
} catch (error) {
  captureException(error, {
    level: 'error',
    tags: { component: 'review' },
    extra: { repositoryId, prNumber },
    user: { id: userId }
  });
}
```

**Features:**
- Performance monitoring
- Session replay
- Breadcrumb trails
- Release tracking

### Metrics (Prometheus)

**25+ custom metrics:**

```typescript
import { trackReview, trackHTTPRequest } from '@/lib/monitoring/metrics';

// Track review
trackReview('owner/repo', 'completed', 5000, {
  critical: 2,
  high: 5,
  medium: 10,
  low: 3
});

// Track HTTP request
trackHTTPRequest('POST', '/api/reviews', 200, 150);
```

**Metrics Categories:**
- HTTP requests (total, duration, in-progress)
- Code reviews (total, duration, issues found)
- GitHub API (calls, duration, rate limit)
- LLM API (calls, duration, tokens)
- Database (queries, duration, connections)
- Cache (hits, misses, duration)
- Circuit breakers (state, failures)

**Access metrics:**
```bash
curl http://localhost:3000/api/metrics
```

### Distributed Tracing (OpenTelemetry)

**End-to-end request tracing:**

```typescript
import { traceCodeReview } from '@/lib/monitoring/tracing';

await traceCodeReview(repositoryId, prNumber, async () => {
  // Automatically traced
  const files = await fetchFiles();
  const analysis = await analyzeCode(files);
  const review = await generateReview(analysis);
  return review;
});
```

**View traces:**
- Jaeger UI: `http://localhost:16686`
- See complete request flow
- Identify bottlenecks
- Debug distributed issues

### Alerting (Slack/PagerDuty)

**Automatic alerts for critical events:**

```typescript
import { alertHealthCheckFailure } from '@/lib/monitoring/alerting';

// Alert on service failure
await alertHealthCheckFailure('database', 'Connection timeout');

// Alert on circuit breaker
await alertCircuitBreakerOpen('github-api', 5);
```

**Alert Routing:**
- **CRITICAL** → PagerDuty + Slack
- **ERROR** → Slack
- **WARNING** → Slack (if configured)
- **INFO** → Logs only

### Health Checks

**Monitor system health:**

```bash
# Full health check
curl http://localhost:3000/api/health

# Readiness probe (K8s)
curl http://localhost:3000/api/health/ready

# Liveness probe (K8s)
curl http://localhost:3000/api/health/live
```

**Checks:**
- Database connectivity
- Redis connectivity
- GitHub API availability
- Memory usage
- Disk space

---

## 🔒 Security

### Secret Scanning

**Detect secrets in code:**

```typescript
import { scanForSecrets } from '@/lib/services/secret-scanning-service';

const results = await scanForSecrets(repositoryId, code);
// Detects: API keys, tokens, passwords, private keys
```

**Patterns Detected:**
- AWS keys
- GitHub tokens
- API keys
- Private keys
- Database credentials
- OAuth tokens

### Vulnerability Scanning

**Scan dependencies for vulnerabilities:**

```typescript
import { scanDependencies } from '@/lib/services/vulnerability-scanning-service';

const vulns = await scanDependencies(repositoryId, packageJson);
// Returns: CVEs, severity, affected versions
```

### IP Allowlisting

**Restrict access by IP:**

```typescript
import { checkIPAllowed } from '@/lib/services/security-service';

const allowed = await checkIPAllowed(organizationId, ipAddress);
// Supports CIDR notation
```

---

## 📚 API Documentation

### tRPC Endpoints

**Type-safe API with automatic validation:**

```typescript
// Client usage
const review = await trpc.reviews.create.mutate({
  repositoryId: 'repo-123',
  prNumber: 42
});

const reviews = await trpc.reviews.list.query({
  repositoryId: 'repo-123',
  limit: 10
});
```

**Available Routers:**
- `reviews` - Code review operations
- `repositories` - Repository management
- `teams` - Team collaboration
- `analytics` - Usage analytics
- `security` - Security features
- `admin` - Admin operations

### REST Endpoints

```bash
# Webhooks
POST /api/webhooks/github      # GitHub webhook handler
POST /api/inngest               # Inngest event handler

# Health & Monitoring
GET  /api/health                # Full health check
GET  /api/health/ready          # Readiness probe
GET  /api/health/live           # Liveness probe
GET  /api/metrics               # Prometheus metrics
```

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker

```bash
# Build image
docker build -t codedolphin .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e REDIS_URL="..." \
  codedolphin
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: codedolphin
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: codedolphin
        image: codedolphin:latest
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 3000
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 3000
```

---

## 📈 Performance

### Benchmarks

- **Code Review**: < 5 seconds (average)
- **API Response**: < 100ms (p95)
- **Cache Hit Rate**: > 80%
- **Uptime**: 99.9%

### Optimizations

- Redis caching for frequently accessed data
- Queue-based async processing
- Circuit breakers prevent cascading failures
- Rate limiting protects against abuse
- Connection pooling for database

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Tests
npm run test

# Format
npm run format
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Google Gemini](https://deepmind.google/technologies/gemini/)
- Monitored with [Sentry](https://sentry.io/)
- Metrics with [Prometheus](https://prometheus.io/)
- Tracing with [OpenTelemetry](https://opentelemetry.io/)

---

## 📞 Contact

**Project Link**: [https://github.com/yourusername/codedolphin](https://github.com/yourusername/codedolphin)

**Live Demo**: [https://codedolphin.vercel.app](https://codedolphin.vercel.app)

---

<p align="center">Made with ❤️ for better code reviews</p>
