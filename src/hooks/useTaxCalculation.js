import { useState, useEffect } from 'react';
import { calculateTaxForAmount } from '../services/billing.api';

/**
 * Hook to calculate tax for a given amount in cents.
 * Uses the Stripe Tax Calculation API on the Connected account.
 *
 * @param {number} amountCents - The taxable amount in cents
 * @param {string} currency - Three-letter currency code (default: 'usd')
 * @param {boolean} enabled - Whether to run the calculation (default: true)
 * @returns {{ taxAmount: number, taxLoading: boolean }}
 */
export const useTaxCalculation = (amountCents, currency = 'usd', enabled = true) => {
  const [taxAmount, setTaxAmount] = useState(0);
  const [taxLoading, setTaxLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !amountCents || amountCents <= 0) {
      setTaxAmount(0);
      setTaxLoading(false);
      return;
    }

    let cancelled = false;
    setTaxLoading(true);

    (async () => {
      try {
        const result = await calculateTaxForAmount(amountCents, currency);
        if (!cancelled && result?.tax_amount > 0) {
          setTaxAmount(result.tax_amount / 100); // cents → dollars
        } else if (!cancelled) {
          setTaxAmount(0);
        }
      } catch (_) {
        if (!cancelled) setTaxAmount(0);
      } finally {
        if (!cancelled) setTaxLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [amountCents, currency, enabled]);

  return { taxAmount, taxLoading };
};
