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
import { Ionicons } from '@expo/vector-icons';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16;

const DRAW_COLORS = [
  colors.destructive,
  colors.warning,
  '#FFCC00',
  colors.success,
  colors.info,
  colors.white,
];

const formatTimestamp = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

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
  const [isPlaying, setIsPlaying] = useState(false);
  const timeInterval = useRef(null);

  // Refs for PanResponder (avoids stale closure)
  const isDrawingRef = useRef(isDrawing);
  const drawColorRef = useRef(drawColor);
  const currentPathRef = useRef(currentPath);
  isDrawingRef.current = isDrawing;
  drawColorRef.current = drawColor;
  currentPathRef.current = currentPath;

  // Track video time
  useEffect(() => {
    timeInterval.current = setInterval(() => {
      if (player) {
        setCurrentTime(player.currentTime || 0);
      }
    }, 250);
    return () => {
      if (timeInterval.current) clearInterval(timeInterval.current);
    };
  }, [player]);

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
    } catch {
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

  const handleCaptureFrame = useCallback(() => {
    if (player) {
      player.pause();
      setCapturedTimestamp(player.currentTime || 0);
    }
  }, [player]);

  const handleStartDrawing = useCallback(() => {
    if (capturedTimestamp === null) {
      handleCaptureFrame();
    }
    setIsDrawing(true);
  }, [capturedTimestamp, handleCaptureFrame]);

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
          } catch {
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
          <Ionicons name="time-outline" size={14} color={colors.accent} />
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
          <Text style={styles.annotationAuthor}>{authorName}</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteAnnotation(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
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

        {/* Video controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={handlePlayPause} style={styles.controlButton}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={22}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.timeDisplay}>
            {formatTimestamp(currentTime)}
          </Text>
          <View style={styles.controlActions}>
            {!isDrawing && capturedTimestamp === null && (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCaptureFrame}
                activeOpacity={0.7}
              >
                <Ionicons name="pin-outline" size={16} color={colors.accent} />
                <Text style={styles.captureButtonText}>Mark</Text>
              </TouchableOpacity>
            )}
            {!isDrawing && capturedTimestamp !== null && (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleStartDrawing}
                activeOpacity={0.7}
              >
                <Ionicons name="brush-outline" size={16} color={colors.accent} />
                <Text style={styles.captureButtonText}>Draw</Text>
              </TouchableOpacity>
            )}
            {isDrawing && (
              <>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleClearDrawing}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.captureButtonText, { color: colors.textSecondary }]}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.captureButton, { backgroundColor: colors.error + '15' }]}
                  onPress={() => setIsDrawing(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark" size={16} color={colors.success} />
                  <Text style={[styles.captureButtonText, { color: colors.success }]}>Done</Text>
                </TouchableOpacity>
              </>
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
                <Ionicons name="chatbubble-outline" size={32} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No annotations yet</Text>
                <Text style={styles.emptyHint}>
                  Pause the video and tap "Mark" to add your first annotation.
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
