import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import {
  getAnnotations,
  createAnnotation,
  deleteAnnotation,
} from '../../services/annotations.api';
import { videoAnnotationStyles as styles } from '../../styles/videoAnnotation.styles';
import { globalStyles } from '../../styles/global.styles';
import { colors } from '../../theme';
import { getToken, getTenantId } from '../../helpers/storage.helper';
import { resolveMediaUrl } from '../../helpers/media.helper';
import { formatVideoTimestamp, VIDEO_HEIGHT } from '../../helpers/video.helper';
import logger from '../../helpers/logger.helper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DRAW_COLORS = [
  colors.destructive,
  colors.warning,
  colors.peachGlow,
  colors.success,
  colors.info,
  colors.white,
];

const FRAME_STEP_SECONDS = 0.1;

const VideoAnnotationScreen = ({ route, navigation }) => {
  const { uploadId, videoUrl, videoTitle } = route.params;
  const [videoSource, setVideoSource] = useState(null);

  // Fetch auth credentials and build source with headers
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [token, tenantId] = await Promise.all([getToken(), getTenantId()]);
      if (cancelled) return;
      const resolved = resolveMediaUrl(videoUrl);
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (tenantId) headers['X-Tenant'] = tenantId;
      setVideoSource(resolved ? { uri: resolved, headers } : null);
    })();
    return () => { cancelled = true; };
  }, [videoUrl]);

  const player = useVideoPlayer(videoSource, (p) => {
    if (!videoSource) return;
    p.loop = false;
  });

  const [annotations, setAnnotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [drawColor, setDrawColor] = useState(DRAW_COLORS[0]);

  // Comment state
  const [comment, setComment] = useState('');
  const [capturedTimestamp, setCapturedTimestamp] = useState(null);

  // Video state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const timeInterval = useRef(null);
  const scrubberRef = useRef(null);

  // Refs for PanResponder (avoids stale closure)
  const isDrawingRef = useRef(isDrawing);
  const drawColorRef = useRef(drawColor);
  const currentPathRef = useRef(currentPath);
  isDrawingRef.current = isDrawing;
  drawColorRef.current = drawColor;
  currentPathRef.current = currentPath;

  // Track video time and duration
  useEffect(() => {
    timeInterval.current = setInterval(() => {
      if (player && !isScrubbing) {
        setCurrentTime(player.currentTime || 0);
        if (player.duration && player.duration > 0) {
          setDuration(player.duration);
        }
      }
    }, 250);
    return () => {
      if (timeInterval.current) clearInterval(timeInterval.current);
    };
  }, [player, isScrubbing]);

  // Track play/pause state
  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
    });
    return () => sub?.remove();
  }, [player]);

  const loadAnnotations = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getAnnotations(uploadId);
      setAnnotations(res.data || []);
    } catch (err) {
      logger.warn('[VideoAnnotation] Failed to load annotations:', err?.message);
      setAnnotations([]);
    } finally {
      setIsLoading(false);
    }
  }, [uploadId]);

  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  // Pan responder for drawing (uses refs to avoid stale closures)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isDrawingRef.current,
      onMoveShouldSetPanResponder: () => isDrawingRef.current,
      onPanResponderGrant: (evt) => {
        if (!isDrawingRef.current) return;
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M${locationX},${locationY}`);
      },
      onPanResponderMove: (evt) => {
        if (!isDrawingRef.current) return;
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prev) => `${prev} L${locationX},${locationY}`);
      },
      onPanResponderRelease: () => {
        if (!isDrawingRef.current || !currentPathRef.current) return;
        setPaths((prev) => [...prev, { d: currentPathRef.current, color: drawColorRef.current }]);
        setCurrentPath('');
      },
    })
  ).current;

  // Scrubber seek helper (ref-based to avoid stale closures in PanResponder)
  const seekToPositionRef = useRef(null);
  seekToPositionRef.current = useCallback((pageX) => {
    if (!scrubberRef.current || !player || duration <= 0) return;
    scrubberRef.current.measure((_x, _y, width, _height, pX) => {
      const relativeX = Math.max(0, Math.min(pageX - pX, width));
      const seekTime = (relativeX / width) * duration;
      player.currentTime = seekTime;
      setCurrentTime(seekTime);
    });
  }, [player, duration]);

  // Scrubber pan responder (uses ref to always call latest seekToPosition)
  const scrubberPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsScrubbing(true);
      },
      onPanResponderMove: (evt) => {
        seekToPositionRef.current?.(evt.nativeEvent.pageX);
      },
      onPanResponderRelease: (evt) => {
        seekToPositionRef.current?.(evt.nativeEvent.pageX);
        setIsScrubbing(false);
      },
      onPanResponderTerminate: () => {
        setIsScrubbing(false);
      },
    })
  ).current;

  // Merged "Annotate" button — pauses, captures timestamp, enters draw mode
  const handleAnnotate = useCallback(() => {
    if (player) {
      player.pause();
      const ts = player.currentTime || 0;
      setCapturedTimestamp(ts);
      setIsDrawing(true);
    }
  }, [player]);

  const handleUndoStroke = useCallback(() => {
    setPaths((prev) => prev.slice(0, -1));
  }, []);

  const handleClearDrawing = useCallback(() => {
    setPaths([]);
    setCurrentPath('');
  }, []);

  const handleCancelAnnotation = useCallback(() => {
    setIsDrawing(false);
    setPaths([]);
    setCurrentPath('');
    setComment('');
    setCapturedTimestamp(null);
  }, []);

  const handleSaveAnnotation = useCallback(async () => {
    if (capturedTimestamp === null && !comment.trim()) return;

    setIsSaving(true);
    try {
      const payload = {
        timestamp: capturedTimestamp ?? currentTime,
        comment: comment.trim() || null,
        drawing_data: paths.length > 0 ? { paths, viewWidth: SCREEN_WIDTH, viewHeight: VIDEO_HEIGHT } : null,
      };

      await createAnnotation(uploadId, payload);

      // Reset state
      setIsDrawing(false);
      setPaths([]);
      setCurrentPath('');
      setComment('');
      setCapturedTimestamp(null);

      loadAnnotations();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save annotation.');
    } finally {
      setIsSaving(false);
    }
  }, [uploadId, capturedTimestamp, currentTime, comment, paths, loadAnnotations]);

  const handleDeleteAnnotation = useCallback((annotationId) => {
    Alert.alert('Delete Annotation', 'Remove this annotation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAnnotation(uploadId, annotationId);
            loadAnnotations();
          } catch (err) {
            logger.warn('[VideoAnnotation] Failed to delete annotation:', err?.message);
            Alert.alert('Error', 'Failed to delete annotation.');
          }
        },
      },
    ]);
  }, [uploadId, loadAnnotations]);

  const handleSeekToAnnotation = useCallback((annotation) => {
    if (player) {
      const time = Number(annotation.timestamp) || 0;
      player.currentTime = time;
      player.pause();
      setCapturedTimestamp(time);
      setIsDrawing(false);
      setCurrentPath('');
      setComment(annotation.comment || '');

      // Load saved drawing onto the canvas
      if (annotation.drawing_data?.paths?.length > 0) {
        setPaths(annotation.drawing_data.paths);
      } else {
        setPaths([]);
      }
    }
  }, [player]);

  const handlePlayPause = useCallback(() => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      setCapturedTimestamp(null);
      setIsDrawing(false);
      setPaths([]);
      setCurrentPath('');
      player.play();
    }
  }, [player, isPlaying]);

  const handleFrameStep = useCallback((direction) => {
    if (!player) return;
    player.pause();
    const newTime = Math.max(0, Math.min(
      (player.currentTime || 0) + (direction * FRAME_STEP_SECONDS),
      duration || Infinity
    ));
    player.currentTime = newTime;
    setCurrentTime(newTime);
  }, [player, duration]);

  const renderAnnotation = ({ item }) => {
    const authorName = item.author
      ? `${item.author.first_name || ''} ${item.author.last_name || ''}`.trim()
      : 'Unknown';
    const hasDrawing = item.drawing_data?.paths?.length > 0;

    return (
      <TouchableOpacity
        style={styles.annotationItem}
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
          <Text style={styles.annotationAuthor}>{authorName}</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteAnnotation(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={videoTitle || 'Video Annotation'}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={globalStyles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Video player + drawing overlay */}
        <View style={[styles.videoContainer, { height: VIDEO_HEIGHT }]}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls={false}
          />

          {/* Drawing overlay (only visible when drawing or showing saved drawings) */}
          {(isDrawing || capturedTimestamp !== null) && (
            <View
              style={styles.drawingOverlay}
              {...(isDrawing ? panResponder.panHandlers : {})}
            >
              <Svg style={styles.svgCanvas}>
                {paths.map((p, i) => (
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
                {currentPath ? (
                  <Path
                    d={currentPath}
                    stroke={drawColor}
                    strokeWidth={3}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
              </Svg>
            </View>
          )}
        </View>

        {/* Scrubber / seek bar */}
        <View style={styles.scrubberContainer}>
          <Text style={styles.scrubberTime}>{formatVideoTimestamp(currentTime)}</Text>
          <View
            ref={scrubberRef}
            style={styles.scrubberTrack}
            {...scrubberPanResponder.panHandlers}
          >
            <View style={styles.scrubberTrackBg} />
            <View
              style={[
                styles.scrubberTrackFill,
                { width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' },
              ]}
            />
            {/* Annotation markers on the scrubber */}
            {annotations.map((ann) => {
              const pct = duration > 0 ? (Number(ann.timestamp) / duration) * 100 : 0;
              return (
                <View
                  key={ann.id}
                  style={[styles.scrubberMarker, { left: `${pct}%` }]}
                />
              );
            })}
            <View
              style={[
                styles.scrubberThumb,
                { left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' },
              ]}
            />
          </View>
          <Text style={styles.scrubberTime}>{formatVideoTimestamp(duration)}</Text>
        </View>

        {/* Video controls */}
        <View style={styles.controlsRow}>
          {/* Frame step back */}
          <TouchableOpacity
            onPress={() => handleFrameStep(-1)}
            style={styles.frameStepButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="skip-previous" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePlayPause} style={styles.controlButton}>
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={22}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          {/* Frame step forward */}
          <TouchableOpacity
            onPress={() => handleFrameStep(1)}
            style={styles.frameStepButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="skip-next" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.controlActions}>
            {/* Annotate button (merged Mark + Draw) — visible when not in annotation mode */}
            {capturedTimestamp === null && (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleAnnotate}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="draw" size={16} color={colors.accent} />
                <Text style={styles.captureButtonText}>Annotate</Text>
              </TouchableOpacity>
            )}
            {/* Drawing tools — visible when in draw mode */}
            {isDrawing && (
              <>
                <TouchableOpacity
                  style={[styles.captureButton, paths.length === 0 && styles.captureButtonDisabled]}
                  onPress={handleUndoStroke}
                  activeOpacity={paths.length > 0 ? 0.7 : 1}
                  disabled={paths.length === 0}
                >
                  <MaterialCommunityIcons name="undo" size={16} color={paths.length > 0 ? colors.textSecondary : colors.disabled} />
                  <Text style={[styles.captureButtonText, { color: paths.length > 0 ? colors.textSecondary : colors.disabled }]}>Undo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.captureButton, paths.length === 0 && styles.captureButtonDisabled]}
                  onPress={handleClearDrawing}
                  activeOpacity={paths.length > 0 ? 0.7 : 1}
                  disabled={paths.length === 0}
                >
                  <MaterialCommunityIcons name="refresh" size={16} color={paths.length > 0 ? colors.textSecondary : colors.disabled} />
                  <Text style={[styles.captureButtonText, { color: paths.length > 0 ? colors.textSecondary : colors.disabled }]}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.captureButton, styles.captureButtonDone]}
                  onPress={() => setIsDrawing(false)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="check" size={16} color={colors.success} />
                  <Text style={[styles.captureButtonText, { color: colors.success }]}>Done</Text>
                </TouchableOpacity>
              </>
            )}
            {/* When frame is captured but not in draw mode, offer Draw or proceed to save */}
            {capturedTimestamp !== null && !isDrawing && (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={() => setIsDrawing(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="brush" size={16} color={colors.accent} />
                <Text style={styles.captureButtonText}>Draw</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Color picker (only when drawing) */}
        {isDrawing && (
          <View style={styles.colorPicker}>
            {DRAW_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  drawColor === c && styles.colorSwatchActive,
                ]}
                onPress={() => setDrawColor(c)}
              />
            ))}
          </View>
        )}

        {/* Comment input (when frame is captured) */}
        {capturedTimestamp !== null && (
          <View style={styles.commentBar}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment at this timestamp..."
              placeholderTextColor={colors.textTertiary}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={2000}
            />
            <View style={styles.commentActions}>
              <TouchableOpacity
                onPress={handleCancelAnnotation}
                style={styles.commentCancelButton}
              >
                <Text style={styles.commentCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.commentSaveButton}
                onPress={handleSaveAnnotation}
                disabled={isSaving}
                activeOpacity={0.7}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.commentSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Annotations list */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={annotations}
            renderItem={renderAnnotation}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[
              styles.annotationsList,
              annotations.length === 0 && { flex: 1 },
            ]}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="chat-outline" size={32} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No annotations yet</Text>
                <Text style={styles.emptyHint}>
                  Tap "Annotate" to mark a moment and draw on the video frame.
                </Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VideoAnnotationScreen;
