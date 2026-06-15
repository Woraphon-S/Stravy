import { Injectable } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { PublicUser } from '../users/user.types';
import { UsersService } from '../users/users.service';
import { KudosRepository } from './kudos.repository';

@Injectable()
export class KudosService {
  constructor(
    private readonly repo: KudosRepository,
    private readonly activities: ActivitiesService,
    private readonly users: UsersService,
  ) {}

  async add(userId: string, activityId: string): Promise<{ kudoed: boolean }> {
    await this.activities.ensureVisible(activityId, userId);
    await this.repo.add(userId, activityId);
    return { kudoed: true };
  }

  async remove(userId: string, activityId: string): Promise<{ kudoed: boolean }> {
    await this.repo.remove(userId, activityId);
    return { kudoed: false };
  }

  async list(activityId: string, viewerId: string): Promise<PublicUser[]> {
    await this.activities.ensureVisible(activityId, viewerId);
    const rows = await this.repo.listUsers(activityId);
    return rows.map((row) => this.users.toPublic(row));
  }
}
