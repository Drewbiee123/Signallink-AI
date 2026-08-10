# SignalLink AI

SignalLink AI is a secure evidence-analysis and provenance console built for SignalLink Protocol LLC.

## Phase 1 capabilities

- Grok-powered evidence analysis
- Provenance-report generation
- SignalLink AI chat
- Code review and repair
- SHA-256 input and record hashes
- Timestamped downloadable JSON receipts
- Existing anchor-creation API
- Responsive, keyboard-accessible interface

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local`:

   ```bash
   XAI_API_KEY=your_private_xai_key
   XAI_MODEL=grok-4.5
   STRIPE_SECRET_KEY=your_private_stripe_key
   STRIPE_PRICE_EVIDENCE_ANALYSIS=price_1U2hiNRoFxjovMy9bTusFnIo
   SIGNALLINK_APP_SECRET=generate_a_long_random_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

Never commit `.env.local` or expose `XAI_API_KEY` through a `NEXT_PUBLIC_` variable.

## Vercel configuration

Add these environment variables under **Project Settings → Environment Variables**:

- `XAI_API_KEY` — secret xAI API key
- `XAI_MODEL` — optional model override; defaults to `grok-4.5`
- `SIGNALINK_PRIVATE_KEY` — existing signing key for the anchor API
- `SIGNALINK_SIGNER` — optional signer identifier
- `STRIPE_SECRET_KEY` — private live/test Stripe key for server routes
- `STRIPE_PRICE_EVIDENCE_ANALYSIS` — `price_1U2hiNRoFxjovMy9bTusFnIo`
- `SIGNALLINK_APP_SECRET` — long random secret used to sign paid-access tokens
- `NEXT_PUBLIC_APP_URL` — canonical deployed URL, such as `https://your-domain.com`

Use **npm run build** as the build command.

## Security notes

The browser calls `/api/grok`. Only the server route calls xAI, so the xAI API key is never returned to the browser. Each successful response includes a locally generated receipt containing timestamps, input and record SHA-256 hashes, mode, model, origin, and a unique receipt ID.

The $49 Evidence Analysis uses Stripe-hosted Checkout. After verified payment, a signed HttpOnly access token permits one successful evidence analysis and is then consumed. Phase 1 accepts text-based files up to 2 MB. Native PDF/image extraction, persistent database storage, user authentication, rate limiting, and payments belong in later production phases.
