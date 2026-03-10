import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getToken, getTenantId } from '../helpers/storage.helper';
import { resolveMediaUrl } from '../helpers/media.helper';
import { colors } from '../theme';
import { authenticatedVideoStyles as vidStyles } from '../styles/authenticatedVideo.styles';

/**
 * Video player component that passes Authorization and X-Tenant headers.
 * Uses expo-video (SDK 54+) with useVideoPlayer hook + VideoView.
 * Shows a play button overlay; taps to play/pause.
 */
const AuthenticatedVideo = ({ uri, posterUri, style, borderRadius = 12 }) => {
  const [headers, setHeaders] = useState(null);
  const [failed, setFailed] = useState(false);
  const retriedRef = useRef(false);
  const retryingRef = useRef(false);
  const videoViewRef = useRef(null);

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

  // Track error status — retry without headers once for public GCS URLs
  useEffect(() => {
    if (status === 'error' && !retriedRef.current && videoSource?.headers) {
      retriedRef.current = true;
      retryingRef.current = true;
      const resolved = resolveMediaUrl(uri);
      if (resolved && player) {
        try {
          player.replace({ uri: resolved });
        } catch {
          retryingRef.current = false;
          setFailed(true);
        }
        return;
      }
      retryingRef.current = false;
    }
    if (status === 'error' && !retryingRef.current) setFailed(true);
    if (status !== 'error' && retryingRef.current) retryingRef.current = false;
  }, [status, videoSource, uri, player]);

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

  const handleFullscreen = useCallback(() => {
    try {
      videoViewRef.current?.enterFullscreen();
    } catch {
      // Ignore if fullscreen not supported
    }
  }, []);

  if (failed || !uri) {
    return (
      <View style={[style, vidStyles.failedContainer, { borderRadius }]}>
        <MaterialCommunityIcons name="video-off-outline" size={32} color={colors.gray400} />
      </View>
    );
  }

  if (!headers) {
    return (
      <View style={[style, vidStyles.loadingContainer, { borderRadius }]}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  const isLoading = status === 'loading';
  const showPlayOverlay = !isPlaying && !isLoading;

  return (
    <View style={[style, { borderRadius, overflow: 'hidden' }]}>
      <VideoView
        ref={videoViewRef}
        player={player}
        style={vidStyles.videoView}
        contentFit="cover"
        nativeControls
      />
      {showPlayOverlay ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePlayPause}
          style={vidStyles.playOverlay}
        >
          <View style={vidStyles.playButton}>
            <MaterialCommunityIcons name="play" size={28} color={colors.white} style={vidStyles.playIcon} />
          </View>
        </TouchableOpacity>
      ) : null}
      {!isLoading && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleFullscreen}
          style={vidStyles.fullscreenButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="fullscreen" size={20} color={colors.white} />
        </TouchableOpacity>
      )}
      {isLoading ? (
        <View style={vidStyles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      ) : null}
    </View>
  );
};

export default React.memo(AuthenticatedVideo);
