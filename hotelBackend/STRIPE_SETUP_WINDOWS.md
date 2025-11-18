# Stripe Setup on Windows

This guide helps you configure Stripe for the backend on Windows.

## Prerequisites

- Node.js and npm installed
- Stripe account and test keys

## Environment variables

Create a `.env` file in `hotelBackend` and set at least:

```
STRIPE_SECRET_KEY=sk_test_xxx
MONGO_URI=mongodb://localhost:27017/hotels
JWT_SECRET=your-secret
```

## Run backend

From `hotelBackend/`:

```powershell
npm install
npm run dev
```

## Currency model (INR base)

- The application now stores and displays amounts in INR.
- Stripe charges and refunds are created in USD. The backend converts INR → USD at runtime for Stripe using:
	- Live rates from Frankfurter (cached for 12h), and
	- Optional static fallback from the `FX_RATE_INR_TO_USD` environment variable.

Recommended: set a stable fallback for test/dev

```powershell
$env:FX_RATE_INR_TO_USD = "0.0121"
```

Notes:
- Client sends INR amounts; do not pass a currency to the payments API.
- Refund amounts are calculated/stored in INR and converted on the server when issuing Stripe refunds.

