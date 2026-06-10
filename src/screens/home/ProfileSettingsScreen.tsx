import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { COLORS, ROUTES } from '../../constants';

// authSlice logout action — import from existing slice
import { signOut } from '../../store/slices/authSlice';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

export default function ProfileSettingsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const user = useSelector((s: RootState) => s.auth.user);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => dispatch(signOut()),
      },
    ]);
  };

  const menuItems: MenuItem[] = [
    { icon: 'bar-chart-outline', label: 'Analytics', onPress: () => navigation.navigate('Analytics') },
    { icon: 'cash-outline', label: 'Salary Intelligence', onPress: () => navigation.navigate('SalaryIntel') },
    { icon: 'trending-up-outline', label: 'Negotiation Coach', onPress: () => navigation.navigate('NegotiationCoach') },
    { icon: 'ban-outline', label: 'Company Blacklist', onPress: () => navigation.navigate('Blacklist') },
    { icon: 'diamond-outline', label: 'Upgrade Plan', onPress: () => navigation.navigate('Paywall', {}) },
    { icon: 'log-out-outline', label: 'Log Out', onPress: handleLogout, color: COLORS.error },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatar}>
          <Ionicons name="person-circle-outline" size={72} color={COLORS.primary} />
          <Text style={styles.name}>{user?.name ?? 'User'}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
        </View>

        <View style={styles.planCard}>
          <Ionicons name="flash-outline" size={20} color={COLORS.warning} />
          <Text style={styles.planText}>Free Plan</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Paywall', {})}>
            <Text style={styles.upgradeLink}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={[styles.menuItem, i < menuItems.length - 1 && styles.menuDivider]}
              onPress={item.onPress}>
              <Ionicons name={item.icon} size={20} color={item.color ?? COLORS.textSecondary} />
              <Text style={[styles.menuLabel, item.color ? { color: item.color } : {}]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.version}>ApplyAI v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16 },
  avatar: { alignItems: 'center', marginBottom: 20 },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8 },
  email: { fontSize: 14, color: COLORS.textSecondary },
  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  planText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  upgradeLink: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  menuCard: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginTop: 24 },
});
