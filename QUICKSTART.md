# Quick Start

Get CodeBear running in under 5 minutes.

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- GitHub account
- Google Gemini API key

---

## Step 1 — Clone and Install

```bash
git clone https://github.com/yourusername/codebear.git
cd codebear
npm install
```

---

## Step 2 — Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

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

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
LOG_LEVEL="info"

# Optional — Observability
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xxx"
```

---

## Step 3 — Initialize Database

```bash
npx prisma generate
npx prisma db push
```

---

## Step 4 — Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Step 5 — Connect GitHub

### Option A: ngrok (local testing)

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000
# Copy the https URL, e.g. https://abc123.ngrok.io
```

### Option B: Vercel (production)

```bash
npm i -g vercel
vercel
# Add environment variables in the Vercel dashboard
```

### Configure the GitHub Webhook

1. Go to your repository: **Settings → Webhooks → Add webhook**
2. Payload URL: `https://your-url/api/webhooks/github`
3. Content type: `application/json`
4. Secret: same value as `GITHUB_WEBHOOK_SECRET` in `.env.local`
5. Events: select **Pull requests**
6. Click **Add webhook**

---

## Verify It Works

Create a test PR with intentional issues:

```tsx
// test.tsx
import { useState, useEffect } from 'react';

export default function Test({ userId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`).then(r => r.json()).then(setData);
  }, []); // Missing userId in deps array

  return <img src="/logo.png" />; // Should use next/image
}
```

CodeBear will post a review comment within ~15 seconds of the PR being opened.

---

## Troubleshooting

**`Cannot find module '@langchain/openai'`**
```bash
npm install @langchain/openai
```

**`Webhook signature verification failed`**
Make sure `GITHUB_WEBHOOK_SECRET` is identical in `.env.local` and the GitHub webhook settings.

**`Failed to fetch files from GitHub`**
Check that `GITHUB_TOKEN` or your GitHub App private key has `repo` scope and hasn't expired.

**`Gemini API error`**
Verify `GEMINI_API_KEY` is valid and your project has the Gemini API enabled in Google Cloud Console.

---

## Run Static Analysis Only (No GitHub)

```bash
npx tsx test-analyzer.ts
# Output:
# Code parsed successfully
# Found 7 issues
```

---

Back to [README](../README.md)