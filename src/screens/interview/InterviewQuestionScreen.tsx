import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

export default function InterviewQuestionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Interview Question — Day 11</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18, color: COLORS.textSecondary },
});
