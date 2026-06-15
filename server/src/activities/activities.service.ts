import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { UsersRepository } from '../users/users.repository';
import {
  averageSpeedMps,
  computeTrackMetrics,
  defaultTitle,
  estimateCalories,
} from './activity-metrics';
import { buildGpx } from './gpx';
import { mapActivityDetail, mapPhoto, mapTrackPoint } from './activity.mapper';
import { decodeCursor, encodeCursor } from './cursor';
import {
  ActivityDetail,
  PhotoOut,
  Privacy,
  TrackPoint,
  UploadedFileLike,
} from './activity.types';
import { ActivitiesRepository } from './activities.repository';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ListActivitiesDto } from './dto/list-activities.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly repo: ActivitiesRepository,
    private readonly usersRepo: UsersRepository,
    private readonly storage: StorageService,
  ) {}

  async create(userId: string, dto: CreateActivityDto): Promise<ActivityDetail> {
    const user = await this.usersRepo.findById(userId);
    const weightKg = user?.weight_kg ? Number(user.weight_kg) : null;

    const metrics = computeTrackMetrics(dto.points);
    const avgSpeedMps = averageSpeedMps(metrics.distanceM, dto.movingSeconds);
    const calories = estimateCalories(dto.type, avgSpeedMps, dto.movingSeconds, weightKg);
    const title = dto.title?.trim() || defaultTitle(dto.type, dto.startedAt);
    const privacy: Privacy = dto.privacy ?? user?.default_privacy ?? 'public';

    const id = await this.repo.create({
      userId,
      type: dto.type,
      title,
      startedAt: dto.startedAt,
      elapsedSeconds: dto.elapsedSeconds,
      movingSeconds: dto.movingSeconds,
      distanceM: metrics.distanceM,
      elevationGainM: metrics.elevationGainM,
      calories,
      avgSpeedMps,
      maxSpeedMps: metrics.maxSpeedMps,
      avgHeartRate: dto.avgHeartRate ?? null,
      privacy,
      points: dto.points,
    });

    return this.getDetail(id, userId);
  }

  async getDetail(id: string, viewerId: string): Promise<ActivityDetail> {
    const row = await this.repo.getDetail(id, viewerId);
    if (!row) throw new NotFoundException('Activity not found');
    await this.assertVisible(row.user_id, row.privacy, viewerId);
    return mapActivityDetail(row);
  }

  async ensureVisible(id: string, viewerId: string): Promise<void> {
    await this.assertCanView(id, viewerId);
  }

  async list(
    viewerId: string,
    query: ListActivitiesDto,
  ): Promise<{ items: ActivityDetail[]; nextCursor: string | null }> {
    const userId = query.userId ?? viewerId;
    const limit = query.limit ?? 20;
    const cursor = query.before ? decodeCursor(query.before) : null;
    const rows = await this.repo.listByUser(userId, viewerId, cursor, limit);
    const items = rows.map((row) => mapActivityDetail(row));
    const last = rows[rows.length - 1];
    const nextCursor =
      rows.length === limit
        ? encodeCursor({ startedAt: last.started_at.toISOString(), id: last.id })
        : null;
    return { items, nextCursor };
  }

  async update(id: string, viewerId: string, dto: UpdateActivityDto): Promise<ActivityDetail> {
    await this.assertOwner(id, viewerId);
    await this.repo.update(id, dto);
    return this.getDetail(id, viewerId);
  }

  async remove(id: string, viewerId: string): Promise<void> {
    await this.assertOwner(id, viewerId);
    await this.repo.remove(id);
  }

  async getPoints(id: string, viewerId: string): Promise<TrackPoint[]> {
    await this.assertCanView(id, viewerId);
    const rows = await this.repo.getPoints(id);
    return rows.map((row) => mapTrackPoint(row));
  }

  async exportGpx(id: string, viewerId: string): Promise<string> {
    const detail = await this.getDetail(id, viewerId);
    const points = await this.repo.getPoints(id);
    return buildGpx(
      { name: detail.title, type: detail.type, startedAt: detail.startedAt },
      points.map((p) => ({
        lat: Number(p.lat),
        lng: Number(p.lng),
        elevationM: p.elevation_m === null ? null : Number(p.elevation_m),
        recordedAt: p.recorded_at,
      })),
    );
  }

  async addPhoto(id: string, viewerId: string, file: UploadedFileLike): Promise<PhotoOut> {
    if (!file || !file.buffer) throw new BadRequestException('No file uploaded');
    await this.assertOwner(id, viewerId);
    const url = await this.storage.save(file.buffer, file.originalname);
    const row = await this.repo.addPhoto(id, url);
    if (!row) throw new NotFoundException('Activity not found');
    return mapPhoto(row);
  }

  async listPhotos(id: string, viewerId: string): Promise<PhotoOut[]> {
    await this.assertCanView(id, viewerId);
    const rows = await this.repo.listPhotos(id);
    return rows.map((row) => mapPhoto(row));
  }

  private async assertOwner(id: string, viewerId: string): Promise<void> {
    const owner = await this.repo.getOwnerPrivacy(id);
    if (!owner) throw new NotFoundException('Activity not found');
    if (owner.user_id !== viewerId) throw new ForbiddenException('Not your activity');
  }

  private async assertCanView(id: string, viewerId: string): Promise<void> {
    const owner = await this.repo.getOwnerPrivacy(id);
    if (!owner) throw new NotFoundException('Activity not found');
    await this.assertVisible(owner.user_id, owner.privacy, viewerId);
  }

  private async assertVisible(ownerId: string, privacy: Privacy, viewerId: string): Promise<void> {
    if (ownerId === viewerId) return;
    if (privacy === 'public') return;
    if (privacy === 'followers') {
      const result = await this.repo.isFollower(viewerId, ownerId);
      if (result?.exists) return;
    }
    throw new ForbiddenException('You cannot view this activity');
  }
}
