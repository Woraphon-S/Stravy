import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { EmptyState, ErrorText, Loading } from '../../components/Feedback';
import { Screen } from '../../components/Screen';
import { StatTile } from '../../components/StatTile';
import { TextField } from '../../components/TextField';
import { useI18n } from '../../i18n/I18nContext';
import { IconCamera, IconChevronRight, IconEdit, IconRun, IconSettings } from '../../icons';
import { ApiError } from '../../lib/api';
import { activitiesApi, usersApi } from '../../lib/endpoints';
import { formatDistance, formatDuration } from '../../lib/format';
import { Activity } from '../../lib/types';
import { ProfileTabProps } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import { useAuth } from '../auth/AuthContext';

export function ProfileScreen({ navigation }: ProfileTabProps) {
  const { user, setUser } = useAuth();
  const { t } = useI18n();
  const units = user?.units ?? 'metric';

  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);
  const initialized = useRef(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const page = await activitiesApi.list({ userId: user.id, limit: 50 });
      setItems(page.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('profile.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useFocusEffect(
    useCallback(() => {
      if (!initialized.current) {
        initialized.current = true;
        load();
      }
    }, [load]),
  );

  if (!user) return null;

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t('profile.permissionPhoto'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    setError(null);
    try {
      const updated = await usersApi.uploadPhoto({
        uri: asset.uri,
        name: asset.fileName ?? 'photo.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
      setUser(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('profile.errorPhoto'));
    } finally {
      setUploading(false);
    }
  };

  const startEditName = () => {
    setName(user.displayName);
    setEditingName(true);
  };

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === user.displayName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    setError(null);
    try {
      const updated = await usersApi.updateMe({ displayName: trimmed });
      setUser(updated);
      setEditingName(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('profile.errorName'));
    } finally {
      setSavingName(false);
    }
  };

  const totalDistanceM = items.reduce((sum, activity) => sum + activity.distanceM, 0);
  const totalTimeS = items.reduce((sum, activity) => sum + activity.movingSeconds, 0);

  const header = (
    <View style={styles.header}>
      <View style={styles.identity}>
        <Pressable style={styles.avatarWrap} onPress={pickPhoto}>
          <Avatar name={user.displayName} photoUrl={user.photoUrl} size={96} />
          <View style={styles.cameraBadge}>
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconCamera size={16} color="#FFFFFF" />
            )}
          </View>
        </Pressable>

        {editingName ? (
          <View style={styles.nameEdit}>
            <TextField
              value={name}
              onChangeText={setName}
              placeholder={t('profile.namePlaceholder')}
              autoCapitalize="words"
            />
            <View style={styles.nameEditButtons}>
              <Button
                label={t('common.cancel')}
                variant="secondary"
                onPress={() => setEditingName(false)}
                style={styles.nameEditButton}
              />
              <Button
                label={t('profile.saveName')}
                onPress={saveName}
                loading={savingName}
                style={styles.nameEditButton}
              />
            </View>
          </View>
        ) : (
          <Pressable style={styles.nameRow} onPress={startEditName}>
            <Text style={[typography.h1, styles.name]}>{user.displayName}</Text>
            <IconEdit size={18} color={colors.textMuted} />
          </Pressable>
        )}

        <Text style={typography.caption}>{user.email}</Text>
      </View>

      <View style={styles.statsBox}>
        <StatTile label={t('profile.activities')} value={String(items.length)} />
        <StatTile label={t('profile.totalDistance')} value={formatDistance(totalDistanceM, units)} />
        <StatTile label={t('profile.totalTime')} value={formatDuration(totalTimeS)} />
      </View>

      <Pressable style={styles.settingsRow} onPress={() => navigation.navigate('Settings')}>
        <IconSettings size={20} color={colors.text} />
        <Text style={[typography.title, styles.settingsLabel]}>{t('profile.settings')}</Text>
        <IconChevronRight size={20} color={colors.textMuted} />
      </Pressable>

      {error ? (
        <View style={styles.errorWrap}>
          <ErrorText message={error} />
        </View>
      ) : null}

      <Text style={[typography.label, styles.sectionLabel]}>{t('profile.yourActivities')}</Text>
    </View>
  );

  return (
    <Screen padded={false}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <ActivityCard
            activity={item}
            units={units}
            hideAuthor
            onPress={() => navigation.navigate('ActivityDetail', { id: item.id })}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <Loading />
          ) : (
            <EmptyState
              title={t('profile.noActivities')}
              icon={<IconRun size={40} color={colors.textFaint} />}
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing.sm,
  },
  identity: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    marginBottom: spacing.md,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    marginRight: spacing.sm,
  },
  nameEdit: {
    width: '100%',
  },
  nameEditButtons: {
    flexDirection: 'row',
  },
  nameEditButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  statsBox: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  settingsLabel: {
    flex: 1,
    marginLeft: spacing.md,
  },
  errorWrap: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
});
