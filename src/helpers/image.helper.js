import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import logger from './logger.helper';

/**
 * Convert a HEIC/HEIF image to JPEG before upload.
 *
 * iOS devices capture photos in HEIC format which has limited cross-platform
 * support (Android, Windows, older browsers cannot render HEIC). This helper
 * uses expo-image-manipulator to re-encode the image as JPEG.
 *
 * For non-HEIC images or videos, returns the original asset unchanged.
 *
 * @param {{ uri: string, fileName?: string, mimeType?: string, type?: string }} asset
 * @param {number} [quality=0.85] - JPEG compression quality (0-1)
 * @returns {Promise<{ uri: string, fileName: string, mimeType: string }>}
 */
export const convertHeicToJpeg = async (asset, quality = 0.85) => {
  const fileName = asset.fileName || asset.uri.split('/').pop() || 'upload';
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mime = (asset.mimeType || '').toLowerCase();

  const isHeic = ext === 'heic' || ext === 'heif' || mime === 'image/heic' || mime === 'image/heif';
  const isImage = asset.type === 'image' || mime.startsWith('image/');

  if (!isHeic || !isImage) {
    return {
      uri: asset.uri,
      fileName,
      mimeType: asset.mimeType || getMimeFromExtension(ext),
    };
  }

  try {
    const result = await manipulateAsync(
      asset.uri,
      [],
      { format: SaveFormat.JPEG, compress: quality }
    );

    const jpegName = fileName.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');

    return {
      uri: result.uri,
      fileName: jpegName,
      mimeType: 'image/jpeg',
    };
  } catch (err) {
    logger.warn('HEIC→JPEG conversion failed, using original:', err?.message);
    return {
      uri: asset.uri,
      fileName,
      mimeType: asset.mimeType || 'image/jpeg',
    };
  }
};

/**
 * Determine MIME type from file extension.
 */
const getMimeFromExtension = (ext) => {
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    case 'mp4':
      return 'video/mp4';
    case 'mov':
      return 'video/quicktime';
    default:
      return 'application/octet-stream';
  }
};
