import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActivityIcon, IconComment, IconHeart } from '../icons';
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatRelativeTime,
  formatSpeed,
  isPaceType,
} from '../lib/format';
import { useI18n } from '../i18n/I18nContext';
import { Activity, Units } from '../lib/types';
import { colors, radius, spacing, typography } from '../theme';
import { Avatar } from './Avatar';

interface Props {
  activity: Activity;
  units: Units;
  onPress: () => void;
  hideAuthor?: boolean;
}

export function ActivityCard({ activity, units, onPress, hideAuthor = false }: Props) {
  const { t } = useI18n();
  const pace = isPaceType(activity.type)
    ? formatPace(activity.avgSpeedMps, units)
    : formatSpeed(activity.avgSpeedMps, units);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View style={styles.header}>
        {hideAuthor ? null : (
          <Avatar name={activity.author.displayName} photoUrl={activity.author.photoUrl} size={40} />
        )}
        <View style={[styles.headerText, hideAuthor ? styles.headerTextFlush : null]}>
          {hideAuthor ? null : <Text style={typography.title}>{activity.author.displayName}</Text>}
          <Text style={typography.caption}>{formatRelativeTime(activity.startedAt, t)}</Text>
        </View>
        <View style={styles.typeBadge}>
          <ActivityIcon type={activity.type} size={18} color={colors.primary} />
        </View>
      </View>

      <Text style={[typography.h2, styles.title]}>{activity.title}</Text>

      <View style={styles.stats}>
        <Stat label={t('activity.distance')} value={formatDistance(activity.distanceM, units)} />
        <Stat label={t('activity.time')} value={formatDuration(activity.movingSeconds)} />
        <Stat
          label={isPaceType(activity.type) ? t('activity.pace') : t('activity.speed')}
          value={pace}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.metric}>
          <IconHeart size={18} color={activity.kudoedByMe ? colors.primary : colors.textMuted} filled={activity.kudoedByMe} />
          <Text style={[typography.label, styles.metricText]}>{activity.kudosCount}</Text>
        </View>
        <View style={styles.metric}>
          <IconComment size={18} color={colors.textMuted} />
          <Text style={[typography.label, styles.metricText]}>{activity.commentCount}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[typography.title, styles.statValue]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={typography.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerTextFlush: {
    marginLeft: 0,
  },
  typeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  stat: {
    flex: 1,
  },
  statValue: {
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xl,
  },
  metricText: {
    marginLeft: spacing.xs,
    color: colors.textMuted,
  },
});
