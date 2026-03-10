import config from '../config';

/**
 * Extract the primary image URL from a service's media array.
 * Matches the web client's getServiceImageUrl() in serviceHelpers.js.
 *
 * @param {Object} service - Service object with optional media array
 * @returns {string|null}
 */
export const getServiceImageUrl = (service) => {
  if (!service?.media || !Array.isArray(service.media) || service.media.length === 0) {
    return null;
  }
  const primary = service.media[0];
  if (!primary) return null;
  return primary.url || primary.file_url || primary.file_path || null;
};

/**
 * Rewrite a media URL so it is reachable from the device.
 *
 * In development the backend generates URLs using APP_URL which contains
 * hostnames like "occam.localhost" or "golfshark.occam.localhost" that the
 * device/emulator cannot resolve.  This helper swaps the hostname (and port)
 * with the baseDomain from the mobile config (e.g. "10.0.0.159") so that
 * the device can actually fetch the resource.
 *
 * In production the URLs are GCS signed URLs so they pass through unchanged.
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

/**
 * Check whether a resolved URL points to a GCS signed URL.
 * Signed URLs already carry auth in the query string, so we must NOT
 * send additional Authorization / X-Tenant headers (GCS rejects them with 403).
 *
 * @param {string|null|undefined} url
 * @returns {boolean}
 */
export const isSignedGcsUrl = (url) =>
  typeof url === 'string' && url.includes('storage.googleapis.com');

/**
 * Build a video source object suitable for expo-video's useVideoPlayer.
 *
 * - Resolves the URL for the current environment (dev rewrite).
 * - Skips auth headers for GCS signed URLs (they reject extra headers).
 * - Returns `{ uri, headers? }` or `null` if the URL can't be resolved.
 *
 * @param {string} url       - Raw video URL from the API.
 * @param {string|null} token    - Bearer token.
 * @param {string|null} tenantId - Tenant identifier for X-Tenant header.
 * @returns {{ uri: string, headers?: Record<string, string> } | null}
 */
export const buildVideoSource = (url, token, tenantId) => {
  const resolved = resolveMediaUrl(url);
  if (!resolved) return null;

  if (isSignedGcsUrl(resolved)) return { uri: resolved };

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant'] = tenantId;

  return Object.keys(headers).length > 0 ? { uri: resolved, headers } : { uri: resolved };
};
