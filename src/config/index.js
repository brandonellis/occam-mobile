const ENV = {
  development: {
    centralUrl: 'http://10.0.0.159/api/central',
    baseDomain: '10.0.0.159',
    protocol: 'http',
    useHeaderTenancy: true,
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    googleIosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID || '',
  },
  staging: {
    centralUrl: 'https://helm.occam.golf/api/central',
    baseDomain: 'occam.golf',
    protocol: 'https',
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    googleIosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID || '',
  },
  production: {
    centralUrl: 'https://helm.occam.golf/api/central',
    baseDomain: 'occam.golf',
    protocol: 'https',
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    googleIosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID || '',
  },
};

const getEnvVars = () => {
  const env = process.env.APP_ENV || 'development';
  return ENV[env] || ENV.development;
};

const config = getEnvVars();

/**
 * Build the tenant API base URL from a tenant slug.
 * In production: subdomain-based, e.g. 'https://golfshark.occam.golf/api/v1'
 * In development: same base IP for all tenants (tenant identified by X-Tenant header)
 */
export const getTenantApiUrl = (tenantSlug) => {
  if (config.useHeaderTenancy) {
    return `${config.protocol}://${config.baseDomain}/api/v1`;
  }
  return `${config.protocol}://${tenantSlug}.${config.baseDomain}/api/v1`;
};

export default config;
