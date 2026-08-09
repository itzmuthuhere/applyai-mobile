import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { CHROME_EXTENSION_URL } from '../../constants';
import WebPageContainer from '../../components/common/WebPageContainer';

export default function ExtensionPromptScreen({ onDone }: { onDone: () => void }) {
  const colors = useTheme();
  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <WebPageContainer maxWidth={480}>
        <View style={styles.centerWrap}>
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <Ionicons name="extension-puzzle" size={26} color={colors.primary} />
            </View>
            <Text style={styles.title}>Install the ApplyAI Chrome extension</Text>
            <Text style={styles.subtitle}>
              It's what actually submits your applications — it picks up jobs from your queue
              and auto-fills them on Naukri, LinkedIn &amp; Indeed. Without it, queued jobs just
              stay queued.
            </Text>

            <TouchableOpacity
              testID="extension-prompt-install-btn"
              style={styles.installBtn}
              onPress={() => Linking.openURL(CHROME_EXTENSION_URL).catch(() => {})}
              activeOpacity={0.85}
            >
              <Text style={styles.installBtnText}>Install extension</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="extension-prompt-skip-btn"
              style={styles.skipBtn}
              onPress={onDone}
              activeOpacity={0.7}
            >
              <Text style={styles.skipBtnText}>I'll do this later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </WebPageContainer>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    centerWrap: { flex: 1, justifyContent: 'center', padding: 20, minHeight: '100%' },
    card: {
      backgroundColor: colors.surface, borderRadius: 18, padding: 28,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    },
    iconBox: {
      width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primaryLight,
      alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19, marginBottom: 22 },
    installBtn: {
      width: '100%', backgroundColor: colors.primary, borderRadius: 12,
      paddingVertical: 14, alignItems: 'center',
    },
    installBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    skipBtn: { marginTop: 14, paddingVertical: 6 },
    skipBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  });
}
