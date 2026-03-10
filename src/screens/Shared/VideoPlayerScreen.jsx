import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { formatVideoTimestamp, VIDEO_HEIGHT } from '../../helpers/video.helper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Build a VideoSourceObject with auth headers so expo-video can access
 * the authenticated streaming endpoint (/api/v1/uploads/{id}/file).
 */
const buildVideoSource = (url, token, tenantId) => {
  const resolved = resolveMediaUrl(url);
  if (!resolved) return null;

  const isSignedUrl = resolved.includes('storage.googleapis.com');
  if (isSignedUrl) return { uri: resolved };

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant'] = tenantId;

  return Object.keys(headers).length > 0 ? { uri: resolved, headers } : { uri: resolved };
};

/**
 * Inner component that owns the expo-video player. Only mounts once
 * videoSource is non-null so useVideoPlayer never receives null — this
 * avoids the null→source replace race that causes "Operation Stopped".
 */
const VideoPlayerContent = ({
  initialSource,
  videoUrl,
  videoTitle,
  uploadId,
  targetType,
  targetId,
  navigation,
}) => {
  const [playerStatus, setPlayerStatus] = useState('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const retriedWithoutHeaders = useRef(false);
  const videoViewRef = useRef(null);
  const sourceRef = useRef(initialSource);

  // Annotation state (read-only, only loaded when uploadId is provided)
  const [annotations, setAnnotations] = useState([]);
  const [annotationsLoading, setAnnotationsLoading] = useState(false);
  const [activeAnnotation, setActiveAnnotation] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hasAnnotations = uploadId && annotations.length > 0;

  // Fetch annotations when uploadId is provided
  useEffect(() => {
    if (!uploadId) return;
    let cancelled = false;
    (async () => {
      setAnnotationsLoading(true);
      try {
        const res = await getAnnotations(uploadId, { targetType, targetId });
        if (!cancelled) setAnnotations(res.data || []);
      } catch (err) {
        logger.warn('[VideoPlayer] Failed to load annotations:', err?.message);
        if (!cancelled) setAnnotations([]);
      } finally {
        if (!cancelled) setAnnotationsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [uploadId, targetType, targetId]);

  // Create the player with a guaranteed non-null source
  const player = useVideoPlayer(initialSource, (p) => {
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    if (!player) return;

    const statusSub = player.addListener('statusChange', ({ status, error }) => {
      logger.log('[VideoPlayer] status:', status, error?.message || '');
      if (status === 'error') {
        // If first attempt with auth headers failed, retry without headers
        // (handles public GCS URLs that may reject custom Authorization headers)
        if (!retriedWithoutHeaders.current && sourceRef.current?.headers) {
          retriedWithoutHeaders.current = true;
          const resolved = resolveMediaUrl(videoUrl);
          if (resolved) {
            logger.log('[VideoPlayer] retrying without auth headers:', resolved);
            setPlayerStatus('loading');
            const noAuthSource = { uri: resolved };
            sourceRef.current = noAuthSource;
            player.replaceAsync(noAuthSource)
              .then(() => { player.play(); })
              .catch((e) => {
                logger.warn('[VideoPlayer] replaceAsync failed:', e?.message);
                setPlayerStatus('error');
                setErrorMsg(error?.message || 'Failed to load video');
              });
            return;
          }
        }
        setPlayerStatus('error');
        setErrorMsg(error?.message || 'Failed to load video');
      } else {
        setPlayerStatus(status);
      }
    });

    const playingSub = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
    });

    return () => {
      statusSub?.remove();
      playingSub?.remove();
    };
  }, [player, videoUrl]);

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
    retriedWithoutHeaders.current = false;
    const [token, tenantId] = await Promise.all([getToken(), getTenantId()]);
    const source = buildVideoSource(videoUrl, token, tenantId);
    if (source) {
      sourceRef.current = source;
      try {
        await player.replaceAsync(source);
        player.play();
      } catch (e) {
        logger.warn('[VideoPlayer] retry replaceAsync failed:', e?.message);
        setPlayerStatus('error');
        setErrorMsg(e?.message || 'Failed to load video');
      }
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
            {formatVideoTimestamp(item.timestamp)}
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

  // Drawing overlay for the active annotation
  const activeDrawing = activeAnnotation?.drawing_data?.paths?.length > 0
    ? activeAnnotation.drawing_data
    : null;

  return (
    <>
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
              ref={videoViewRef}
              player={player}
              style={styles.video}
              contentFit="contain"
              allowsFullscreen
              nativeControls={!hasAnnotations || isFullscreen}
              onFullscreenEnter={() => setIsFullscreen(true)}
              onFullscreenExit={() => setIsFullscreen(false)}
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
          <TouchableOpacity
            onPress={() => {
              try {
                if (isFullscreen) {
                  videoViewRef.current?.exitFullscreen();
                } else {
                  videoViewRef.current?.enterFullscreen();
                }
              } catch (e) {
                logger.warn('[VideoPlayer] Fullscreen toggle failed:', e?.message);
              }
            }}
            style={hasAnnotations ? styles.annotationControlButton : styles.controlButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="fullscreen"
              size={hasAnnotations ? 28 : 36}
              color={hasAnnotations ? colors.textPrimary : colors.textInverse}
            />
          </TouchableOpacity>
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
    </>
  );
};

/**
 * Wrapper screen that loads auth credentials asynchronously, then mounts
 * VideoPlayerContent once the source is ready. This ensures useVideoPlayer
 * never receives null, avoiding the native player replace race condition.
 */
const VideoPlayerScreen = ({ route, navigation }) => {
  const { videoUrl, videoTitle, uploadId, targetType, targetId } = route.params;
  const [videoSource, setVideoSource] = useState(null);

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      {videoSource ? (
        <VideoPlayerContent
          initialSource={videoSource}
          videoUrl={videoUrl}
          videoTitle={videoTitle}
          uploadId={uploadId}
          targetType={targetType}
          targetId={targetId}
          navigation={navigation}
        />
      ) : (
        <View style={styles.videoWrapper}>
          <ActivityIndicator size="large" color={colors.textInverse} />
        </View>
      )}
    </SafeAreaView>
  );
};

export default VideoPlayerScreen;
