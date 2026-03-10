import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getToken, getTenantId } from '../helpers/storage.helper';
import { resolveMediaUrl, buildVideoSource, isSignedGcsUrl } from '../helpers/media.helper';
import { colors } from '../theme';
import logger from '../helpers/logger.helper';
import { authenticatedVideoStyles as vidStyles } from '../styles/authenticatedVideo.styles';

/**
 * Inner component that owns the expo-video player. Only mounts once
 * videoSource is non-null so useVideoPlayer never receives null — this
 * avoids the null→source replace race that causes "Operation Stopped".
 */
const VideoPlayerView = ({ source, uri, style, borderRadius }) => {
  const [failed, setFailed] = useState(false);
  const retriedRef = useRef(false);
  const retryingRef = useRef(false);
  const videoViewRef = useRef(null);
  const sourceRef = useRef(source);

  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  // Track error status — retry without headers once for public GCS URLs
  useEffect(() => {
    if (status === 'error' && !retriedRef.current && sourceRef.current?.headers) {
      retriedRef.current = true;
      retryingRef.current = true;
      const resolved = resolveMediaUrl(uri);
      if (resolved && player) {
        const noAuthSource = { uri: resolved };
        sourceRef.current = noAuthSource;
        player.replaceAsync(noAuthSource).catch((e) => {
          logger.warn('[AuthenticatedVideo] replaceAsync retry failed:', e?.message);
          retryingRef.current = false;
          setFailed(true);
        });
        return;
      }
      retryingRef.current = false;
    }
    if (status === 'error' && !retryingRef.current) setFailed(true);
    if (status !== 'error' && retryingRef.current) retryingRef.current = false;
  }, [status, uri, player]);

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

  if (failed) {
    return (
      <View style={[style, vidStyles.failedContainer, { borderRadius }]}>
        <MaterialCommunityIcons name="video-off-outline" size={32} color={colors.gray400} />
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
        allowsFullscreen
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

/**
 * Video player component that passes Authorization and X-Tenant headers.
 * Uses expo-video (SDK 54+) with useVideoPlayer hook + VideoView.
 * Shows a play button overlay; taps to play/pause.
 *
 * Loads auth headers asynchronously, then mounts the inner VideoPlayerView
 * only once the source is ready — ensuring useVideoPlayer never receives null.
 */
const AuthenticatedVideo = ({ uri, posterUri, style, borderRadius = 12 }) => {
  const [videoSource, setVideoSource] = useState(null);

  useEffect(() => {
    if (!uri) return;
    let mounted = true;
    (async () => {
      try {
        const resolved = resolveMediaUrl(uri);
        if (isSignedGcsUrl(resolved)) {
          if (mounted) setVideoSource({ uri: resolved });
        } else {
          const [token, tenantId] = await Promise.all([getToken(), getTenantId()]);
          const source = buildVideoSource(uri, token, tenantId);
          if (mounted && source) setVideoSource(source);
        }
      } catch (e) {
        logger.warn('[AuthenticatedVideo] Failed to build source:', e?.message);
        // Fall back to uri-only source so the player at least attempts playback
        const resolved = resolveMediaUrl(uri);
        if (mounted && resolved) setVideoSource({ uri: resolved });
      }
    })();
    return () => { mounted = false; };
  }, [uri]);

  if (!uri) {
    return (
      <View style={[style, vidStyles.failedContainer, { borderRadius }]}>
        <MaterialCommunityIcons name="video-off-outline" size={32} color={colors.gray400} />
      </View>
    );
  }

  if (!videoSource) {
    return (
      <View style={[style, vidStyles.loadingContainer, { borderRadius }]}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  return (
    <VideoPlayerView
      source={videoSource}
      uri={uri}
      style={style}
      borderRadius={borderRadius}
    />
  );
};

export default React.memo(AuthenticatedVideo);
