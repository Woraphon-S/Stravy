import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '../../components/Button';
import { ErrorText } from '../../components/Feedback';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useI18n } from '../../i18n/I18nContext';
import { ApiError } from '../../lib/api';
import { RegisterProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from './AuthContext';

export function RegisterScreen({ navigation }: RegisterProps) {
  const { signUp } = useAuth();
  const { t } = useI18n();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (password.length < 8) {
      setError(t('auth.errorPasswordShort'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp(displayName.trim(), email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('auth.errorSignUp'));
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
          <Text style={[typography.h1, styles.heading]}>{t('auth.createAccountTitle')}</Text>

          <TextField
            label={t('auth.name')}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            placeholder={t('auth.namePlaceholder')}
          />
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
            placeholder={t('auth.passwordHint')}
          />

          {error ? <ErrorText message={error} /> : null}

          <Button label={t('auth.signUp')} onPress={submit} loading={loading} style={styles.primary} />
          <Button
            label={t('auth.haveAccount')}
            variant="ghost"
            onPress={() => navigation.goBack()}
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
  heading: {
    marginBottom: spacing.xl,
  },
  primary: {
    marginTop: spacing.md,
  },
  secondary: {
    marginTop: spacing.sm,
  },
});
