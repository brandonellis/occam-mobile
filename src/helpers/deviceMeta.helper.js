import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * Device metadata collected once at module load time.
 * Shared by logger, ErrorBoundary, and globalErrorHandler
 * for enriching error reports sent to the backend.
 */
const deviceMeta = {
  platform: Platform.OS,
  osVersion: String(Platform.Version),
  appVersion: Constants.expoConfig?.version ?? '0.0.0',
  deviceModel: Device.modelName ?? null,
};

export default deviceMeta;
