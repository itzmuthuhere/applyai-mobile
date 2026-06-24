import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants';

interface Props {
  topInset: number;
}

export default function GlobalSearchBar({ topInset }: Props) {
  const navigation = useNavigation<any>();

  const openSearch = () => {
    navigation.navigate('FeedTab', {
      screen: 'Search',
      params: { initialQuery: '' },
    });
  };

  return (
    <View style={[styles.wrapper, { paddingTop: topInset }]}>
      <TouchableOpacity
        style={styles.bar}
        onPress={openSearch}
        activeOpacity={0.85}
        testID="global-search-bar"
      >
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={styles.icon} />
        <Text style={styles.placeholder}>Search people, posts, hashtags...</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 100,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  icon: { marginRight: 8 },
  placeholder: { color: COLORS.textMuted, fontSize: 14, flex: 1 },
});
