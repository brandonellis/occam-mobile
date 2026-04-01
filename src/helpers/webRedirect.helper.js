import * as WebBrowser from 'expo-web-browser';
import config from '../config';
import { getTenantId } from './storage.helper';

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

export const openMembershipPurchase = () => openTenantWebPage('/book?flow=membership');
export const openPackagePurchase = () => openTenantWebPage('/book?flow=package');
export const openBookingPayment = () => openTenantWebPage('/book');
