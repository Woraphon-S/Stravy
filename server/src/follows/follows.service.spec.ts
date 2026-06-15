import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FollowsService } from './follows.service';

describe('FollowsService', () => {
  let service: FollowsService;
  let repo: any;
  let usersRepo: any;
  let users: any;

  beforeEach(() => {
    repo = {
      follow: jest.fn().mockResolvedValue(undefined),
      unfollow: jest.fn().mockResolvedValue(undefined),
      listFollowers: jest.fn(),
      listFollowing: jest.fn(),
    };
    usersRepo = { findById: jest.fn() };
    users = { toPublic: jest.fn((row: any) => ({ id: row.id })) };
    service = new FollowsService(repo, usersRepo, users);
  });

  it('rejects following yourself', async () => {
    await expect(service.follow('u1', 'u1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects following a missing user', async () => {
    usersRepo.findById.mockResolvedValue(null);
    await expect(service.follow('u1', 'u2')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('follows an existing user', async () => {
    usersRepo.findById.mockResolvedValue({ id: 'u2' });
    const result = await service.follow('u1', 'u2');
    expect(result).toEqual({ following: true });
    expect(repo.follow).toHaveBeenCalledWith('u1', 'u2');
  });

  it('unfollows without checking existence', async () => {
    const result = await service.unfollow('u1', 'u2');
    expect(result).toEqual({ following: false });
    expect(repo.unfollow).toHaveBeenCalledWith('u1', 'u2');
  });
});
