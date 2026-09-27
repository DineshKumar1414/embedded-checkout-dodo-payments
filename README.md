# Dodo Checkout SDK demo

A demo store opens a hosted checkout in an iframe through the browser SDK. The checkout sends only outcome events to the embedding page; card fields remain in the checkout document. Payments are simulated locally—**no real payment is processed and no payment data is sent to a server**.

## Run locally

Requirements: Node.js and pnpm.

```sh
pnpm install
pnpm sdk:build
pnpm dev
```

Open `http://localhost:3000` and select **Get Northstar Pro**. The SDK is served from `/dodo-checkout.js`; its default checkout URL is `/checkout` on the SDK's origin. For a separate checkout deployment, configure `NEXT_PUBLIC_CHECKOUT_URL` to its absolute HTTPS `/checkout` URL on the demo deployment, then rebuild/redeploy the demo.

## Test cards

Use any syntactically valid email, expiry (`MM / YY`) and CVC, plus one of these card numbers:

- `4242 4242 4242 4242` — succeeds.
- `4000 0000 0000 0002` — declines.
- `4000 0000 0000 0341` — fails once; retry the same number to succeed.

These are demo-only values and do not charge a card.

## How the pieces communicate

1. The demo page calls `window.DodoCheckout.open({ productId, onSuccess, onClose, onError })` from the TypeScript SDK compiled into `public/dodo-checkout.js`.
2. The SDK creates one full-screen iframe and loads the configured checkout URL with `productId` and the embedding page's `parentOrigin` in the query string.
3. The checkout validates the supplied parent origin, then posts typed success, close, or error messages to that exact origin. The SDK accepts messages only from the iframe window and the checkout URL's origin, then calls the matching callback. It never forwards email or card fields.
4. Closing via the SDK handle removes the iframe and reports `merchant_closed`; checkout close reports `dismissed` or `completed`.

For a true cross-origin isolation boundary, deploy the demo/merchant and checkout on **different origins** (different hostname or scheme/port). Set `NEXT_PUBLIC_CHECKOUT_URL` on the demo deployment to the checkout's absolute HTTPS `/checkout` URL, and set `CHECKOUT_ALLOWED_ORIGINS` on the checkout deployment to the space-separated HTTPS merchant/demo origins that may embed it. The checkout route sends a restrictive `Content-Security-Policy: frame-ancestors 'self' ...` header; do not use a permissive wildcard in production. The SDK uses the checkout origin for `postMessage` validation. The same-origin local setup exercises the message contract but is not a production card-isolation boundary.

## Limitations

- The checkout is a sandbox simulation only. It has no payment processor or server-side validation.
- Product data is a local demo catalog with `prod_123` as its sample item.
- A deployed cross-origin setup must be tested on its actual HTTPS origins, including frame policy and browser behavior.
