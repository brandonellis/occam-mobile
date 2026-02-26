const ENV = {
  development: {
    centralUrl: 'http://occam.localhost/api/central',
    baseDomain: 'occam.localhost',
    protocol: 'http',
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  },
  staging: {
    centralUrl: 'https://helm.occam.golf/api/central',
    baseDomain: 'occam.golf',
    protocol: 'https',
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  },
  production: {
    centralUrl: 'https://helm.occam.golf/api/central',
    baseDomain: 'occam.golf',
    protocol: 'https',
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  },
};

const getEnvVars = () => {
  const env = process.env.EXPO_PUBLIC_APP_ENV || 'development';
  return ENV[env] || ENV.development;
};

const config = getEnvVars();

/**
 * Build the tenant API base URL from a tenant slug.
 * e.g. getTenantApiUrl('golfshark') => 'https://golfshark.occam.golf/api/v1'
 */
export const getTenantApiUrl = (tenantSlug) => {
  return `${config.protocol}://${tenantSlug}.${config.baseDomain}/api/v1`;
};

export default config;
