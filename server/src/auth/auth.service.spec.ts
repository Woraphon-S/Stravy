import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: any;
  let refreshTokens: any;
  let users: any;
  let jwt: any;
  let config: any;

  const userRow = {
    id: 'u1',
    email: 'a@b.com',
    password_hash: '',
    display_name: 'A',
    photo_url: null,
    weight_kg: null,
    height_cm: null,
    units: 'metric',
    default_privacy: 'public',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    usersRepo = { findByEmail: jest.fn(), create: jest.fn(), findById: jest.fn() };
    refreshTokens = {
      create: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn(),
      revokeByHash: jest.fn().mockResolvedValue(undefined),
    };
    users = { toSelf: jest.fn((row: any) => ({ id: row.id, email: row.email })) };
    jwt = { signAsync: jest.fn().mockResolvedValue('access.jwt') };
    config = {
      get: jest.fn(
        (key: string) =>
          ({
            'jwt.accessTtl': 900,
            'jwt.refreshTtl': 2592000,
            'jwt.accessSecret': 'secret',
          })[key],
      ),
    };
    service = new AuthService(jwt, config, users, usersRepo, refreshTokens);
  });

  it('register rejects an existing email', async () => {
    usersRepo.findByEmail.mockResolvedValue(userRow);
    await expect(
      service.register({ email: 'a@b.com', password: 'password1', displayName: 'A' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('register lowercases the email, creates the user, and issues tokens', async () => {
    usersRepo.findByEmail.mockResolvedValue(null);
    usersRepo.create.mockResolvedValue(userRow);
    const result = await service.register({
      email: 'A@B.com',
      password: 'password1',
      displayName: 'A',
    });
    expect(usersRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'a@b.com', displayName: 'A' }),
    );
    expect(result.accessToken).toBe('access.jwt');
    expect(result.refreshToken).toHaveLength(96);
    expect(refreshTokens.create).toHaveBeenCalled();
  });

  it('login rejects an unknown email', async () => {
    usersRepo.findByEmail.mockResolvedValue(null);
    await expect(service.login({ email: 'x@y.com', password: 'whatever' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('login rejects a wrong password', async () => {
    usersRepo.findByEmail.mockResolvedValue({ ...userRow, password_hash: await hash('correct', 10) });
    await expect(service.login({ email: 'a@b.com', password: 'wrong' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('login succeeds with the right password', async () => {
    usersRepo.findByEmail.mockResolvedValue({ ...userRow, password_hash: await hash('correct', 10) });
    const result = await service.login({ email: 'a@b.com', password: 'correct' });
    expect(result.accessToken).toBe('access.jwt');
  });

  it('refresh atomically consumes and rotates a valid token', async () => {
    refreshTokens.consume.mockResolvedValue({ id: 'r1', user_id: 'u1' });
    usersRepo.findById.mockResolvedValue(userRow);
    const result = await service.refresh('rawtoken');
    expect(refreshTokens.consume).toHaveBeenCalled();
    expect(result.refreshToken).toHaveLength(96);
  });

  it('refresh rejects an invalid or already-used token', async () => {
    refreshTokens.consume.mockResolvedValue(null);
    await expect(service.refresh('bad')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
