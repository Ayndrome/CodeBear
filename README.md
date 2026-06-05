<div align="center">
  <img src="./public/codedolphinn.svg" alt="CodeBear Logo" width="120" height="120" />

  <h1>CodeBear</h1>
  <p><strong>Enterprise-Grade AI Code Review Platform for React, Next.js & TypeScript</strong></p>

  <p>
    <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/Redis-7.0-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis" />
    <img src="https://img.shields.io/badge/PostgreSQL-14-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/License-MIT-22C55E?style=flat-square" alt="MIT License" />
  </p>

  <p>
    <a href="#quickstart">Get Started</a> &nbsp;&bull;&nbsp;
    <a href="./docs/ARCHITECTURE.md">Architecture</a> &nbsp;&bull;&nbsp;
    <a href="./docs/DIAGRAMS.md">Diagrams</a> &nbsp;&bull;&nbsp;
    <a href="./docs/DEPLOYMENT.md">Deployment</a> &nbsp;&bull;&nbsp;
    <a href="#api">API Reference</a>
  </p>

  <br />

  <img src="./public/ss_01.png" alt="CodeBear Dashboard" width="100%" style="border-radius: 8px;" />

</div>

---

## What is CodeBear?

CodeBear connects to your GitHub repositories and automatically reviews every pull request — catching React hook mistakes, server/client boundary violations, missing image optimizations, exposed secrets, and vulnerable dependencies before they reach production.

It combines **AST-based static analysis** with **Gemini LLM intelligence** to post rich, actionable review comments directly on your PRs, complete with architecture diagrams and severity-scored findings.

---

## Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="./public/ss_02.png" alt="PR Review Comment" width="100%" />
      <p align="center"><em>Automated PR review comment with scores and diagrams</em></p>
    </td>
    <td width="50%">
      <img src="./public/ss_03.png" alt="Review Dashboard" width="100%" />
      <p align="center"><em>Repository review history and analytics</em></p>
    </td>
  </tr>
</table>

---

## Key Features

### Code Analysis
- AST-based analysis for React, Next.js, and TypeScript
- 30+ built-in rules covering hooks, server/client patterns, performance, and security
- Detects missing `useEffect` dependencies, bad image usage, and server component violations
- Custom rule engine with regex and AST pattern matching

### AI-Powered Reviews
- Gemini LLM integration for intelligent, context-aware suggestions
- Automatic PR summary generation with quality scoring (A–F)
- Four diagram types generated per review: sequence, component hierarchy, dependency graph, state flow
- Human-readable explanations alongside static findings

### Enterprise Infrastructure
- Event-driven queue system via **Inngest** with automatic retries
- Multi-layer **Redis** caching (5 min – 2 hr TTL tiers)
- Circuit breakers for GitHub API, LLM, and database
- Dead letter queue with exponential backoff for failed events
- Full **Prometheus** metrics, **OpenTelemetry** tracing, **Sentry** error tracking

### Security
- Secret scanning: AWS keys, GitHub tokens, API keys, private keys, DB credentials
- Dependency vulnerability scanning with CVE detection
- IP allowlisting with CIDR support
- RBAC, session management, and API key controls

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend API | tRPC, Node.js |
| Database | PostgreSQL + Prisma ORM |
| Cache | Redis (ioredis) |
| Queue | Inngest |
| AI | Google Gemini |
| Code Analysis | TypeScript Compiler API / typescript-estree |
| Logging | Pino (structured JSON) |
| Error Tracking | Sentry |
| Metrics | Prometheus (prom-client) |
| Tracing | OpenTelemetry |
| Hosting | Vercel + Supabase |

---

## How It Works

```
Developer opens PR on GitHub
        |
        v
GitHub sends webhook  -->  CodeBear API Gateway
                                |
                    +-----------+----------+
                    |           |          |
                 Queue       Cache       Database
               (Inngest)    (Redis)   (PostgreSQL)
                    |
                    v
          Background Job Processor
          1. Fetch changed files (GitHub API)
          2. Parse to AST
          3. Run 30+ static rules
          4. Generate LLM review + diagrams
          5. Post formatted comment to PR
```

