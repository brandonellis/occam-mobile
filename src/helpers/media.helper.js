import config from '../config';

/**
 * Rewrite a media URL so it is reachable from the device.
 *
 * In development the backend generates URLs using APP_URL which contains
 * hostnames like "occam.localhost" or "golfshark.occam.localhost" that the
 * device/emulator cannot resolve.  This helper swaps the hostname (and port)
 * with the baseDomain from the mobile config (e.g. "10.0.0.159") so that
 * the device can actually fetch the resource.
 *
 * In production the URLs already point to public GCS buckets so they pass
 * through unchanged.
 *
 * @param {string|null|undefined} url
 * @returns {string|null}
 */
export const resolveMediaUrl = (url) => {
  if (!url) return null;

  // Only rewrite when running against a local dev server
  if (!config.useHeaderTenancy) return url;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname;

    // If the URL already points at the dev IP, nothing to do
    if (host === config.baseDomain) return url;

    // Rewrite any *.localhost or *.occam.localhost hostname → dev IP
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      parsed.hostname = config.baseDomain;
      parsed.port = ''; // drop any explicit port (nginx on 80)
      parsed.protocol = config.protocol + ':';
      return parsed.toString();
    }
  } catch {
    // Not a valid URL — return as-is
  }

  return url;
};
