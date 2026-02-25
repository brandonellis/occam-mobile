import React, { useState, useEffect } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import config from '../config';
import { getEcommerceConfig } from '../services/bookings.api';
import useAuth from '../hooks/useAuth';

/**
 * Wraps children in a StripeProvider that dynamically sets stripeAccountId
 * for Stripe Connect direct charges. Fetches the tenant's connect account
 * from the ecommerce config API after the user is authenticated.
 *
 * Re-fetches when the auth user changes (login/logout/tenant switch).
 */
const StripeConnectProvider = ({ children }) => {
  const { user } = useAuth();
  const [connectAccountId, setConnectAccountId] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      setConnectAccountId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const cfg = await getEcommerceConfig();
        if (cancelled) return;
        const acctId = cfg?.stripe?.account_id;
        const acctType = cfg?.stripe?.account_type;
        if (acctId && acctType !== 'none') {
          setConnectAccountId(acctId);
        } else {
          setConnectAccountId(null);
        }
      } catch {
        if (!cancelled) setConnectAccountId(null);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <StripeProvider
      publishableKey={config.stripePublishableKey}
      stripeAccountId={connectAccountId || undefined}
    >
      {children}
    </StripeProvider>
  );
};

export default StripeConnectProvider;
