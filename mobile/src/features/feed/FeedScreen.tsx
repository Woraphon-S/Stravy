import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { EmptyState, ErrorText, Loading } from '../../components/Feedback';
import { Screen } from '../../components/Screen';
import { IconHome } from '../../icons';
import { useI18n } from '../../i18n/I18nContext';
import { ApiError } from '../../lib/api';
import { feedApi } from '../../lib/endpoints';
import { Activity } from '../../lib/types';
import { FeedTabProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../auth/AuthContext';

const PAGE_SIZE = 20;

export function FeedScreen({ navigation }: FeedTabProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const units = user?.units ?? 'metric';

  const [items, setItems] = useState<Activity[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const initialized = useRef(false);

  const loadFirst = useCallback(async () => {
    if (busy.current) {
      setRefreshing(false);
      return;
    }
    busy.current = true;
    try {
      setError(null);
      const page = await feedApi.get({ limit: PAGE_SIZE });
      setItems(page.items);
      setCursor(page.nextCursor);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('feed.errorLoad'));
    } finally {
      busy.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      if (!initialized.current) {
        initialized.current = true;
        loadFirst();
      }
    }, [loadFirst]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadFirst();
  };

  const loadMore = async () => {
    if (!cursor || busy.current) return;
    busy.current = true;
    setLoadingMore(true);
    try {
      const page = await feedApi.get({ before: cursor, limit: PAGE_SIZE });
      setItems((prev) => {
        const seen = new Set(prev.map((activity) => activity.id));
        return [...prev, ...page.items.filter((activity) => !seen.has(activity.id))];
      });
      setCursor(page.nextCursor);
    } catch {
      setError(t('feed.errorMore'));
    } finally {
      busy.current = false;
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Loading label={t('feed.loading')} />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={typography.h1}>{t('feed.title')}</Text>
      </View>
      {error ? (
        <View style={styles.errorWrap}>
          <ErrorText message={error} />
        </View>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ActivityCard
            activity={item}
            units={units}
            onPress={() => navigation.navigate('ActivityDetail', { id: item.id })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        ListEmptyComponent={
          <EmptyState
            title={t('feed.emptyTitle')}
            message={t('feed.emptyMessage')}
            icon={<IconHome size={40} color={colors.textFaint} />}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  errorWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
});
