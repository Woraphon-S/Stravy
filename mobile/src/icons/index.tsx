import React from 'react';
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import { colors } from '../theme';

export interface IconProps {
  size?: number;
  color?: string;
}

function base(size?: number) {
  return { width: size ?? 24, height: size ?? 24, viewBox: '0 0 24 24' };
}

const stroke = {
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IconHome({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M3 9.5 12 3l9 6.5" stroke={color} {...stroke} />
      <Path d="M5 9.5V21h14V9.5" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconUser({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx="12" cy="8" r="4" stroke={color} {...stroke} />
      <Path d="M4 21c0-4 4-6 8-6s8 2 8 6" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconPlus({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} {...stroke} />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconHeart({ size, color = colors.text, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M12 20s-7-4.5-9.5-9C1 8 2.5 4.5 6 4.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 15.5 12 20 12 20z"
        stroke={color}
        fill={filled ? color : 'none'}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconComment({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5A8 8 0 1 1 21 12z" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconPlay({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Polygon points="7,5 19,12 7,19" fill={color} />
    </Svg>
  );
}

export function IconPause({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Rect x="6" y="5" width="4" height="14" rx="1" fill={color} />
      <Rect x="14" y="5" width="4" height="14" rx="1" fill={color} />
    </Svg>
  );
}

export function IconStop({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Rect x="6" y="6" width="12" height="12" rx="2" fill={color} />
    </Svg>
  );
}

export function IconChevronLeft({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Polyline points="15,18 9,12 15,6" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconChevronRight({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Polyline points="9,18 15,12 9,6" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconLock({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Rect x="5" y="11" width="14" height="9" rx="2" stroke={color} {...stroke} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconGlobe({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx="12" cy="12" r="9" stroke={color} {...stroke} />
      <Line x1="3" y1="12" x2="21" y2="12" stroke={color} {...stroke} />
      <Path d="M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconUsers({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx="9" cy="8" r="3.2" stroke={color} {...stroke} />
      <Path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" stroke={color} {...stroke} />
      <Path d="M16 5.5a3.2 3.2 0 0 1 0 6.4M17 15c2.5.4 4 2 4 5" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconEdit({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M4 20h4L19 9l-4-4L4 16v4z" stroke={color} {...stroke} />
      <Line x1="14" y1="6" x2="18" y2="10" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconTrash({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Polyline points="4,7 20,7" stroke={color} {...stroke} />
      <Path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke={color} {...stroke} />
      <Path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconShare({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx="6" cy="12" r="2.5" stroke={color} {...stroke} />
      <Circle cx="18" cy="6" r="2.5" stroke={color} {...stroke} />
      <Circle cx="18" cy="18" r="2.5" stroke={color} {...stroke} />
      <Line x1="8.2" y1="10.8" x2="15.8" y2="7.2" stroke={color} {...stroke} />
      <Line x1="8.2" y1="13.2" x2="15.8" y2="16.8" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconLogout({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" stroke={color} {...stroke} />
      <Polyline points="17,8 21,12 17,16" stroke={color} {...stroke} />
      <Line x1="21" y1="12" x2="9" y2="12" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconBike({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx="5.5" cy="17.5" r="3.5" stroke={color} {...stroke} />
      <Circle cx="18.5" cy="17.5" r="3.5" stroke={color} {...stroke} />
      <Path d="M5.5 17.5 9 9h5l3.5 8.5M9 9l2-3h3" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconRun({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx="15" cy="5" r="2" stroke={color} {...stroke} />
      <Path d="M5 13l3-2 4 1 2 3M12 12l-1 4-3 3M14 9l3 1 2-1" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconWalk({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx="13" cy="4.5" r="2" stroke={color} {...stroke} />
      <Path d="M10 9l3-1 2 3 2 1M13 8l-1 5 2 6M12 13l-3 2-1 4" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconMountain({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M3 19 10 7l4 6 2-3 5 9z" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconClock({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx="12" cy="12" r="9" stroke={color} {...stroke} />
      <Polyline points="12,7 12,12 16,14" stroke={color} {...stroke} />
    </Svg>
  );
}

export function IconDownload({ size, color = colors.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M12 3v12" stroke={color} {...stroke} />
      <Polyline points="7,11 12,16 17,11" stroke={color} {...stroke} />
      <Path d="M5 19h14" stroke={color} {...stroke} />
    </Svg>
  );
}

export type ActivityKind = 'run' | 'ride' | 'walk' | 'hike' | 'swim';

export function ActivityIcon({ type, size, color }: IconProps & { type: ActivityKind }) {
  if (type === 'ride') return <IconBike size={size} color={color} />;
  if (type === 'walk') return <IconWalk size={size} color={color} />;
  if (type === 'hike') return <IconMountain size={size} color={color} />;
  return <IconRun size={size} color={color} />;
}
