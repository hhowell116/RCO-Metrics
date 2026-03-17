# RCO Shopify Proxy - Setup Guide

This Cloudflare Worker sits between your dashboard and Shopify's Admin API.
It uses the OAuth Client Credentials flow — your Client ID and Secret stay
encrypted on Cloudflare, and the worker automatically gets fresh access
tokens (they expire every ~24 hours, the worker handles renewal).

---

## Prerequisites

- Node.js 18+ installed
- A Cloudflare account (free): https://dash.cloudflare.com/sign-up
- Your Shopify app's Client ID and Client Secret

---

## Step 1: Install dependencies

```bash
cd worker
npm install
```

## Step 2: Log in to Cloudflare

```bash
npx wrangler login
```

This opens a browser window. Sign in and authorize Wrangler.

## Step 3: Update wrangler.toml

Open `wrangler.toml` and replace the `ALLOWED_ORIGIN` with your GitHub Pages URL:

```toml
[vars]
SHOPIFY_STORE = "rowe-casa.myshopify.com"
ALLOWED_ORIGIN = "https://your-github-username.github.io"
```

The store domain is already set. Just update the allowed origin so only your site can call the API.

## Step 4: Set your secrets

Run these two commands and paste the values when prompted:

```bash
npx wrangler secret put SHOPIFY_CLIENT_ID
npx wrangler secret put SHOPIFY_CLIENT_SECRET
```

These are stored encrypted on Cloudflare — they never appear in your code or repo.

## Step 5: Deploy

```bash
npm run deploy
```

Wrangler will output a URL like:
`https://rco-shopify-proxy.your-account.workers.dev`

Save this URL — your dashboard will call it.

## Step 6: Test it

Visit these URLs in your browser:

1. **Health check:**
   `https://rco-shopify-proxy.YOUR.workers.dev/api/health`
   Should return: `{"status":"ok","timestamp":"...","tokenActive":true}`

2. **Order summary:**
   `https://rco-shopify-proxy.YOUR.workers.dev/api/orders/summary`
   Should return order counts by country, state, month, etc.

---

## Available Endpoints

| Endpoint | Description | Key Params |
|----------|-------------|------------|
| `/api/orders` | Full order list with line items, shipping info | `status`, `created_at_min`, `created_at_max`, `fulfillment_status` |
| `/api/orders/summary` | Aggregated counts by country, state, month + fulfillment stats | `created_at_min`, `created_at_max` |
| `/api/fulfillments` | Fulfillment rates and daily breakdown | `created_at_min`, `created_at_max` |
| `/api/health` | Health check + token status | — |

### Example queries

```
/api/orders/summary?created_at_min=2025-01-01T00:00:00Z
/api/orders?status=open&fulfillment_status=unfulfilled
/api/fulfillments?created_at_min=2025-03-01T00:00:00Z&created_at_max=2025-03-31T23:59:59Z
```

---

## How the OAuth flow works

1. Your dashboard JS calls the worker (e.g. `/api/orders/summary`)
2. The worker checks if it has a valid access token cached
3. If not (or if expired), it calls Shopify's `/admin/oauth/access_token` with your Client ID + Secret
4. Shopify returns a fresh token (good for ~24 hours)
5. The worker uses that token to call Shopify's Admin API
6. Data comes back to your dashboard

Your Client ID and Secret never leave Cloudflare's servers.

---

## Local Development

```bash
npm run dev
```

This runs the worker locally at `http://localhost:8787`.
For local dev, create a `.dev.vars` file (git-ignored) with:

```
SHOPIFY_CLIENT_ID=your-client-id-here
SHOPIFY_CLIENT_SECRET=your-client-secret-here
```

---

## Security Notes

- Client ID and Secret are stored as Cloudflare secrets (encrypted, never in code)
- Access tokens are short-lived (~24h) and auto-refreshed
- The `ALLOWED_ORIGIN` setting blocks requests from any site that isn't yours
- The worker only exposes GET requests — no one can modify your Shopify data through it
- Responses are cached for 5 minutes to reduce API calls
- The `/api/products` endpoint was removed since your app doesn't have product read access
