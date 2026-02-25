import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { uploadFile } from '../../services/uploads.api';
import { videoReviewStyles as styles } from '../../styles/videoReview.styles';
import { globalStyles } from '../../styles/global.styles';
import { colors } from '../../theme';

const VideoReviewScreen = ({ route, navigation }) => {
  const { videoUri } = route.params;

  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = true;
    p.play();
  });

  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleUpload = useCallback(async () => {
    if (isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = title.trim()
        ? `${title.trim().replace(/\s+/g, '_')}.mp4`
        : `coaching_video_${timestamp}.mp4`;

      await uploadFile(videoUri, {
        uploadableType: 'media_library',
        isLibrary: true,
        filename,
        mimeType: 'video/mp4',
        onProgress: setUploadProgress,
      });

      setUploadComplete(true);

      setTimeout(() => {
        Alert.alert(
          'Upload Complete',
          'Your video has been saved to the Media Library.',
          [
            {
              text: 'Done',
              onPress: () => navigation.popToTop(),
            },
          ]
        );
      }, 400);
    } catch (err) {
      console.warn('Upload failed:', err);
      Alert.alert(
        'Upload Failed',
        err.response?.data?.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      if (!uploadComplete) {
        setIsUploading(false);
      }
    }
  }, [videoUri, title, isUploading, uploadComplete, navigation]);

  const handleDiscard = useCallback(() => {
    Alert.alert(
      'Discard Video?',
      'This recording will be permanently deleted.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleDiscard}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={isUploading}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isUploading ? colors.textInverseDisabled : colors.textInverse}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Video</Text>
        <View style={globalStyles.spacer24} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={globalStyles.flex1}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Video preview */}
          <View style={styles.videoContainer}>
            <VideoView
              player={player}
              style={styles.video}
              contentFit="contain"
              nativeControls
            />
          </View>

          {/* Title input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Title (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Swing Analysis — John"
              placeholderTextColor={colors.textInverseDisabled}
              value={title}
              onChangeText={setTitle}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isUploading}
            />
          </View>

          {/* Upload progress */}
          {isUploading && (
            <View style={styles.progressSection}>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.round(uploadProgress * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {uploadComplete
                  ? 'Upload complete!'
                  : `Uploading... ${Math.round(uploadProgress * 100)}%`}
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
              onPress={handleUpload}
              disabled={isUploading || uploadComplete}
              activeOpacity={0.8}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color={colors.textInverse} />
                  <Text style={styles.uploadButtonText}>
                    Upload to Media Library
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.discardButton}
              onPress={handleDiscard}
              disabled={isUploading}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.discardButtonText,
                isUploading && { opacity: 0.3 },
              ]}>
                Discard Recording
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VideoReviewScreen;
