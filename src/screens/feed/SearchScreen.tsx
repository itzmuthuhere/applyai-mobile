import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import apiClient from '../../api/apiClient';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { FeedStackParamList } from '../../navigation/types';
import WebPageContainer from '../../components/common/WebPageContainer';

type Nav = NativeStackNavigationProp<FeedStackParamList, 'Search'>;
type FilterTab = 'All' | 'People' | 'Posts' | 'Hashtags';
const TABS: FilterTab[] = ['All', 'People', 'Posts', 'Hashtags'];

interface Person {
  id: number;
  name: string;
  headline?: string;
  profilePicture?: string;
  isFollowing?: boolean;
}

interface PostItem {
  id: number;
  content: string;
  authorName: string;
  authorPicture?: string;
  likesCount?: number;
}

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const [query, setQuery] = useState<string>(route.params?.initialQuery ?? '');
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setPeople([]);
      setPosts([]);
      setHashtags([]);
      return;
    }
    setLoading(true);
    try {
      const encoded = encodeURIComponent(q.trim());
      const tagPrefix = encodeURIComponent(q.replace(/^#/, '').trim().toLowerCase());
      const [pr, fr, hr] = await Promise.allSettled([
        apiClient.get(`${API_ENDPOINTS.USER_SEARCH}?q=${encoded}`),
        apiClient.get(`${API_ENDPOINTS.FEED_SEARCH}?q=${encoded}&page=0&size=15`),
        apiClient.get(`${API_ENDPOINTS.FEED_HASHTAGS_SUGGEST}?q=${tagPrefix}`),
      ]);

      const peopleData: Person[] = pr.status === 'fulfilled'
        ? (Array.isArray(pr.value.data) ? pr.value.data : pr.value.data?.content ?? [])
        : [];
      setPeople(peopleData);

      const fset = new Set<number>();
      peopleData.forEach(p => { if (p.isFollowing) fset.add(p.id); });
      setFollowingSet(fset);

      setPosts(fr.status === 'fulfilled' ? (fr.value.data?.content ?? []) : []);
      setHashtags(hr.status === 'fulfilled' ? (hr.value.data ?? []) : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  const toggleFollow = async (userId: number) => {
    const wasFollowing = followingSet.has(userId);
    setFollowingSet(prev => {
      const next = new Set(prev);
      wasFollowing ? next.delete(userId) : next.add(userId);
      return next;
    });
    try {
      if (wasFollowing) {
        await apiClient.delete(API_ENDPOINTS.FOLLOW(userId));
      } else {
        await apiClient.post(API_ENDPOINTS.FOLLOW(userId));
      }
    } catch {
      setFollowingSet(prev => {
        const next = new Set(prev);
        wasFollowing ? next.add(userId) : next.delete(userId);
        return next;
      });
    }
  };

  const showPeople = activeTab === 'All' || activeTab === 'People';
  const showPosts = activeTab === 'All' || activeTab === 'Posts';
  const showHashtags = activeTab === 'All' || activeTab === 'Hashtags';
  const hasResults = people.length > 0 || posts.length > 0 || hashtags.length > 0;

  const renderPerson = (item: Person) => {
    const isFollowing = followingSet.has(item.id);
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.personRow}
        onPress={() => navigation.navigate('PublicProfile', { userId: item.id, userName: item.name })}
        testID={`person-${item.id}`}
      >
        <View style={styles.avatar}>
          {item.profilePicture
            ? <Image source={{ uri: item.profilePicture }} style={styles.avatarImg} />
            : <Text style={styles.avatarInitial}>{(item.name?.[0] ?? '?').toUpperCase()}</Text>}
        </View>
        <View style={styles.personInfo}>
          <Text style={styles.personName} numberOfLines={1}>{item.name}</Text>
          {item.headline
            ? <Text style={styles.personHeadline} numberOfLines={1}>{item.headline}</Text>
            : null}
        </View>
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          onPress={() => toggleFollow(item.id)}
          testID={`follow-btn-${item.id}`}
        >
          <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderPost = (item: PostItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.postRow}
      onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
      testID={`post-${item.id}`}
    >
      <View style={styles.postMeta}>
        <View style={styles.avatarSm}>
          {item.authorPicture
            ? <Image source={{ uri: item.authorPicture }} style={styles.avatarSmImg} />
            : <Text style={styles.avatarSmInit}>{(item.authorName?.[0] ?? '?').toUpperCase()}</Text>}
        </View>
        <Text style={styles.postAuthor}>{item.authorName}</Text>
      </View>
      <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>
      {(item.likesCount ?? 0) > 0 && (
        <Text style={styles.postStats}>{item.likesCount} likes</Text>
      )}
    </TouchableOpacity>
  );

  const renderResults = () => (
    <ScrollView keyboardShouldPersistTaps="handled">
      {showPeople && people.length > 0 && (
        <View>
          {activeTab === 'All' && <Text style={styles.sectionTitle}>People</Text>}
          {(activeTab === 'All' ? people.slice(0, 3) : people).map(renderPerson)}
          {activeTab === 'All' && people.length > 3 && (
            <TouchableOpacity style={styles.seeAll} onPress={() => setActiveTab('People')}>
              <Text style={styles.seeAllText}>See all {people.length} people</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {showPosts && posts.length > 0 && (
        <View>
          {activeTab === 'All' && <Text style={styles.sectionTitle}>Posts</Text>}
          {(activeTab === 'All' ? posts.slice(0, 3) : posts).map(renderPost)}
          {activeTab === 'All' && posts.length > 3 && (
            <TouchableOpacity style={styles.seeAll} onPress={() => setActiveTab('Posts')}>
              <Text style={styles.seeAllText}>See all {posts.length} posts</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {showHashtags && hashtags.length > 0 && (
        <View>
          {activeTab === 'All' && <Text style={styles.sectionTitle}>Hashtags</Text>}
          <View style={styles.hashtagsWrap}>
            {hashtags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={styles.hashtagChip}
                onPress={() => navigation.navigate('HashtagFeed', { tag })}
                testID={`hashtag-${tag}`}
              >
                <Text style={styles.hashtagText}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.root}>
      {/* Search header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search people, posts, hashtags..."
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="search"
          autoCorrect={false}
          testID="search-input"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsBar}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            testID={`tab-${tab}`}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Body */}
      <WebPageContainer maxWidth={680} style={{ flex: 1 }}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : !query.trim() ? (
        <View style={styles.center} testID="empty-prompt">
          <Ionicons name="search-outline" size={52} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Search ApplyAI</Text>
          <Text style={styles.emptySubtitle}>Find people, posts, and hashtags</Text>
        </View>
      ) : !hasResults ? (
        <View style={styles.center} testID="no-results">
          <Ionicons name="sad-outline" size={52} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No results for "{query}"</Text>
          <Text style={styles.emptySubtitle}>Try different keywords</Text>
        </View>
      ) : (
        renderResults()
      )}
      </WebPageContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  backBtn: { padding: 4 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearBtn: { padding: 4 },
  tabsBar: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 48,
  },
  tabsContent: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  seeAll: { paddingHorizontal: 16, paddingVertical: 10 },
  seeAllText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  // People
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  personInfo: { flex: 1 },
  personName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  personHeadline: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  followingBtn: { backgroundColor: COLORS.primary },
  followBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  followingBtnText: { color: '#fff' },
  // Posts
  postRow: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  postMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  avatarSm: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarSmImg: { width: 28, height: 28, borderRadius: 14 },
  avatarSmInit: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  postAuthor: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  postContent: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  postStats: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  // Hashtags
  hashtagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  hashtagChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
  },
  hashtagText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
});
