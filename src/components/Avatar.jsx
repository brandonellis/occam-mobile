import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Avatar as PaperAvatar } from 'react-native-paper';
import { colors } from '../theme/colors';
import { resolveMediaUrl } from '../helpers/media.helper';
import logger from '../helpers/logger.helper';

const Avatar = ({ uri, name, size = 40 }) => {
  const [imageFailed, setImageFailed] = useState(false);

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const resolvedUri = resolveMediaUrl(uri);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedUri]);

  if (resolvedUri && !imageFailed) {
    return (
      <PaperAvatar.Image
        source={{ uri: resolvedUri }}
        size={size}
        style={{ backgroundColor: colors.border }}
        onError={() => {
          logger.warn('Avatar image failed to load', { uri: resolvedUri, name });
          setImageFailed(true);
        }}
      />
    );
  }

  return (
    <PaperAvatar.Text
      label={initials}
      size={size}
      style={{ backgroundColor: colors.primaryLight }}
      labelStyle={{ fontWeight: '600' }}
      color={colors.textInverse}
    />
  );
};

Avatar.propTypes = {
  uri: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.number,
};

export default Avatar;
