export interface GpxPoint {
  lat: number;
  lng: number;
  elevationM?: number | null;
  recordedAt: string | Date;
}

export interface GpxMeta {
  name: string;
  type: string;
  startedAt: string | Date;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isoTime(value: string | Date): string {
  return new Date(value instanceof Date ? value.getTime() : new Date(value).getTime()).toISOString();
}

export function buildGpx(meta: GpxMeta, points: GpxPoint[]): string {
  const trackPoints = points
    .map((p) => {
      const elevation =
        p.elevationM !== null && p.elevationM !== undefined ? `<ele>${p.elevationM}</ele>` : '';
      return `<trkpt lat="${p.lat}" lon="${p.lng}">${elevation}<time>${isoTime(p.recordedAt)}</time></trkpt>`;
    })
    .join('');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<gpx version="1.1" creator="Stravy" xmlns="http://www.topografix.com/GPX/1/1">' +
    `<metadata><time>${isoTime(meta.startedAt)}</time></metadata>` +
    `<trk><name>${escapeXml(meta.name)}</name><type>${escapeXml(meta.type)}</type>` +
    `<trkseg>${trackPoints}</trkseg></trk></gpx>`
  );
}
