import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { useI18n } from '../i18n/I18nContext';
import { colors, radius, typography } from '../theme';

interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  points: LatLng[];
  height?: number;
}

function extent(values: number[]): { min: number; max: number } {
  let min = values[0];
  let max = values[0];
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

function project(points: LatLng[], width: number, height: number, pad: number): string {
  const latMid = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const k = Math.cos((latMid * Math.PI) / 180) || 1;
  const xs = points.map((p) => p.lng * k);
  const ys = points.map((p) => p.lat);
  const ex = extent(xs);
  const ey = extent(ys);
  const spanX = ex.max - ex.min || 1e-6;
  const spanY = ey.max - ey.min || 1e-6;
  const availW = width - 2 * pad;
  const availH = height - 2 * pad;
  const scale = Math.min(availW / spanX, availH / spanY);
  const drawW = spanX * scale;
  const drawH = spanY * scale;
  const offsetX = pad + (availW - drawW) / 2;
  const offsetY = pad + (availH - drawH) / 2;
  return points
    .map((_, i) => {
      const x = offsetX + (xs[i] - ex.min) * scale;
      const y = offsetY + (ey.max - ys[i]) * scale;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function RoutePreview({ points, height = 200 }: Props) {
  const { t } = useI18n();
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const hasRoute = points.length >= 2;
  const line = hasRoute && width > 0 ? project(points, width, height, 16) : '';
  const coords = line ? line.split(' ') : [];
  const start = coords[0];
  const end = coords[coords.length - 1];

  return (
    <View style={[styles.container, { height }]} onLayout={onLayout}>
      {hasRoute && width > 0 ? (
        <Svg width={width} height={height}>
          <Polyline
            points={line}
            fill="none"
            stroke={colors.primary}
            strokeWidth={4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {start ? (
            <Circle cx={start.split(',')[0]} cy={start.split(',')[1]} r={5} fill={colors.success} />
          ) : null}
          {end ? (
            <Circle cx={end.split(',')[0]} cy={end.split(',')[1]} r={5} fill={colors.danger} />
          ) : null}
        </Svg>
      ) : (
        <Text style={[typography.caption, styles.placeholder]}>{t('activity.noRoute')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
