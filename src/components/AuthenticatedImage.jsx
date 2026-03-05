import React, { useEffect, useState } from 'react';
import { Image, View, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getToken, getTenantId } from '../helpers/storage.helper';
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

  useEffect(() => {
    let mounted = true;

    const buildSource = async () => {
      if (!uri) {
        if (mounted) setFailed(true);
        return;
      }

      try {
        const [token, tenantId] = await Promise.all([getToken(), getTenantId()]);
        const headers = {};

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        if (tenantId) {
          headers['X-Tenant'] = tenantId;
        }

        if (mounted) {
          setSource({ uri, headers });
          setFailed(false);
        }
      } catch {
        if (mounted) {
          setSource({ uri });
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
      onError={() => setFailed(true)}
    />
  );
};

export default React.memo(AuthenticatedImage);
