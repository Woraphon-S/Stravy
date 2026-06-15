export interface Cursor {
  startedAt: string;
  id: string;
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(`${cursor.startedAt}|${cursor.id}`, 'utf8').toString('base64url');
}

export function decodeCursor(value: string): Cursor | null {
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8');
    const separator = decoded.indexOf('|');
    if (separator === -1) return null;
    return { startedAt: decoded.slice(0, separator), id: decoded.slice(separator + 1) };
  } catch {
    return null;
  }
}
