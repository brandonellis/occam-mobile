import React, { useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StatusBar, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SCREENS } from '../../constants/navigation.constants';
import { videoRecordingStyles as styles } from '../../styles/videoRecording.styles';
import { colors } from '../../theme';
import logger from '../../helpers/logger.helper';

const VideoRecordingScreen = ({ navigation }) => {
  const launchCamera = useCallback(async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow camera access to record coaching videos.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        videoMaxDuration: 300,
        videoQuality: 0,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        navigation.replace(SCREENS.VIDEO_REVIEW, {
          videoUri: result.assets[0].uri,
        });
      } else {
        navigation.goBack();
      }
    } catch (err) {
      logger.warn('Camera launch failed:', err);
      const detail = err?.message || err?.code || JSON.stringify(err) || 'Unknown error';
      Alert.alert(
        'Camera Unavailable',
        `Could not open the camera.\n\n${detail}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [navigation]);

  useEffect(() => {
    launchCamera();
  }, [launchCamera]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.textInverse} />
      </View>
    </View>
  );
};

export default VideoRecordingScreen;
