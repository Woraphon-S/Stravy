import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { Pool } from 'pg';
import { loadEnvFiles } from '../config/load-env';

async function main(): Promise<void> {
  loadEnvFiles(['../.env', '.env']);

  const pool = new Pool({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    user: process.env.DATABASE_USER ?? 'stravy',
    password: process.env.DATABASE_PASSWORD ?? 'stravy',
    database: process.env.DATABASE_NAME ?? 'stravy',
  });

  const dir = resolve(__dirname, '..', '..', 'db', 'migrations');

  await pool.query(
    'CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
  );

  const appliedRows = await pool.query('SELECT name FROM _migrations');
  const applied = new Set(appliedRows.rows.map((r) => r.name));

  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  try {
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = readFileSync(resolve(dir, file), 'utf8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`applied ${file}`);
      } catch (err) {
        try {
          await client.query('ROLLBACK');
        } catch {
          throw err;
        }
        throw err;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }

  console.log('migrations up to date');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
