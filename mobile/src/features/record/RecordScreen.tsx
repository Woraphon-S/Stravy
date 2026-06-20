import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { ErrorText } from '../../components/Feedback';
import { RoutePreview } from '../../components/RoutePreview';
import { Screen } from '../../components/Screen';
import { SegmentedControl } from '../../components/SegmentedControl';
import { StatTile } from '../../components/StatTile';
import { useI18n } from '../../i18n/I18nContext';
import { TranslationKey } from '../../i18n/translations';
import { ActivityIcon, IconBike, IconRun, IconWalk } from '../../icons';
import { ApiError } from '../../lib/api';
import { activitiesApi } from '../../lib/endpoints';
import { formatDistance, formatDuration, formatPace, formatSpeed, isPaceType } from '../../lib/format';
import { ActivityType } from '../../lib/types';
import { RecordTabProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../auth/AuthContext';
import { useTracker } from './useTracker';

const TYPE_ITEMS: { value: ActivityType; icon: React.ReactNode }[] = [
  { value: 'run', icon: <IconRun size={16} color={colors.textMuted} /> },
  { value: 'ride', icon: <IconBike size={16} color={colors.textMuted} /> },
  { value: 'walk', icon: <IconWalk size={16} color={colors.textMuted} /> },
];

export function RecordScreen({ navigation }: RecordTabProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const units = user?.units ?? 'metric';
  const tracker = useTracker();
  const [type, setType] = useState<ActivityType>('run');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeOptions = TYPE_ITEMS.map((item) => ({
    ...item,
    label: t(`type.${item.value}` as TranslationKey),
  }));
  const avgSpeed = tracker.movingSeconds > 0 ? tracker.distanceM / tracker.movingSeconds : 0;
  const paceValue = isPaceType(type)
    ? formatPace(avgSpeed, units)
    : formatSpeed(avgSpeed, units);

  const finish = async () => {
    const result = tracker.stop();
    if (result.points.length < 2) {
      tracker.reset();
      setError(t('record.errorNoPoints'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const activity = await activitiesApi.create({
        type,
        startedAt: result.startedAt,
        elapsedSeconds: result.elapsedSeconds,
        movingSeconds: result.movingSeconds,
        points: result.points.map((p) => ({
          lat: p.lat,
          lng: p.lng,
          recordedAt: p.recordedAt,
          elevationM: p.elevationM,
          speedMps: p.speedMps,
        })),
      });
      tracker.reset();
      navigation.navigate('ActivityDetail', { id: activity.id });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('record.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const idle = tracker.status === 'idle' || tracker.status === 'denied';

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={typography.h1}>{t('record.title')}</Text>
      </View>

      {idle ? (
        <View style={styles.typeRow}>
          <SegmentedControl options={typeOptions} value={type} onChange={setType} />
        </View>
      ) : (
        <View style={styles.activeType}>
          <ActivityIcon type={type} size={20} color={colors.primary} />
          <Text style={[typography.title, styles.activeTypeLabel]}>
            {t(`type.${type}` as TranslationKey)}
          </Text>
        </View>
      )}

      <View style={styles.metrics}>
        <StatTile label={t('activity.distance')} value={formatDistance(tracker.distanceM, units)} big />
        {!idle ? (
          <View style={styles.route}>
            <RoutePreview points={tracker.points} />
          </View>
        ) : null}
        <View style={styles.row}>
          <StatTile label={t('activity.time')} value={formatDuration(tracker.movingSeconds)} />
          <StatTile
            label={isPaceType(type) ? t('activity.pace') : t('activity.speed')}
            value={paceValue}
          />
        </View>
      </View>

      {error ? <ErrorText message={error} /> : null}

      <View style={styles.controls}>
        {idle ? (
          <Button
            label={t('record.start')}
            onPress={tracker.start}
            loading={tracker.status === 'requesting'}
          />
        ) : null}

        {tracker.status === 'tracking' ? (
          <View style={styles.controlRow}>
            <Button label={t('record.pause')} variant="secondary" onPress={tracker.pause} style={styles.controlButton} />
            <Button label={t('record.finish')} onPress={finish} loading={saving} style={styles.controlButton} />
          </View>
        ) : null}

        {tracker.status === 'paused' ? (
          <View style={styles.controlRow}>
            <Button label={t('record.resume')} variant="secondary" onPress={tracker.resume} style={styles.controlButton} />
            <Button label={t('record.finish')} onPress={finish} loading={saving} style={styles.controlButton} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  typeRow: {
    marginBottom: spacing.xl,
  },
  activeType: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  activeTypeLabel: {
    marginLeft: spacing.sm,
    color: colors.primary,
  },
  metrics: {
    flex: 1,
    justifyContent: 'center',
  },
  route: {
    width: '100%',
    flex: 1,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    marginTop: spacing.xl,
  },
  controls: {
    paddingBottom: spacing.xl,
  },
  controlRow: {
    flexDirection: 'row',
  },
  controlButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});
