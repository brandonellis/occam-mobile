import * as WebBrowser from 'expo-web-browser';
import config from '../config';
import { getTenantId } from './storage.helper';
import { createExchangeToken } from '../services/auth.api';

/**
 * Build a full tenant web URL for the given path.
 * Production: https://golfshark.occam.golf/book?flow=membership
 * Dev (header tenancy): http://10.0.0.13/book?flow=membership
 */
export const buildTenantWebUrl = async (path) => {
  const tenantSlug = await getTenantId();
  if (config.useHeaderTenancy) {
    return `${config.protocol}://${config.baseDomain}${path}`;
  }
  if (!tenantSlug) {
    throw new Error('No tenant configured. Please log in again.');
  }
  return `${config.protocol}://${tenantSlug}.${config.baseDomain}${path}`;
};

/**
 * Open a tenant web page in the in-app browser.
 * Returns the browser result (resolves when user closes the browser).
 */
export const openTenantWebPage = async (path) => {
  const url = await buildTenantWebUrl(path);
  return WebBrowser.openBrowserAsync(url);
};

/**
 * Open a tenant web page with an exchange token for seamless auth transfer.
 * Falls back to unauthenticated if token generation fails.
 */
const openAuthenticatedWebPage = async (path) => {
  try {
    const exchangeToken = await createExchangeToken();
    if (exchangeToken) {
      const separator = path.includes('?') ? '&' : '?';
      return openTenantWebPage(`${path}${separator}exchange_token=${encodeURIComponent(exchangeToken)}`);
    }
  } catch {
    // Non-fatal — client can still log in on web
  }
  return openTenantWebPage(path);
};

export const openMembershipPurchase = () => openAuthenticatedWebPage('/book?flow=membership');
export const openPackagePurchase = () => openAuthenticatedWebPage('/book?flow=package');

/**
 * Redirect a client to the web booking flow with full context so they
 * land directly on the payment step (App Store compliance — avoids Apple IAP).
 *
 * @param {{ service: object, coach: object?, location: object?, timeSlot: object?, duration_minutes: number? }} bookingData
 */
export const openBookingPayment = async (bookingData = {}) => {
  const params = new URLSearchParams({ flow: 'booking' });
  const { service, coach, location, timeSlot, duration_minutes } = bookingData;

  if (service?.id) params.set('service_id', String(service.id));
  if (location?.id) params.set('location_id', String(location.id));
  if (coach?.id) params.set('coach_id', String(coach.id));
  if (timeSlot?.start_time) params.set('start_time', timeSlot.start_time);
  if (duration_minutes) params.set('duration_minutes', String(duration_minutes));

  // Transfer auth session to the in-app browser so the client doesn't
  // have to log in again on the web booking flow.
  try {
    const exchangeToken = await createExchangeToken();
    if (exchangeToken) params.set('exchange_token', exchangeToken);
  } catch {
    // Non-fatal — client can still complete booking as guest or log in on web
  }

  return openTenantWebPage(`/book?${params.toString()}`);
};
