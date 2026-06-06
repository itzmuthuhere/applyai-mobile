import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { COLORS } from '../../constants';

export default function HomeScreen() {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>
        Hi{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
      </Text>
      <Text style={styles.subtitle}>Welcome to ApplyAI — Home screen coming in Day 3</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24 },
  greeting: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary },
});
