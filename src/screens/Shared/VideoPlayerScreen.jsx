import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { videoPlayerStyles as styles } from '../../styles/videoPlayer.styles';
import { colors } from '../../theme';

const VideoPlayerScreen = ({ route, navigation }) => {
  const { videoUrl, videoTitle } = route.params;

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
    p.play();
  });

  const [isPlaying, setIsPlaying] = useState(true);

  React.useEffect(() => {
    if (!player) return;
    const subscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });
    return () => subscription?.remove();
  }, [player]);

  const handlePlayPause = useCallback(() => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, isPlaying]);

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
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.videoWrapper}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls
        />
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={handlePlayPause} style={styles.controlButton}>
          <Ionicons
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={48}
            color={colors.textInverse}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default VideoPlayerScreen;
