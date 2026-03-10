import React, { useState, useEffect, useRef } from 'react';
import { Image } from 'react-native';
import { getToken, getTenantId } from '../helpers/storage.helper';
import { resolveMediaUrl } from '../helpers/media.helper';

/**
 * Image component that automatically injects Authorization and X-Tenant
 * headers into the request. Use this for any image loaded from the
 * authenticated API (e.g. /api/v1/uploads/{id}/file).
 *
 * Props are identical to React Native's <Image>, except `uri` is a
 * convenience prop that replaces `source`.
 */
const AuthImage = ({ uri, source, style, ...rest }) => {
  const [authSource, setAuthSource] = useState(null);
  const [resolvedUri, setResolvedUri] = useState(null);
  const retriedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    retriedRef.current = false;
    const rawUri = uri || source?.uri;
    if (!rawUri) {
      setAuthSource(null);
      setResolvedUri(null);
      return;
    }

    (async () => {
      const [token, tenantId] = await Promise.all([getToken(), getTenantId()]);
      if (cancelled) return;

      const resolved = resolveMediaUrl(rawUri);
      setResolvedUri(resolved);
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (tenantId) headers['X-Tenant'] = tenantId;

      setAuthSource({ uri: resolved, headers });
    })();

    return () => { cancelled = true; };
  }, [uri, source?.uri]);

  if (!authSource) return null;

  return (
    <Image
      source={authSource}
      style={style}
      onError={(event) => {
        if (authSource?.headers && resolvedUri && !retriedRef.current) {
          retriedRef.current = true;
          setAuthSource({ uri: resolvedUri });
        }

        if (rest.onError) {
          rest.onError(event);
        }
      }}
      {...rest}
    />
  );
};

export default AuthImage;
