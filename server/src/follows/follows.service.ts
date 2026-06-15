import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PublicUser } from '../users/user.types';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { FollowsRepository } from './follows.repository';

@Injectable()
export class FollowsService {
  constructor(
    private readonly repo: FollowsRepository,
    private readonly usersRepo: UsersRepository,
    private readonly users: UsersService,
  ) {}

  async follow(followerId: string, followeeId: string): Promise<{ following: boolean }> {
    if (followerId === followeeId) throw new BadRequestException('Cannot follow yourself');
    const target = await this.usersRepo.findById(followeeId);
    if (!target) throw new NotFoundException('User not found');
    await this.repo.follow(followerId, followeeId);
    return { following: true };
  }

  async unfollow(followerId: string, followeeId: string): Promise<{ following: boolean }> {
    await this.repo.unfollow(followerId, followeeId);
    return { following: false };
  }

  async listFollowers(userId: string): Promise<PublicUser[]> {
    const rows = await this.repo.listFollowers(userId);
    return rows.map((row) => this.users.toPublic(row));
  }

  async listFollowing(userId: string): Promise<PublicUser[]> {
    const rows = await this.repo.listFollowing(userId);
    return rows.map((row) => this.users.toPublic(row));
  }
}