See the full data flow in [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

---

## CI/CD Pipeline

![Jenkins pipeline run #13 — Docker build & push to ECR (16s) followed by Deploy to AWS EKS (3m 27s)](./public/jenkins.png)

Two-stage Jenkins pipeline: builds a multi-stage Docker image, pushes to AWS ECR, then rolls out to EKS with `kubectl set image` and waits for rollout completion. Full details in [DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Review Comment Output

CodeBear posts a structured Markdown comment on every PR:

```
CodeBear Review

Overall Score: C  (Issues: 3 critical, 5 high, 10 medium)

Visual Analysis
  - Sequence diagram: data flow through components
  - Component hierarchy: parent-child relationships
  - Dependency graph: import/export map
  - State flow: useState/useReducer transitions

Issues Found (3)
  [ERROR] hooks/exhaustive-deps — Missing dependency: userId (Dashboard.tsx:45)
  [WARN]  next/image — Use <Image> from next/image instead of <img> (Dashboard.tsx:62)
  [ERROR] server-component — Browser API used in Server Component (Layout.tsx:18)
```

---

<h2 id="quickstart">Quick Start</h2>

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- GitHub App credentials
- Google Gemini API key

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/codebear.git
cd codebear

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/codebear"

# Redis
REDIS_URL="redis://localhost:6379"

# GitHub App
GITHUB_CLIENT_ID="your_github_app_client_id"
GITHUB_CLIENT_SECRET="your_github_app_client_secret"
GITHUB_WEBHOOK_SECRET="your_webhook_secret"
GITHUB_APP_ID="your_app_id"
GITHUB_PRIVATE_KEY="your_private_key"

# AI
GEMINI_API_KEY="your_gemini_api_key"

# Observability (optional but recommended)
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318/v1/traces"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xxx"
```

### Run

```bash
# Setup database schema
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Connect GitHub

1. Create a GitHub App (or use a personal webhook for testing)
2. Point the webhook payload URL to `/api/webhooks/github`
3. Set content type to `application/json` and select **Pull requests** events
4. For local testing, expose your server with [ngrok](https://ngrok.com): `ngrok http 3000`

Full setup walkthrough: [QUICKSTART.md](./docs/QUICKSTART.md)

---

## Observability

CodeBear exposes standard endpoints for monitoring integration:

```bash
# Health check (database, Redis, GitHub API, memory, disk)
GET /api/health

# Kubernetes probes
GET /api/health/ready
GET /api/health/live

# Prometheus metrics scrape endpoint
GET /api/metrics
```

Logs are structured JSON via Pino with correlation IDs. Traces propagate end-to-end from webhook receipt through job completion. See [ARCHITECTURE.md](./docs/ARCHITECTURE.md#observability) for the full stack.

---

![Grafana dashboard showing node CPU/memory, pod status, HTTP request rate, review duration, GitHub API rate limit, cache hit rate, and circuit breaker states](./public/grafana_dashboard.png)

## Deployment

### Vercel (recommended)

```bash
npm i -g vercel
vercel --prod
```

Add your environment variables in the Vercel dashboard. Connect Supabase for PostgreSQL and Redis Cloud for cache.

### Docker

```bash
docker build -t codebear .
docker run -p 3000:3000 -e DATABASE_URL="..." -e REDIS_URL="..." codebear
```

### Kubernetes

Liveness and readiness probes are available at `/api/health/live` and `/api/health/ready`. A sample deployment manifest:

```yaml
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



## Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design, component breakdown, data flows, scalability patterns |
| [DIAGRAMS.md](./docs/DIAGRAMS.md) | PR diagram types: sequence, component hierarchy, dependency graph, state flow |
| [QUICKSTART.md](./docs/QUICKSTART.md) | Step-by-step local setup and GitHub webhook configuration |

---

## Performance

| Operation | Typical Time |
|---|---|
| Webhook verification | < 10 ms |
| Fetch changed files (5 files) | ~500 ms |
| AST parsing | ~100 ms |
| Static analysis (30+ rules) | ~50 ms |
| Gemini LLM review + diagrams | ~8–12 s |
| Post comment to GitHub | ~200 ms |
| **End-to-end (PR opened → comment posted)** | **~10–14 s** |

Cache hit rate target: > 80%. API response p95: < 100 ms.

---

## Contributing

```bash
# Fork, then create a feature branch
git checkout -b feature/your-feature

# Make changes, then verify
npm run lint
npm run type-check
npm run test

# Push and open a pull request
git push origin feature/your-feature
```

---

## License

[MIT](./LICENSE)

---

<div align="center">
  <img src="./public/codedolphinn.svg" alt="CodeBear" width="40" />
  <br />
  <sub>Built for teams that care about code quality</sub>
</div>