import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repo: any;

  const row = {
    id: 'u1',
    email: 'a@b.com',
    password_hash: 'secret-hash',
    display_name: 'A',
    photo_url: null,
    weight_kg: '70.5',
    height_cm: '180.0',
    units: 'metric',
    default_privacy: 'public',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    repo = { findById: jest.fn(), updateProfile: jest.fn(), search: jest.fn() };
    service = new UsersService(repo);
  });

  it('maps numeric strings to numbers and omits the password hash', () => {
    const self = service.toSelf(row as any);
    expect(self.weightKg).toBe(70.5);
    expect(self.heightCm).toBe(180);
    expect((self as any).password_hash).toBeUndefined();
  });

  it('public profile omits private fields', () => {
    const pub = service.toPublic(row as any) as any;
    expect(pub.email).toBeUndefined();
    expect(pub.weightKg).toBeUndefined();
    expect(pub.displayName).toBe('A');
  });

  it('getSelf throws NotFound when missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getSelf('u1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getSelf returns the mapped profile', async () => {
    repo.findById.mockResolvedValue(row);
    const self = await service.getSelf('u1');
    expect(self.id).toBe('u1');
    expect(self.units).toBe('metric');
  });
});
