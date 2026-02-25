import React from 'react';
import { StyleSheet } from 'react-native';
import { Portal, Modal, ActivityIndicator } from 'react-native-paper';
import { colors } from '../theme/colors';

const LoadingOverlay = ({ visible = true, size = 'large' }) => {
  return (
    <Portal>
      <Modal
        visible={visible}
        dismissable={false}
        style={styles.modal}
        contentContainerStyle={styles.container}
      >
        <ActivityIndicator size={size} color={colors.primary} />
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoadingOverlay;
