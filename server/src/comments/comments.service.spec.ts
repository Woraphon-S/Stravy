import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let repo: any;
  let activities: any;

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      list: jest.fn(),
      getOwnership: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    activities = { ensureVisible: jest.fn().mockResolvedValue(undefined) };
    service = new CommentsService(repo, activities);
  });

  it('maps a created comment', async () => {
    repo.add.mockResolvedValue({
      id: 'c1',
      activity_id: 'a1',
      user_id: 'me',
      body: 'hi',
      created_at: new Date(),
      author_name: 'Me',
      author_photo: null,
    });
    const out = await service.add('a1', 'me', 'hi');
    expect(out.body).toBe('hi');
    expect(out.author.displayName).toBe('Me');
    expect(activities.ensureVisible).toHaveBeenCalledWith('a1', 'me');
  });

  it('lets the comment author delete', async () => {
    repo.getOwnership.mockResolvedValue({ comment_user_id: 'me', activity_user_id: 'other' });
    await service.remove('c1', 'me');
    expect(repo.remove).toHaveBeenCalledWith('c1');
  });

  it('lets the activity owner delete', async () => {
    repo.getOwnership.mockResolvedValue({ comment_user_id: 'other', activity_user_id: 'me' });
    await service.remove('c1', 'me');
    expect(repo.remove).toHaveBeenCalledWith('c1');
  });

  it('forbids an unrelated user from deleting', async () => {
    repo.getOwnership.mockResolvedValue({ comment_user_id: 'a', activity_user_id: 'b' });
    await expect(service.remove('c1', 'me')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws NotFound for a missing comment', async () => {
    repo.getOwnership.mockResolvedValue(null);
    await expect(service.remove('c1', 'me')).rejects.toBeInstanceOf(NotFoundException);
  });
});
