import { buildGpx } from './gpx';

describe('buildGpx', () => {
  it('produces valid GPX with track points', () => {
    const gpx = buildGpx(
      { name: 'Morning Run', type: 'run', startedAt: '2024-01-01T00:00:00Z' },
      [
        { lat: 13.7, lng: 100.5, elevationM: 12, recordedAt: '2024-01-01T00:00:00Z' },
        { lat: 13.701, lng: 100.501, elevationM: null, recordedAt: '2024-01-01T00:00:05Z' },
      ],
    );
    expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(gpx).toContain('<gpx version="1.1" creator="Stravy"');
    expect(gpx).toContain('<name>Morning Run</name>');
    expect(gpx).toContain('<trkpt lat="13.7" lon="100.5">');
    expect(gpx).toContain('<ele>12</ele>');
    expect(gpx).toContain('<trkpt lat="13.701" lon="100.501">');
  });

  it('escapes special characters in the name', () => {
    const gpx = buildGpx(
      { name: 'Run & <Race>', type: 'run', startedAt: '2024-01-01T00:00:00Z' },
      [],
    );
    expect(gpx).toContain('<name>Run &amp; &lt;Race&gt;</name>');
    expect(gpx).toContain('<trkseg></trkseg>');
  });
});
