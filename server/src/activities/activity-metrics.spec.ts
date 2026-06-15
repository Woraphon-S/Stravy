import {
  averageSpeedMps,
  computeTrackMetrics,
  defaultTitle,
  estimateCalories,
  haversineMeters,
  MetricPoint,
} from './activity-metrics';

describe('haversineMeters', () => {
  it('returns zero for identical points', () => {
    expect(haversineMeters(13.7, 100.5, 13.7, 100.5)).toBe(0);
  });

  it('approximates one degree of longitude at the equator', () => {
    const meters = haversineMeters(0, 0, 0, 1);
    expect(meters).toBeGreaterThan(110000);
    expect(meters).toBeLessThan(112000);
  });
});

describe('computeTrackMetrics', () => {
  it('returns zeros for an empty or single-point track', () => {
    expect(computeTrackMetrics([])).toEqual({
      distanceM: 0,
      elevationGainM: 0,
      maxSpeedMps: 0,
    });
    expect(computeTrackMetrics([{ lat: 0, lng: 0, recordedAt: '2024-01-01T00:00:00Z' }])).toEqual({
      distanceM: 0,
      elevationGainM: 0,
      maxSpeedMps: 0,
    });
  });

  it('sums distance, positive elevation gain, and tracks max derived speed', () => {
    const points: MetricPoint[] = [
      { lat: 0, lng: 0, elevationM: 10, recordedAt: '2024-01-01T00:00:00Z' },
      { lat: 0, lng: 0.001, elevationM: 20, recordedAt: '2024-01-01T00:00:10Z' },
    ];
    const metrics = computeTrackMetrics(points);
    expect(metrics.distanceM).toBeGreaterThan(100);
    expect(metrics.distanceM).toBeLessThan(120);
    expect(metrics.elevationGainM).toBe(10);
    expect(metrics.maxSpeedMps).toBeGreaterThan(10);
    expect(metrics.maxSpeedMps).toBeLessThan(13);
  });

  it('ignores negative elevation deltas', () => {
    const points: MetricPoint[] = [
      { lat: 0, lng: 0, elevationM: 50, recordedAt: '2024-01-01T00:00:00Z' },
      { lat: 0, lng: 0.001, elevationM: 30, recordedAt: '2024-01-01T00:00:10Z' },
    ];
    expect(computeTrackMetrics(points).elevationGainM).toBe(0);
  });

  it('prefers explicit speed when present', () => {
    const points: MetricPoint[] = [
      { lat: 0, lng: 0, recordedAt: '2024-01-01T00:00:00Z' },
      { lat: 0, lng: 0.001, speedMps: 99, recordedAt: '2024-01-01T00:00:10Z' },
    ];
    expect(computeTrackMetrics(points).maxSpeedMps).toBe(99);
  });
});

describe('averageSpeedMps', () => {
  it('divides distance by moving time', () => {
    expect(averageSpeedMps(1000, 500)).toBe(2);
  });

  it('returns zero when moving time is zero', () => {
    expect(averageSpeedMps(1000, 0)).toBe(0);
  });
});

describe('estimateCalories', () => {
  it('uses a MET estimate scaled by weight and duration', () => {
    expect(estimateCalories('run', 3, 1800, 70)).toBeCloseTo(350, 5);
  });

  it('falls back to a default weight when none is provided', () => {
    expect(estimateCalories('run', 3, 1800, null)).toBeCloseTo(350, 5);
  });
});

describe('defaultTitle', () => {
  it('labels by time of day and activity type', () => {
    expect(defaultTitle('run', new Date(2024, 0, 1, 8))).toBe('Morning Run');
    expect(defaultTitle('ride', new Date(2024, 0, 1, 14))).toBe('Afternoon Ride');
    expect(defaultTitle('walk', new Date(2024, 0, 1, 20))).toBe('Evening Walk');
    expect(defaultTitle('hike', new Date(2024, 0, 1, 3))).toBe('Night Hike');
  });
});
