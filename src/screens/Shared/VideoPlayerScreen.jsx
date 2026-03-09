import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { videoPlayerStyles as styles } from '../../styles/videoPlayer.styles';
import { colors } from '../../theme';
import { getToken, getTenantId } from '../../helpers/storage.helper';
import { resolveMediaUrl } from '../../helpers/media.helper';
import { getAnnotations } from '../../services/annotations.api';
import logger from '../../helpers/logger.helper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16;

const formatTimestamp = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

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
  const { videoUrl, videoTitle, uploadId } = route.params;
  const [videoSource, setVideoSource] = useState(null);
  const [playerStatus, setPlayerStatus] = useState('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Annotation state (read-only, only loaded when uploadId is provided)
  const [annotations, setAnnotations] = useState([]);
  const [annotationsLoading, setAnnotationsLoading] = useState(false);
  const [activeAnnotation, setActiveAnnotation] = useState(null);
  const hasAnnotations = uploadId && annotations.length > 0;

  // Fetch auth credentials and build the source object
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [token, tenantId] = await Promise.all([getToken(), getTenantId()]);
      if (!cancelled) {
        const source = buildVideoSource(videoUrl, token, tenantId);
        logger.log('[VideoPlayer] source:', source?.uri);
        setVideoSource(source);
      }
    })();
    return () => { cancelled = true; };
  }, [videoUrl]);

  // Fetch annotations when uploadId is provided
  useEffect(() => {
    if (!uploadId) return;
    let cancelled = false;
    (async () => {
      setAnnotationsLoading(true);
      try {
        const res = await getAnnotations(uploadId);
        if (!cancelled) setAnnotations(res.data || []);
      } catch (err) {
        logger.warn('[VideoPlayer] Failed to load annotations:', err?.message);
        if (!cancelled) setAnnotations([]);
      } finally {
        if (!cancelled) setAnnotationsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [uploadId]);

  // Only initialise the player once we have the source with auth headers
  const player = useVideoPlayer(videoSource, (p) => {
    if (!videoSource) return;
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    if (!player) return;

    const statusSub = player.addListener('statusChange', ({ status, error }) => {
      logger.log('[VideoPlayer] status:', status, error?.message || '');
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
      setActiveAnnotation(null);
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

  const handleSeekToAnnotation = useCallback((annotation) => {
    if (!player) return;
    const time = Number(annotation.timestamp) || 0;
    player.currentTime = time;
    player.pause();
    setActiveAnnotation(annotation);
  }, [player]);

  const renderAnnotation = useCallback(({ item }) => {
    const authorName = item.author
      ? `${item.author.first_name || ''} ${item.author.last_name || ''}`.trim()
      : '';
    const hasDrawing = item.drawing_data?.paths?.length > 0;
    const isActive = activeAnnotation?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.annotationItem, isActive && styles.annotationItemActive]}
        onPress={() => handleSeekToAnnotation(item)}
        activeOpacity={0.7}
      >
        <View style={styles.annotationTimestamp}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={colors.accent} />
          <Text style={styles.annotationTimeText}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        <View style={styles.annotationContent}>
          {item.comment && (
            <Text style={styles.annotationComment}>{item.comment}</Text>
          )}
          {hasDrawing && (
            <View style={styles.drawingPreview}>
              <Svg
                width={60}
                height={34}
                viewBox={`0 0 ${item.drawing_data.viewWidth || SCREEN_WIDTH} ${item.drawing_data.viewHeight || VIDEO_HEIGHT}`}
              >
                {item.drawing_data.paths.map((p, i) => (
                  <Path
                    key={i}
                    d={p.d}
                    stroke={p.color}
                    strokeWidth={3}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </Svg>
            </View>
          )}
          {authorName ? (
            <Text style={styles.annotationAuthor}>{authorName}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }, [activeAnnotation, handleSeekToAnnotation]);

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

  // Drawing overlay for the active annotation
  const activeDrawing = activeAnnotation?.drawing_data?.paths?.length > 0
    ? activeAnnotation.drawing_data
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {videoTitle || 'Video'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={hasAnnotations ? [styles.videoContainer, { height: VIDEO_HEIGHT }] : styles.videoWrapper}>
        {playerStatus === 'error' ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.errorText}>
              {errorMsg || 'Unable to play this video'}
            </Text>
            <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
              <MaterialCommunityIcons name="refresh" size={20} color={colors.textInverse} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <VideoView
              player={player}
              style={styles.video}
              contentFit="contain"
              nativeControls={!hasAnnotations}
            />
            {activeDrawing && (
              <View style={styles.drawingOverlay} pointerEvents="none">
                <Svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${activeDrawing.viewWidth || SCREEN_WIDTH} ${activeDrawing.viewHeight || VIDEO_HEIGHT}`}
                >
                  {activeDrawing.paths.map((p, i) => (
                    <Path
                      key={i}
                      d={p.d}
                      stroke={p.color}
                      strokeWidth={3}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </Svg>
              </View>
            )}
            {playerStatus === 'loading' && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.textInverse} />
              </View>
            )}
          </>
        )}
      </View>

      {playerStatus !== 'error' && (
        <View style={hasAnnotations ? styles.annotationControlsRow : styles.controlsRow}>
          <TouchableOpacity onPress={handlePlayPause} style={hasAnnotations ? styles.annotationControlButton : styles.controlButton}>
            <MaterialCommunityIcons
              name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={hasAnnotations ? 36 : 48}
              color={hasAnnotations ? colors.textPrimary : colors.textInverse}
            />
          </TouchableOpacity>
          {hasAnnotations && (
            <Text style={styles.annotationsBadge}>
              {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      )}

      {/* Read-only annotations list */}
      {uploadId && playerStatus !== 'error' && (
        annotationsLoading ? (
          <View style={styles.annotationsLoadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : annotations.length > 0 ? (
          <FlatList
            data={annotations}
            renderItem={renderAnnotation}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.annotationsList}
            style={styles.annotationsListContainer}
          />
        ) : (
          <View style={styles.annotationsEmptyState}>
            <MaterialCommunityIcons name="chat-outline" size={24} color={colors.textTertiary} />
            <Text style={styles.annotationsEmptyText}>No annotations on this video</Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
};

export default VideoPlayerScreen;
