import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, SafeAreaView, ActivityIndicator, FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RootState } from '../../store';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import apiClient from '../../api/apiClient';
import { FeedStackParamList } from '../../navigation/types';
import WebPageContainer from '../../components/common/WebPageContainer';

dayjs.extend(relativeTime);

type RouteT = RouteProp<FeedStackParamList, 'PublicProfile'>;

interface PublicProfile {
  id: number;
  name: string;
  headline?: string;
  profilePicture?: string;
  targetRole?: string;
  targetLocation?: string;
  skills: string[];
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

interface UserPost {
  id: number;
  content: string;
  imageUrl?: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export default function PublicProfileScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const { userId, userName } = route.params;
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isOwnProfile = currentUser?.id === userId;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profileRes, postsRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.PUBLIC_PROFILE(userId)),
        apiClient.get(API_ENDPOINTS.USER_POSTS(userId), { params: { page: 0, size: 10 } }),
      ]);
      setProfile(profileRes.data);
      setFollowing(profileRes.data.isFollowing ?? false);
      setPosts(postsRes.data.content ?? []);
    } catch {}
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function handleFollow() {
    if (!profile || isOwnProfile) return;
    setFollowLoading(true);
    try {
      if (following) {
        await apiClient.delete(API_ENDPOINTS.FOLLOW(userId));
        setFollowing(false);
        setProfile(p => p ? { ...p, followersCount: p.followersCount - 1 } : p);
      } else {
        await apiClient.post(API_ENDPOINTS.FOLLOW(userId));
        setFollowing(true);
        setProfile(p => p ? { ...p, followersCount: p.followersCount + 1 } : p);
      }
    } catch {}
    setFollowLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const name = profile?.name ?? userName ?? 'User';
  const initial = name.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <WebPageContainer maxWidth={680}>
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
          {profile?.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}
          {profile?.targetLocation ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.locationText}>{profile.targetLocation}</Text>
            </View>
          ) : null}

          {/* Follow stats */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('Followers', { userId, userName: name })}
            >
              <Text style={styles.statNumber}>{profile?.followersCount ?? 0}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('Following', { userId, userName: name })}
            >
              <Text style={styles.statNumber}>{profile?.followingCount ?? 0}</Text>
              <Text style={styles.statLabel}>following</Text>
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {!isOwnProfile && (
              <TouchableOpacity
                testID="follow-btn"
                style={[styles.followBtn, following && styles.followingBtn]}
                onPress={handleFollow}
                disabled={followLoading}
                activeOpacity={0.85}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={following ? colors.primary : '#fff'} />
                ) : (
                  <>
                    <Ionicons
                      name={following ? 'checkmark' : 'person-add-outline'}
                      size={15} color={following ? colors.primary : '#fff'}
                    />
                    <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
                      {following ? 'Following' : 'Follow'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
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
              <Ionicons name="chatbubble-outline" size={15} color={colors.primary} />
              <Text style={styles.messageBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Looking for */}
        {profile?.targetRole && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Looking for</Text>
            <View style={styles.roleChip}>
              <Ionicons name="briefcase-outline" size={14} color={colors.primary} />
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

        {/* Recent posts */}
        {posts.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Posts</Text>
            {posts.slice(0, 5).map(post => (
              <TouchableOpacity
                key={post.id}
                style={styles.postItem}
                onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                activeOpacity={0.8}
              >
                <Text style={styles.postContent} numberOfLines={3}>{post.content}</Text>
                {post.imageUrl ? (
                  <Image source={{ uri: post.imageUrl }} style={styles.postThumb} resizeMode="cover" />
                ) : null}
                <View style={styles.postMeta}>
                  <Text style={styles.postMetaText}>👍 {post.likesCount}  💬 {post.commentsCount}</Text>
                  <Text style={styles.postMetaText}>{dayjs(post.createdAt).fromNow()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
        </WebPageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, flex: 1, textAlign: 'center', marginHorizontal: 8 },

  coverBg: { height: 110, backgroundColor: colors.primary },
  avatarSection: { alignItems: 'flex-start', paddingHorizontal: 16, marginTop: -40 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: colors.surface },
  avatarFallback: { backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 32 },

  infoSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, backgroundColor: colors.surface, marginBottom: 10 },
  name: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, marginBottom: 4 },
  headline: { fontSize: 14, color: colors.textSecondary, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  locationText: { fontSize: 13, color: colors.textMuted },

  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  statItem: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 4 },
  statNumber: { fontSize: 17, fontWeight: '900', color: colors.textPrimary },
  statLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },

  actionRow: { flexDirection: 'row', gap: 10 },
  followBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 9,
  },
  followingBtn: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
  followBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  followingBtnText: { color: colors.primary },
  messageBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.primary, borderRadius: 12, paddingVertical: 9,
  },
  messageBtnText: { color: colors.primary, fontWeight: '800', fontSize: 14 },

  card: {
    backgroundColor: colors.surface, marginHorizontal: 12, marginBottom: 10,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },

  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
  },
  roleText: { fontSize: 14, fontWeight: '700', color: colors.primary },

  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  skillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

  postItem: {
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border,
  },
  postContent: { fontSize: 14, color: colors.textPrimary, lineHeight: 20, marginBottom: 8 },
  postThumb: { width: '100%', height: 120, borderRadius: 10, marginBottom: 8 },
  postMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  postMetaText: { fontSize: 12, color: colors.textMuted },
  });
}
