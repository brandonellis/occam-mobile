import React from 'react';
import { Avatar as PaperAvatar } from 'react-native-paper';
import { colors } from '../theme/colors';

const Avatar = ({ uri, name, size = 40 }) => {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  if (uri) {
    return (
      <PaperAvatar.Image
        source={{ uri }}
        size={size}
        style={{ backgroundColor: colors.border }}
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

export default Avatar;
