import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { SCREENS } from '../../constants/navigation.constants';
import { videoRecordingStyles as styles } from '../../styles/videoRecording.styles';
import { globalStyles } from '../../styles/global.styles';
import { colors } from '../../theme';

const VideoRecordingScreen = ({ navigation }) => {
  const cameraRef = useRef(null);
  const timerRef = useRef(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [facing, setFacing] = useState('back');
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const requestPermissions = useCallback(async () => {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!micPermission?.granted) await requestMicPermission();
  }, [cameraPermission, micPermission, requestCameraPermission, requestMicPermission]);

  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  const formatElapsed = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording) return;

    setIsRecording(true);
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: 300,
      });

      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);

      if (video?.uri) {
        navigation.navigate(SCREENS.VIDEO_REVIEW, { videoUri: video.uri });
      }
    } catch (err) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      console.warn('Recording error:', err);
    }
  }, [isRecording, navigation]);

  const handleStopRecording = useCallback(() => {
    if (!cameraRef.current || !isRecording) return;
    cameraRef.current.stopRecording();
  }, [isRecording]);

  const handleFlipCamera = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const handleClose = useCallback(() => {
    if (isRecording) {
      Alert.alert(
        'Stop Recording?',
        'You are currently recording. Are you sure you want to stop and go back?',
        [
          { text: 'Keep Recording', style: 'cancel' },
          {
            text: 'Stop & Go Back',
            style: 'destructive',
            onPress: () => {
              if (cameraRef.current) cameraRef.current.stopRecording();
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [isRecording, navigation]);

  if (!cameraPermission?.granted || !micPermission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="videocam-off-outline" size={48} color={colors.darkText} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionMessage}>
          Please grant camera and microphone access to record coaching videos.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permissionBack} onPress={() => navigation.goBack()}>
          <Text style={styles.permissionBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="video"
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.topButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={28} color={colors.textInverse} />
          </TouchableOpacity>

          {isRecording && (
            <View style={styles.timerBadge}>
              <View style={styles.timerDot} />
              <Text style={styles.timerText}>{formatElapsed(elapsed)}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleFlipCamera}
            style={styles.topButton}
            disabled={isRecording}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name="camera-reverse-outline"
              size={26}
              color={isRecording ? colors.textInverseDisabled : colors.textInverse}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <View style={styles.controlsRow}>
            <View style={globalStyles.spacer48} />

            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              onPress={isRecording ? handleStopRecording : handleStartRecording}
              activeOpacity={0.7}
            >
              {isRecording ? (
                <View style={styles.stopIcon} />
              ) : (
                <View style={styles.recordDot} />
              )}
            </TouchableOpacity>

            <View style={globalStyles.spacer48} />
          </View>

          <Text style={styles.hint}>
            {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
          </Text>
        </View>
      </CameraView>
    </View>
  );
};

export default VideoRecordingScreen;
