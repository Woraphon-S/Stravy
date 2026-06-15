import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '../../components/Button';
import { ErrorText } from '../../components/Feedback';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useI18n } from '../../i18n/I18nContext';
import { ApiError } from '../../lib/api';
import { LoginProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from './AuthContext';

export function LoginScreen({ navigation }: LoginProps) {
  const { signIn } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('auth.errorSignIn'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[typography.display, styles.brand]}>Stravy</Text>
          <Text style={[typography.body, styles.subtitle]}>{t('auth.tagline')}</Text>

          <TextField
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder={t('auth.emailPlaceholder')}
          />
          <TextField
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={t('auth.passwordPlaceholder')}
          />

          {error ? <ErrorText message={error} /> : null}

          <Button label={t('auth.signIn')} onPress={submit} loading={loading} style={styles.primary} />
          <Button
            label={t('auth.createAccount')}
            variant="ghost"
            onPress={() => navigation.navigate('Register')}
            style={styles.secondary}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  brand: {
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  primary: {
    marginTop: spacing.md,
  },
  secondary: {
    marginTop: spacing.sm,
  },
});
