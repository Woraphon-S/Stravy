import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface Props {
  label: string;
  value: string;
  big?: boolean;
}

export function StatTile({ label, value, big = false }: Props) {
  return (
    <View style={styles.tile}>
      <Text style={[big ? typography.display : typography.h2, styles.value]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[typography.label, styles.label]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  value: {
    color: colors.text,
  },
  label: {
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
