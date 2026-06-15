import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { ElevationChart } from '../../components/ElevationChart';
import { ErrorText, Loading } from '../../components/Feedback';
import { RoutePreview } from '../../components/RoutePreview';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useI18n } from '../../i18n/I18nContext';
import { ActivityIcon, IconComment, IconHeart, IconTrash } from '../../icons';
import { ApiError } from '../../lib/api';
import { activitiesApi, commentsApi } from '../../lib/endpoints';
import {
  formatCalories,
  formatDistance,
  formatDuration,
  formatElevation,
  formatPace,
  formatRelativeTime,
  formatSpeed,
  isPaceType,
} from '../../lib/format';
import { Activity, Comment, TrackPoint } from '../../lib/types';
import { ActivityDetailProps } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import { useAuth } from '../auth/AuthContext';

export function ActivityDetailScreen({ route, navigation }: ActivityDetailProps) {
  const { id } = route.params;
  const { user } = useAuth();
  const { t } = useI18n();
  const units = user?.units ?? 'metric';

  const [activity, setActivity] = useState<Activity | null>(null);
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const kudoBusy = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [detail, track, list] = await Promise.all([
        activitiesApi.get(id),
        activitiesApi.points(id),
        commentsApi.list(id),
      ]);
      setActivity(detail);
      setPoints(track);
      setComments(list);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('activity.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleKudos = async () => {
    if (!activity || kudoBusy.current) return;
    kudoBusy.current = true;
    const next = !activity.kudoedByMe;
    setActivity({
      ...activity,
      kudoedByMe: next,
      kudosCount: activity.kudosCount + (next ? 1 : -1),
    });
    try {
      const result = next ? await activitiesApi.kudo(id) : await activitiesApi.unkudo(id);
      setActivity((prev) => (prev ? { ...prev, kudoedByMe: result.kudoed } : prev));
    } catch {
      setActivity((prev) =>
        prev
          ? { ...prev, kudoedByMe: !next, kudosCount: prev.kudosCount + (next ? -1 : 1) }
          : prev,
      );
    } finally {
      kudoBusy.current = false;
    }
  };

  const addComment = async () => {
    const body = commentText.trim();
    if (!body) return;
    setPosting(true);
    try {
      const created = await commentsApi.add(id, body);
      setComments((prev) => [...prev, created]);
      setCommentText('');
      setActivity((prev) => (prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('activity.errorComment'));
    } finally {
      setPosting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(t('activity.deleteTitle'), t('activity.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await activitiesApi.remove(id);
            navigation.goBack();
          } catch (e) {
            setError(e instanceof ApiError ? e.message : t('activity.errorDelete'));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (error || !activity) {
    return (
      <Screen>
        <View style={styles.errorWrap}>
          <ErrorText message={error ?? t('activity.notFound')} />
          <Button label={t('common.retry')} variant="secondary" onPress={load} style={styles.retry} />
        </View>
      </Screen>
    );
  }

  const isOwner = user?.id === activity.userId;
  const speedLabel = isPaceType(activity.type) ? t('activity.pace') : t('activity.avgSpeed');
  const speedValue = isPaceType(activity.type)
    ? formatPace(activity.avgSpeedMps, units)
    : formatSpeed(activity.avgSpeedMps, units);

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <RoutePreview points={points} height={220} />

          <View style={styles.titleRow}>
            <ActivityIcon type={activity.type} size={22} color={colors.primary} />
            <Text style={[typography.h1, styles.title]}>{activity.title}</Text>
          </View>

          <View style={styles.author}>
            <Avatar name={activity.author.displayName} photoUrl={activity.author.photoUrl} size={36} />
            <View style={styles.authorText}>
              <Text style={typography.title}>{activity.author.displayName}</Text>
              <Text style={typography.caption}>{formatRelativeTime(activity.startedAt, t)}</Text>
            </View>
          </View>

          <View style={styles.grid}>
            <Metric label={t('activity.distance')} value={formatDistance(activity.distanceM, units)} />
            <Metric label={t('activity.movingTime')} value={formatDuration(activity.movingSeconds)} />
            <Metric label={speedLabel} value={speedValue} />
            <Metric label={t('activity.elevation')} value={formatElevation(activity.elevationGainM, units)} />
            <Metric label={t('activity.calories')} value={formatCalories(activity.calories)} />
            <Metric label={t('activity.maxSpeed')} value={formatSpeed(activity.maxSpeedMps, units)} />
          </View>

          <ElevationChart values={points.map((p) => p.elevationM)} />

          <View style={styles.actions}>
            <Pressable style={styles.action} onPress={toggleKudos}>
              <IconHeart
                size={22}
                color={activity.kudoedByMe ? colors.primary : colors.textMuted}
                filled={activity.kudoedByMe}
              />
              <Text style={[typography.label, styles.actionText]}>
                {t('activity.kudos', { count: activity.kudosCount })}
              </Text>
            </Pressable>
            <View style={styles.action}>
              <IconComment size={22} color={colors.textMuted} />
              <Text style={[typography.label, styles.actionText]}>
                {t('activity.comments', { count: activity.commentCount })}
              </Text>
            </View>
            {isOwner ? (
              <Pressable style={[styles.action, styles.deleteAction]} onPress={confirmDelete}>
                <IconTrash size={20} color={colors.danger} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.comments}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Avatar
                  name={comment.author.displayName}
                  photoUrl={comment.author.photoUrl}
                  size={32}
                />
                <View style={styles.commentBody}>
                  <Text style={typography.label}>{comment.author.displayName}</Text>
                  <Text style={typography.body}>{comment.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.addComment}>
            <TextField
              label={t('activity.addComment')}
              value={commentText}
              onChangeText={setCommentText}
              autoCapitalize="sentences"
              placeholder={t('activity.commentPlaceholder')}
            />
            <Button label={t('activity.post')} onPress={addComment} loading={posting} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[typography.h2, styles.metricValue]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={typography.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  retry: {
    marginTop: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  title: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  authorText: {
    marginLeft: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
  },
  metric: {
    width: '33%',
    marginBottom: spacing.lg,
  },
  metricValue: {
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xl,
  },
  actionText: {
    marginLeft: spacing.xs,
    color: colors.textMuted,
  },
  deleteAction: {
    marginLeft: 'auto',
    marginRight: 0,
  },
  comments: {
    marginTop: spacing.lg,
  },
  comment: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  commentBody: {
    flex: 1,
    marginLeft: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  addComment: {
    marginTop: spacing.lg,
  },
});
