const https = require('https');

// Simple in-memory cache for FX rate with TTL
let cached = { rate: null, fetchedAt: 0 };
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function fetchRateINRtoUSD() {
  return new Promise((resolve, reject) => {
    const url = 'https://api.frankfurter.app/latest?amount=1&from=INR&to=USD';
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const rate = json?.rates?.USD;
            if (typeof rate === 'number' && rate > 0) return resolve(rate);
            return reject(new Error('No USD rate'));
          } catch (e) {
            return reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

async function getINRtoUSDRate() {
  const now = Date.now();
  if (cached.rate && now - cached.fetchedAt < TTL_MS) return cached.rate;

  // Try env override first
  const envRate = process.env.FX_RATE_INR_TO_USD;
  if (envRate && !isNaN(Number(envRate)) && Number(envRate) > 0) {
    cached = { rate: Number(envRate), fetchedAt: now };
    return cached.rate;
  }

  try {
    const rate = await fetchRateINRtoUSD();
    cached = { rate, fetchedAt: now };
    return rate;
  } catch (err) {
    // Fallback static rate (approx). Update via env when needed.
    const fallback = 0.012; // 1 INR ≈ 0.012 USD
    cached = { rate: fallback, fetchedAt: now };
    return fallback;
  }
}

async function inrToUsd(amountInInr) {
  const rate = await getINRtoUSDRate();
  const v = Number(amountInInr) || 0;
  return v * rate;
}

module.exports = { getINRtoUSDRate, inrToUsd };
