import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { CHROME_EXTENSION_URL } from '../../constants';

export default function ExtensionInstallCard() {
  const colors = useTheme();
  const styles = makeStyles(colors);

  return (
    <View testID="extension-hint-banner" style={styles.banner}>
      <Ionicons name="extension-puzzle-outline" size={18} color={colors.primary} />
      <View style={styles.textCol}>
        <Text style={styles.title}>Install the ApplyAI Chrome extension</Text>
        <Text style={styles.body}>
          It picks up jobs from your queue and auto-fills applications on Naukri, LinkedIn & Indeed.
          Without it, queued jobs will stay queued.
        </Text>
      </View>
      <TouchableOpacity
        testID="extension-install-btn"
        style={styles.installBtn}
        onPress={() => Linking.openURL(CHROME_EXTENSION_URL).catch(() => {})}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.installBtnText}>Install</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: colors.primaryLight,
    },
    textCol: { flex: 1, gap: 2 },
    title: { fontSize: 13, fontWeight: '700', color: colors.primary },
    body: { fontSize: 12, color: colors.primary, lineHeight: 17 },
    installBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
      alignSelf: 'center',
    },
    installBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  });
}
