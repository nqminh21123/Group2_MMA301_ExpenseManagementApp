// frontend/components/common/Loading.js
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { COLORS } from '../../utils/constants';

const Loading = ({ text = 'Đang tải...', fullScreen = true }) => {
  if (fullScreen) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size="small" color={COLORS.primary} />
      {text && <Text style={styles.inlineText}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.dark,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  inlineText: {
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.dark,
  },
});

export default Loading;
