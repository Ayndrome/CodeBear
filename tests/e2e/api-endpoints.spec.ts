import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('should reject webhook POST without signature', async ({ request }) => {
    const webhookPayload = {
      action: 'opened',
      pull_request: {
        number: 1,
        title: 'Test PR',
      },
    };

    const response = await request.post('/api/webhooks/github', {
      data: webhookPayload,
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'pull_request',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toBe('No signature');
  });

  test('should reject webhook POST with invalid signature', async ({ request }) => {
    const webhookPayload = {
      action: 'opened',
      pull_request: {
        number: 1,
        title: 'Test PR',
      },
    };

    const response = await request.post('/api/webhooks/github', {
      data: JSON.stringify(webhookPayload),
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'pull_request',
        'x-hub-signature-256': 'sha256=invalid',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toBe('Invalid signature');
  });

  test('should reject GET requests to webhook endpoint', async ({ request }) => {
    const response = await request.get('/api/webhooks/github');
    expect(response.status()).toBe(405);
  });

  test('home page should load', async ({ page }) => {
    await page.goto('/');
    expect(page.url()).toContain('localhost:3000');
  });
});
