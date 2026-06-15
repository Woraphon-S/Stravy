import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';

function detailRow(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'a1',
    user_id: 'owner',
    author_name: 'Owner',
    author_photo: null,
    type: 'run',
    title: 'Morning Run',
    started_at: new Date('2024-01-01T00:00:00Z'),
    elapsed_seconds: 100,
    moving_seconds: 100,
    distance_m: 1000,
    elevation_gain_m: 10,
    calories: 100,
    avg_speed_mps: 3,
    max_speed_mps: 5,
    avg_heart_rate: null,
    privacy: 'public',
    created_at: new Date('2024-01-01T00:00:00Z'),
    kudos_count: '2',
    comment_count: '1',
    kudoed_by_me: false,
    ...overrides,
  };
}

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let repo: any;
  let usersRepo: any;
  let storage: any;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      getDetail: jest.fn(),
      getOwnerPrivacy: jest.fn(),
      listByUser: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      getPoints: jest.fn(),
      isFollower: jest.fn(),
      addPhoto: jest.fn(),
      listPhotos: jest.fn(),
    };
    usersRepo = { findById: jest.fn() };
    storage = { save: jest.fn() };
    service = new ActivitiesService(repo, usersRepo, storage);
  });

  it('maps a public activity detail and counts', async () => {
    repo.getDetail.mockResolvedValue(detailRow());
    const result = await service.getDetail('a1', 'viewer');
    expect(result.kudosCount).toBe(2);
    expect(result.commentCount).toBe(1);
    expect(result.author.displayName).toBe('Owner');
  });

  it('forbids viewing another user private activity', async () => {
    repo.getDetail.mockResolvedValue(detailRow({ privacy: 'private' }));
    await expect(service.getDetail('a1', 'viewer')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows the owner to view a private activity', async () => {
    repo.getDetail.mockResolvedValue(detailRow({ privacy: 'private', user_id: 'viewer' }));
    const result = await service.getDetail('a1', 'viewer');
    expect(result.privacy).toBe('private');
  });

  it('allows a follower to view a followers-only activity', async () => {
    repo.getDetail.mockResolvedValue(detailRow({ privacy: 'followers' }));
    repo.isFollower.mockResolvedValue({ exists: true });
    const result = await service.getDetail('a1', 'viewer');
    expect(result.privacy).toBe('followers');
  });

  it('forbids a non-follower from a followers-only activity', async () => {
    repo.getDetail.mockResolvedValue(detailRow({ privacy: 'followers' }));
    repo.isFollower.mockResolvedValue({ exists: false });
    await expect(service.getDetail('a1', 'viewer')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws NotFound for a missing activity', async () => {
    repo.getDetail.mockResolvedValue(null);
    await expect(service.getDetail('a1', 'viewer')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('computes distance, calories, and a default title on create', async () => {
    usersRepo.findById.mockResolvedValue({ weight_kg: '70', default_privacy: 'public' });
    repo.create.mockResolvedValue('new-id');
    repo.getDetail.mockResolvedValue(detailRow({ id: 'new-id' }));

    await service.create('owner', {
      type: 'run',
      startedAt: '2024-01-01T08:00:00Z',
      elapsedSeconds: 10,
      movingSeconds: 10,
      points: [
        { lat: 0, lng: 0, recordedAt: '2024-01-01T08:00:00Z' },
        { lat: 0, lng: 0.001, recordedAt: '2024-01-01T08:00:10Z' },
      ],
    });

    const createArg = repo.create.mock.calls[0][0];
    expect(createArg.distanceM).toBeGreaterThan(100);
    expect(createArg.calories).toBeGreaterThan(0);
    expect(createArg.title).toContain('Run');
    expect(createArg.privacy).toBe('public');
  });

  it('rejects updates from a non-owner', async () => {
    repo.getOwnerPrivacy.mockResolvedValue({ user_id: 'owner', privacy: 'public' });
    await expect(service.update('a1', 'intruder', { title: 'x' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('removes an activity for its owner', async () => {
    repo.getOwnerPrivacy.mockResolvedValue({ user_id: 'owner', privacy: 'public' });
    await service.remove('a1', 'owner');
    expect(repo.remove).toHaveBeenCalledWith('a1');
  });
});
