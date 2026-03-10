import React, { useEffect, useState, useRef } from 'react';
import { Image, View, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getToken, getTenantId } from '../helpers/storage.helper';
import { resolveMediaUrl } from '../helpers/media.helper';
import { colors } from '../theme';

/**
 * Image component that passes Authorization and X-Tenant headers.
 * Required for tenant-scoped upload streaming endpoints.
 *
 * Falls back to a placeholder icon when the image fails to load.
 */
const AuthenticatedImage = ({ uri, style, resizeMode = 'cover', placeholderIcon = 'image-outline', placeholderSize = 32 }) => {
  const [source, setSource] = useState(null);
  const [failed, setFailed] = useState(false);
  const [resolvedUri, setResolvedUri] = useState(null);
  const retriedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    retriedRef.current = false;

    const buildSource = async () => {
      if (!uri) {
        if (mounted) setFailed(true);
        return;
      }

      try {
        const resolved = resolveMediaUrl(uri);

        // GCS signed URLs already contain auth in the query string.
        // Sending extra Authorization / X-Tenant headers causes GCS to
        // reject the request (403), so skip headers for external URLs.
        const isSignedUrl = resolved && resolved.includes('storage.googleapis.com');

        let headers;
        if (!isSignedUrl) {
          const [token, tenantId] = await Promise.all([getToken(), getTenantId()]);
          headers = {};
          if (token) headers.Authorization = `Bearer ${token}`;
          if (tenantId) headers['X-Tenant'] = tenantId;
        }

        if (mounted) {
          setResolvedUri(resolved);
          setSource(headers ? { uri: resolved, headers } : { uri: resolved });
          setFailed(false);
        }
      } catch {
        const resolved = resolveMediaUrl(uri);
        if (mounted) {
          setResolvedUri(resolved);
          setSource({ uri: resolved });
          setFailed(false);
        }
      }
    };

    buildSource();
    return () => { mounted = false; };
  }, [uri]);

  if (failed || !uri) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gray100 }]}>
        <MaterialCommunityIcons name={placeholderIcon} size={placeholderSize} color={colors.gray400} />
      </View>
    );
  }

  if (!source) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gray100 }]}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        if (source?.headers && resolvedUri && !retriedRef.current) {
          retriedRef.current = true;
          setSource({ uri: resolvedUri });
          return;
        }
        setFailed(true);
      }}
    />
  );
};

export default React.memo(AuthenticatedImage);
