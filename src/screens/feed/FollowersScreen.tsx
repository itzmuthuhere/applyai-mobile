import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import apiClient from '../../api/apiClient';
import { FeedStackParamList } from '../../navigation/types';
import WebPageContainer from '../../components/common/WebPageContainer';

type RouteT = RouteProp<FeedStackParamList, 'Followers'>;

interface FollowUser {
  id: number;
  name: string;
  headline?: string;
  profilePicture?: string;
  followersCount: number;
  followingCount: number;
}

export default function FollowersScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const { userId, userName } = route.params;

  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get(API_ENDPOINTS.USER_FOLLOWERS(userId), { params: { page: 0, size: 50 } });
        setUsers(data.content ?? []);
      } catch {}
      setLoading(false);
    })();
  }, [userId]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userName ? `${userName}'s` : ''} Followers</Text>
        <View style={{ width: 34 }} />
      </View>

      <WebPageContainer maxWidth={640}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          testID="followers-list"
          data={users}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => navigation.navigate('PublicProfile', { userId: item.id, userName: item.name })}
              activeOpacity={0.8}
            >
              {item.profilePicture ? (
                <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                {item.headline ? <Text style={styles.userHeadline} numberOfLines={1}>{item.headline}</Text> : null}
                <Text style={styles.userFollowers}>{item.followersCount} followers</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={52} color={colors.border} />
              <Text style={styles.emptyText}>No followers yet</Text>
            </View>
          }
          contentContainerStyle={users.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      </WebPageContainer>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  userHeadline: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  userFollowers: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  });
}
