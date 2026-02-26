const ENV = {
  development: {
    centralUrl: 'http://10.0.0.159/api/central',
    baseDomain: '10.0.0.159',
    protocol: 'http',
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
 * e.g. getTenantApiUrl('golfshark') => 'https://golfshark.occam.golf/api/v1'
 */
export const getTenantApiUrl = (tenantSlug) => {
  return `${config.protocol}://${tenantSlug}.${config.baseDomain}/api/v1`;
};

export default config;
