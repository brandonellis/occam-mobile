import { useState, useEffect } from 'react';
import { getEcommerceConfig } from '../services/bookings.api';
import { DEFAULT_FEE_RATE } from '../constants/billing.constants';

/**
 * Hook to fetch ecommerce config (platform fee, Stripe status).
 * Shared across BookingConfirmationScreen and MembershipCheckoutScreen.
 *
 * @returns {{ platformFeeRate: number, feeDescription: string, paymentsEnabled: boolean, connectAccount: string|null, loading: boolean }}
 */
const useEcommerceConfig = () => {
  const [platformFeeRate, setPlatformFeeRate] = useState(DEFAULT_FEE_RATE);
  const [feeDescription, setFeeDescription] = useState('Platform service fee');
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [connectAccount, setConnectAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await getEcommerceConfig();
        if (cancelled) return;
        const pct = cfg?.fees?.platform_fee_percentage;
        const desc = cfg?.fees?.platform_fee_description;
        if (typeof pct === 'number') setPlatformFeeRate(pct / 100);
        if (desc) setFeeDescription(desc);

        const acctId = cfg?.stripe?.account_id;
        const acctType = cfg?.stripe?.account_type;
        if (acctId && acctType !== 'none') {
          setPaymentsEnabled(true);
          setConnectAccount(acctId);
        }
      } catch {
        // Non-fatal — keep defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { platformFeeRate, feeDescription, paymentsEnabled, connectAccount, loading };
};

export default useEcommerceConfig;
