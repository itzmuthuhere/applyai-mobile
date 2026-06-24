import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, API_ENDPOINTS } from '../../constants';
import apiClient from '../../api/apiClient';
import { FeedStackParamList } from '../../navigation/types';

type RouteT = RouteProp<FeedStackParamList, 'PublicProfile'>;

interface PublicProfile {
  id: number;
  name: string;
  headline?: string;
  profilePicture?: string;
  targetRole?: string;
  targetLocation?: string;
  skills: string[];
}

export default function PublicProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const { userId, userName } = route.params;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC_PROFILE(userId));
        setProfile(data);
      } catch {}
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const name = profile?.name ?? userName ?? 'User';
  const initial = name.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover + Avatar */}
        <View style={styles.coverBg} />
        <View style={styles.avatarSection}>
          {profile?.profilePicture ? (
            <Image source={{ uri: profile.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
        </View>

        {/* Profile info */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>{name}</Text>
          {profile?.headline ? (
            <Text style={styles.headline}>{profile.headline}</Text>
          ) : null}
          {profile?.targetLocation ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.locationText}>{profile.targetLocation}</Text>
            </View>
          ) : null}

          {/* Message button */}
          <TouchableOpacity
            testID="message-btn"
            style={styles.messageBtn}
            onPress={() => navigation.navigate('ChatDetail', {
              partnerId: userId,
              partnerName: name,
              partnerPicture: profile?.profilePicture,
            })}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#fff" />
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Looking for */}
        {profile?.targetRole && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Looking for</Text>
            <View style={styles.roleChip}>
              <Ionicons name="briefcase-outline" size={14} color={COLORS.primary} />
              <Text style={styles.roleText}>{profile.targetRole}</Text>
            </View>
          </View>
        )}

        {/* Skills */}
        {profile?.skills && profile.skills.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Skills</Text>
            <View style={styles.skillsWrap}>
              {profile.skills.map(skill => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, flex: 1, textAlign: 'center', marginHorizontal: 8 },

  coverBg: { height: 110, backgroundColor: COLORS.primary },
  avatarSection: { alignItems: 'flex-start', paddingHorizontal: 16, marginTop: -40 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: COLORS.surface },
  avatarFallback: { backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 32 },

  infoSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, backgroundColor: COLORS.surface, marginBottom: 10 },
  name: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 4 },
  headline: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  locationText: { fontSize: 13, color: COLORS.textMuted },
  messageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9,
  },
  messageBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  card: {
    backgroundColor: COLORS.surface, marginHorizontal: 12, marginBottom: 10,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },

  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
  },
  roleText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    backgroundColor: COLORS.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.border,
  },
  skillText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
});
