import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { videoPlayerStyles as styles } from '../../styles/videoPlayer.styles';
import { colors } from '../../theme';
import { getToken, getTenantId } from '../../helpers/storage.helper';
import { resolveMediaUrl } from '../../helpers/media.helper';

/**
 * Build a VideoSourceObject with auth headers so expo-video can access
 * the authenticated streaming endpoint (/api/v1/uploads/{id}/file).
 */
const buildVideoSource = (url, token, tenantId) => {
  const resolved = resolveMediaUrl(url);
  if (!resolved) return null;

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant'] = tenantId;

  return { uri: resolved, headers };
};

const VideoPlayerScreen = ({ route, navigation }) => {
  const { videoUrl, videoTitle } = route.params;
  const [videoSource, setVideoSource] = useState(null);
  const [playerStatus, setPlayerStatus] = useState('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch auth credentials and build the source object
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [token, tenantId] = await Promise.all([getToken(), getTenantId()]);
      if (!cancelled) {
        const source = buildVideoSource(videoUrl, token, tenantId);
        console.log('[VideoPlayer] source:', source?.uri);
        setVideoSource(source);
      }
    })();
    return () => { cancelled = true; };
  }, [videoUrl]);

  // Only initialise the player once we have the source with auth headers
  const player = useVideoPlayer(videoSource, (p) => {
    if (!videoSource) return;
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    if (!player) return;

    const statusSub = player.addListener('statusChange', ({ status, error }) => {
      console.log('[VideoPlayer] status:', status, error?.message || '');
      setPlayerStatus(status);
      if (status === 'error') {
        setErrorMsg(error?.message || 'Failed to load video');
      }
    });

    const playingSub = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
    });

    return () => {
      statusSub?.remove();
      playingSub?.remove();
    };
  }, [player]);

  const handlePlayPause = useCallback(() => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, isPlaying]);

  const handleRetry = useCallback(async () => {
    if (!player) return;
    setErrorMsg(null);
    setPlayerStatus('loading');
    const [token, tenantId] = await Promise.all([getToken(), getTenantId()]);
    const source = buildVideoSource(videoUrl, token, tenantId);
    if (source) {
      await player.replaceAsync(source);
      player.play();
    }
  }, [player, videoUrl]);

  // Show loading while fetching auth credentials
  if (!videoSource) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" />
        <View style={styles.videoWrapper}>
          <ActivityIndicator size="large" color={colors.textInverse} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {videoTitle || 'Video'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.videoWrapper}>
        {playerStatus === 'error' ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.errorText}>
              {errorMsg || 'Unable to play this video'}
            </Text>
            <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
              <Ionicons name="refresh" size={20} color={colors.textInverse} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <VideoView
              player={player}
              style={styles.video}
              contentFit="contain"
              nativeControls
            />
            {playerStatus === 'loading' && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.textInverse} />
              </View>
            )}
          </>
        )}
      </View>

      {playerStatus !== 'error' && (
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={handlePlayPause} style={styles.controlButton}>
            <Ionicons
              name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={48}
              color={colors.textInverse}
            />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default VideoPlayerScreen;
