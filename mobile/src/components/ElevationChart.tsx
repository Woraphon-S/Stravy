import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useI18n } from '../i18n/I18nContext';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
  values: Array<number | null>;
  height?: number;
  label?: string;
}

function buildPaths(
  values: number[],
  width: number,
  height: number,
  pad: number,
): { line: string; area: string } {
  let min = values[0];
  let max = values[0];
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = max - min || 1;
  const availW = width - 2 * pad;
  const availH = height - 2 * pad;
  const stepX = values.length > 1 ? availW / (values.length - 1) : 0;

  const coords = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + availH - ((v - min) / span) * availH;
    return { x, y };
  });

  const line = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');
  const area = `${line} L${(pad + availW).toFixed(1)} ${(pad + availH).toFixed(1)} L${pad.toFixed(
    1,
  )} ${(pad + availH).toFixed(1)} Z`;
  return { line, area };
}

export function ElevationChart({ values, height = 120, label }: Props) {
  const { t } = useI18n();
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const numeric = values.filter((v): v is number => v !== null && !Number.isNaN(v));
  const hasData = numeric.length >= 2;
  const paths = hasData && width > 0 ? buildPaths(numeric, width, height, 12) : null;

  return (
    <View style={styles.wrapper}>
      <Text style={[typography.label, styles.label]}>{label ?? t('activity.elevation')}</Text>
      <View style={[styles.chart, { height }]} onLayout={onLayout}>
        {paths && width > 0 ? (
          <Svg width={width} height={height}>
            <Path d={paths.area} fill={colors.primary} fillOpacity={0.15} />
            <Path d={paths.line} fill="none" stroke={colors.primary} strokeWidth={2} />
          </Svg>
        ) : (
          <Text style={[typography.caption, styles.placeholder]}>{t('activity.noElevation')}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chart: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    color: colors.textFaint,
  },
});
