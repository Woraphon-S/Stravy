import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ErrorText } from '../../components/Feedback';
import { Screen } from '../../components/Screen';
import { SegmentedControl } from '../../components/SegmentedControl';
import { TextField } from '../../components/TextField';
import { Language, useI18n } from '../../i18n/I18nContext';
import { TranslationKey } from '../../i18n/translations';
import { IconLogout } from '../../icons';
import { ApiError } from '../../lib/api';
import { usersApi } from '../../lib/endpoints';
import { Privacy, Units } from '../../lib/types';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../auth/AuthContext';

const UNIT_VALUES: Units[] = ['metric', 'imperial'];
const PRIVACY_VALUES: Privacy[] = ['public', 'followers', 'private'];
const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'th', label: 'ไทย' },
];

export function ProfileScreen() {
  const { user, signOut, setUser } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [units, setUnits] = useState<Units>(user?.units ?? 'metric');
  const [privacy, setPrivacy] = useState<Privacy>(user?.defaultPrivacy ?? 'public');
  const [weight, setWeight] = useState(user?.weightKg != null ? String(user.weightKg) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const body: Partial<{ units: Units; defaultPrivacy: Privacy; weightKg: number }> = {
        units,
        defaultPrivacy: privacy,
      };
      const parsedWeight = parseFloat(weight);
      if (!Number.isNaN(parsedWeight)) body.weightKg = parsedWeight;
      const updated = await usersApi.updateMe(body);
      setUser(updated);
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('profile.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const unitOptions = UNIT_VALUES.map((value) => ({
    value,
    label: t(`profile.${value}` as TranslationKey),
  }));
  const privacyOptions = PRIVACY_VALUES.map((value) => ({
    value,
    label: t(`profile.${value}` as TranslationKey),
  }));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Avatar name={user.displayName} photoUrl={user.photoUrl} size={72} />
          <Text style={[typography.h1, styles.name]}>{user.displayName}</Text>
          <Text style={typography.caption}>{user.email}</Text>
        </View>

        <Card style={styles.card}>
          <Text style={[typography.label, styles.sectionLabel]}>{t('profile.language')}</Text>
          <SegmentedControl options={LANGUAGE_OPTIONS} value={language} onChange={setLanguage} />

          <Text style={[typography.label, styles.sectionLabel]}>{t('profile.units')}</Text>
          <SegmentedControl options={unitOptions} value={units} onChange={setUnits} />

          <Text style={[typography.label, styles.sectionLabel]}>{t('profile.privacy')}</Text>
          <SegmentedControl options={privacyOptions} value={privacy} onChange={setPrivacy} />

          <View style={styles.weight}>
            <TextField
              label={t('profile.weight')}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="70"
            />
          </View>

          {error ? <ErrorText message={error} /> : null}
          {saved ? <Text style={[typography.caption, styles.saved]}>{t('common.saved')}</Text> : null}

          <Button label={t('common.save')} onPress={save} loading={saving} />
        </Card>

        <Button
          label={t('profile.logout')}
          variant="ghost"
          onPress={signOut}
          icon={<IconLogout size={18} color={colors.textMuted} />}
          style={styles.logout}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  name: {
    marginTop: spacing.md,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weight: {
    marginTop: spacing.lg,
  },
  saved: {
    color: colors.success,
    marginBottom: spacing.sm,
  },
  logout: {
    marginTop: spacing.sm,
  },
});
