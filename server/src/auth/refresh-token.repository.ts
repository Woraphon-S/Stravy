import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';

export interface RefreshTokenRow {
  id: string;
  user_id: string;
}

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await this.db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [input.userId, input.tokenHash, input.expiresAt],
    );
  }

  consume(tokenHash: string): Promise<RefreshTokenRow | null> {
    return this.db.queryOne<RefreshTokenRow>(
      `UPDATE refresh_tokens SET revoked_at = now()
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()
       RETURNING id, user_id`,
      [tokenHash],
    );
  }

  async revokeByHash(tokenHash: string): Promise<void> {
    await this.db.query(
      `UPDATE refresh_tokens SET revoked_at = now()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash],
    );
  }
}
