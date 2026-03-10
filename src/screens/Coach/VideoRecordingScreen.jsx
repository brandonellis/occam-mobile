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

      const microphonePermission = await ImagePicker.requestMicrophonePermissionsAsync();
      if (microphonePermission.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow microphone access to record audio with coaching videos.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        videoMaxDuration: 300,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
        allowsEditing: false,
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
      Alert.alert(
        'Camera Unavailable',
        'We could not open the camera. Please try again.',
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
