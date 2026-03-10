import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getToken, getTenantId } from '../helpers/storage.helper';
import { resolveMediaUrl } from '../helpers/media.helper';
import { colors } from '../theme';

/**
 * Video player component that passes Authorization and X-Tenant headers.
 * Uses expo-video (SDK 54+) with useVideoPlayer hook + VideoView.
 * Shows a play button overlay; taps to play/pause.
 */
const AuthenticatedVideo = ({ uri, posterUri, style, borderRadius = 12 }) => {
  const [headers, setHeaders] = useState(null);
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

  // Build video source with auth headers
  const videoSource = useMemo(() => {
    if (!uri || !headers) return null;
    const resolved = resolveMediaUrl(uri);
    return { uri: resolved, headers };
  }, [uri, headers]);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  // Track error status
  useEffect(() => {
    if (status === 'error') setFailed(true);
  }, [status]);

  const handlePlayPause = useCallback(() => {
    try {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
    } catch {
      // Player may be in an invalid state — ignore
    }
  }, [isPlaying, player]);

  if (failed || !uri) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gray100, borderRadius }]}>
        <MaterialCommunityIcons name="video-off-outline" size={32} color={colors.gray400} />
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

  const isLoading = status === 'loading';
  const showPlayOverlay = !isPlaying && !isLoading;

  return (
    <View style={[style, { borderRadius, overflow: 'hidden' }]}>
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls
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
            <MaterialCommunityIcons name="play" size={28} color={colors.white} style={{ marginLeft: 3 }} />
          </View>
        </TouchableOpacity>
      ) : null}
      {isLoading ? (
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
