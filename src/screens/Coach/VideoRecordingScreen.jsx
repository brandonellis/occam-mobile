import React, { useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SCREENS } from '../../constants/navigation.constants';
import { videoRecordingStyles as styles } from '../../styles/videoRecording.styles';
import { colors } from '../../theme';

const VideoRecordingScreen = ({ navigation }) => {
  const launchCamera = useCallback(async () => {
    try {
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
      console.warn('Camera launch failed:', err);
      navigation.goBack();
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
