function resolveSecret(value: string | undefined, name: string, devFallback: string): string {
  if (value && value.length > 0) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must be set to a strong value in production`);
  }
  return devFallback;
}

export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  database: {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    user: process.env.DATABASE_USER ?? 'stravy',
    password: process.env.DATABASE_PASSWORD ?? 'stravy',
    name: process.env.DATABASE_NAME ?? 'stravy',
  },
  jwt: {
    accessSecret: resolveSecret(
      process.env.JWT_ACCESS_SECRET,
      'JWT_ACCESS_SECRET',
      'dev_access_secret_change_me',
    ),
    refreshSecret: resolveSecret(
      process.env.JWT_REFRESH_SECRET,
      'JWT_REFRESH_SECRET',
      'dev_refresh_secret_change_me',
    ),
    accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10),
    refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '2592000', 10),
  },
});
