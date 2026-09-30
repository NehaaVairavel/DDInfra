import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

/* ── Default fallback rates (if fetch fails) ── */
const FALLBACK_RATES = { USD: 1, AED: 3.67, EUR: 0.92, INR: 83.5 };

export const CURRENCY_META = {
  USD: { symbol: '$',   flag: '🇺🇸', label: 'US Dollar' },
  AED: { symbol: 'AED', flag: '🇦🇪', label: 'UAE Dirham' },
  EUR: { symbol: '€',   flag: '🇪🇺', label: 'Euro' },
  INR: { symbol: '₹',   flag: '🇮🇳', label: 'Indian Rupee' },
};

const CACHE_KEY   = 'ddinfra_fx_rates';
const CACHE_TS    = 'ddinfra_fx_ts';
const TTL_MS      = 24 * 60 * 60 * 1000; // 24 hours

/* ── Fetch live rates from open.er-api.com (free, no key needed) ── */
async function fetchLiveRates() {
  const res  = await fetch('https://open.er-api.com/v6/latest/USD');
  const data = await res.json();
  if (data.result !== 'success') throw new Error('API error');
  return {
    USD: 1,
    AED: data.rates.AED,
    EUR: data.rates.EUR,
    INR: data.rates.INR,
  };
}

/* ── Load rates: cache-first, then live ── */
async function loadRates() {
  try {
    const ts      = parseInt(localStorage.getItem(CACHE_TS) || '0', 10);
    const expired = Date.now() - ts > TTL_MS;
    if (!expired) {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached) return cached;
    }
    const fresh = await fetchLiveRates();
    localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
    localStorage.setItem(CACHE_TS, String(Date.now()));
    return fresh;
  } catch {
    /* network/parse error — use cached or fallback */
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached) return cached;
    } catch (err) {
      // Ignore cache parse errors
    }
    return FALLBACK_RATES;
  }
}

/* ── Build legacy currencies array (used by Products.jsx selectors) ── */
const buildCurrencies = (rates) => [
  { code: 'USD', symbol: '$',   rate: rates.USD, flag: '🇺🇸' },
  { code: 'AED', symbol: 'AED', rate: rates.AED, flag: '🇦🇪' },
  { code: 'EUR', symbol: '€',   rate: rates.EUR, flag: '🇪🇺' },
  { code: 'INR', symbol: '₹',   rate: rates.INR, flag: '🇮🇳' },
];

export const CurrencyProvider = ({ children }) => {
  const [rates, setRates]         = useState(FALLBACK_RATES);
  const [ratesLoaded, setLoaded]  = useState(false);
  const [rateDate, setRateDate]   = useState(null);

  const [currency, setCurrency] = useState(() => {
    try {
      const saved = localStorage.getItem('selectedCurrency');
      return saved ? JSON.parse(saved) : { code: 'USD', symbol: '$', rate: 1, flag: '🇺🇸' };
    } catch { return { code: 'USD', symbol: '$', rate: 1, flag: '🇺🇸' }; }
  });

  /* Hydrate live rates on mount */
  useEffect(() => {
    loadRates().then((r) => {
      setRates(r);
      setLoaded(true);
      const ts = parseInt(localStorage.getItem(CACHE_TS) || '0', 10);
      setRateDate(ts ? new Date(ts) : new Date());

      /* Re-sync selected currency rate in case it changed */
      setCurrency(prev => ({
        ...prev,
        rate: r[prev.code] ?? prev.rate,
      }));
    });
  }, []);

  /* Persist selected currency */
  useEffect(() => {
    localStorage.setItem('selectedCurrency', JSON.stringify(currency));
  }, [currency]);

  /* Changing currency re-reads latest rate from live data */
  const handleSetCurrency = (cur) => {
    setCurrency({ ...cur, rate: rates[cur.code] ?? cur.rate });
  };

  const formatPrice = (amount, sourceCurrency = 'USD') => {
    // Convert amount from sourceCurrency → USD → displayCurrency
    const srcRate   = rates[sourceCurrency] ?? 1;
    const usdValue  = amount / srcRate;
    const rate      = rates[currency.code] ?? 1;
    const converted = usdValue * rate;
    if (currency.code === 'AED') return `AED ${Math.round(converted).toLocaleString()}`;
    if (currency.code === 'INR') return `₹${Math.round(converted).toLocaleString('en-IN')}`;
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: currency.code, maximumFractionDigits: 0,
    }).format(converted);
  };

  /* Expose rates for AddProduct conversion preview */
  const convertAll = (amount, fromCurrency = 'USD', excludeCurrency = null) => {
    const usdValue = amount / (rates[fromCurrency] || 1);
    const exclude = excludeCurrency || fromCurrency;
    return Object.entries(rates)
      .filter(([c]) => c !== exclude)
      .map(([c, r]) => ({
        currency: c,
        symbol: CURRENCY_META[c]?.symbol ?? c,
        flag: CURRENCY_META[c]?.flag ?? '',
        value: Math.round(usdValue * r),
      }));
  };

  const currencies = buildCurrencies(rates);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency: handleSetCurrency,
      formatPrice,
      convertAll,
      rates,
      ratesLoaded,
      rateDate,
      currencies,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

/* ── backward-compat export so Products.jsx import still works ── */
export const currencies = buildCurrencies(FALLBACK_RATES);

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
};
