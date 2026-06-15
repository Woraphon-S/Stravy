const DEFAULT_API_URL = 'http://10.0.2.2:3000';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
export const API_BASE = `${API_URL}/api`;
