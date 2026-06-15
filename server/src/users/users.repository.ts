import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';
import { UserRow } from './user.types';

export interface UpdateProfileFields {
  displayName?: string;
  photoUrl?: string;
  weightKg?: number;
  heightCm?: number;
  units?: 'metric' | 'imperial';
  defaultPrivacy?: 'public' | 'followers' | 'private';
}

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  create(input: { email: string; passwordHash: string; displayName: string }): Promise<UserRow | null> {
    return this.db.queryOne<UserRow>(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.email, input.passwordHash, input.displayName],
    );
  }

  findByEmail(email: string): Promise<UserRow | null> {
    return this.db.queryOne<UserRow>('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  }

  findById(id: string): Promise<UserRow | null> {
    return this.db.queryOne<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  }

  search(term: string, limit: number): Promise<UserRow[]> {
    const escaped = term.replace(/[\\%_]/g, '\\$&');
    return this.db.query<UserRow>(
      `SELECT * FROM users
       WHERE display_name ILIKE $1
       ORDER BY display_name
       LIMIT $2`,
      [`%${escaped}%`, limit],
    );
  }

  updateProfile(id: string, fields: UpdateProfileFields): Promise<UserRow | null> {
    const columns: Record<string, unknown> = {
      display_name: fields.displayName,
      photo_url: fields.photoUrl,
      weight_kg: fields.weightKg,
      height_cm: fields.heightCm,
      units: fields.units,
      default_privacy: fields.defaultPrivacy,
    };

    const sets: string[] = [];
    const values: unknown[] = [];
    let index = 1;
    for (const [column, value] of Object.entries(columns)) {
      if (value === undefined) continue;
      sets.push(`${column} = $${index++}`);
      values.push(value);
    }

    if (sets.length === 0) return this.findById(id);

    values.push(id);
    return this.db.queryOne<UserRow>(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${index} RETURNING *`,
      values,
    );
  }
}
