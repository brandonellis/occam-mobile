import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { getToken, getTenantId } from '../helpers/storage.helper';
import { colors } from '../theme';

/**
 * Video player component that passes Authorization and X-Tenant headers.
 * Shows a play button overlay; taps to play/pause.
 */
const AuthenticatedVideo = ({ uri, posterUri, style, borderRadius = 12 }) => {
  const videoRef = useRef(null);
  const [headers, setHeaders] = useState(null);
  const [status, setStatus] = useState({});
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [token, tenantId] = await Promise.all([getToken(), getTenantId()]);
        const h = {};
        if (token) h.Authorization = `Bearer ${token}`;
        if (tenantId) h['X-Tenant'] = tenantId;
        if (mounted) setHeaders(h);
      } catch {
        if (mounted) setHeaders({});
      }
    })();
    return () => { mounted = false; };
  }, [uri]);

  const handlePlayPause = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch {
      // Video may be in an invalid state — ignore
    }
  }, [status.isPlaying]);

  if (failed || !uri) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gray100, borderRadius }]}>
        <Ionicons name="videocam-off-outline" size={32} color={colors.gray400} />
      </View>
    );
  }

  if (!headers) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gray100, borderRadius }]}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  const hasStarted = status.positionMillis > 0 || status.isPlaying;
  const isBuffering = status.isBuffering && !status.isPlaying;
  const showPlayOverlay = !hasStarted && !isBuffering;

  return (
    <View style={[style, { borderRadius, overflow: 'hidden' }]}>
      <Video
        ref={videoRef}
        source={{ uri, headers }}
        posterSource={posterUri ? { uri: posterUri, headers } : undefined}
        usePoster={!!posterUri}
        posterStyle={{ resizeMode: 'cover', width: '100%', height: '100%' }}
        style={{ width: '100%', height: '100%' }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isLooping={false}
        useNativeControls
        onPlaybackStatusUpdate={setStatus}
        onError={() => setFailed(true)}
      />
      {showPlayOverlay ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePlayPause}
          style={{
            ...absoluteFill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.25)',
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: 'rgba(0,0,0,0.5)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="play" size={28} color={colors.white} style={{ marginLeft: 3 }} />
          </View>
        </TouchableOpacity>
      ) : null}
      {isBuffering ? (
        <View style={{ ...absoluteFill, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      ) : null}
    </View>
  );
};

const absoluteFill = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export default React.memo(AuthenticatedVideo);
