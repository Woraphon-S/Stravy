import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProfileFields, UsersRepository } from './users.repository';
import { PublicUser, SelfUser, UserRow } from './user.types';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  toSelf(row: UserRow): SelfUser {
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      photoUrl: row.photo_url,
      weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
      heightCm: row.height_cm === null ? null : Number(row.height_cm),
      units: row.units,
      defaultPrivacy: row.default_privacy,
      createdAt: row.created_at,
    };
  }

  toPublic(row: UserRow): PublicUser {
    return {
      id: row.id,
      displayName: row.display_name,
      photoUrl: row.photo_url,
      createdAt: row.created_at,
    };
  }

  async getSelf(id: string): Promise<SelfUser> {
    const row = await this.users.findById(id);
    if (!row) throw new NotFoundException('User not found');
    return this.toSelf(row);
  }

  async getPublic(id: string): Promise<PublicUser> {
    const row = await this.users.findById(id);
    if (!row) throw new NotFoundException('User not found');
    return this.toPublic(row);
  }

  async updateProfile(id: string, fields: UpdateProfileFields): Promise<SelfUser> {
    const row = await this.users.updateProfile(id, fields);
    if (!row) throw new NotFoundException('User not found');
    return this.toSelf(row);
  }

  async search(term: string): Promise<PublicUser[]> {
    const trimmed = term.trim();
    if (!trimmed) return [];
    const rows = await this.users.search(trimmed, 20);
    return rows.map((row) => this.toPublic(row));
  }
}
