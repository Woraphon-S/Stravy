import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { SelfUser } from '../users/user.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenRepository } from './refresh-token.repository';

export interface AuthResult {
  user: SelfUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly usersRepo: UsersRepository,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await hash(dto.password, 10);
    const row = await this.usersRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      displayName: dto.displayName,
    });
    if (!row) throw new ConflictException('Could not create account');

    return this.buildResult(row.id, this.users.toSelf(row));
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const row = await this.usersRepo.findByEmail(dto.email);
    if (!row) throw new UnauthorizedException('Invalid email or password');

    const valid = await compare(dto.password, row.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    return this.buildResult(row.id, this.users.toSelf(row));
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const tokenHash = this.hashToken(refreshToken);
    const consumed = await this.refreshTokens.consume(tokenHash);
    if (!consumed) throw new UnauthorizedException('Invalid refresh token');

    const row = await this.usersRepo.findById(consumed.user_id);
    if (!row) throw new UnauthorizedException('Invalid refresh token');

    return this.buildResult(row.id, this.users.toSelf(row));
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokens.revokeByHash(this.hashToken(refreshToken));
  }

  private async buildResult(userId: string, user: SelfUser): Promise<AuthResult> {
    const accessTtl = this.config.get<number>('jwt.accessTtl') ?? 900;
    const refreshTtl = this.config.get<number>('jwt.refreshTtl') ?? 2592000;

    const accessToken = await this.jwt.signAsync(
      { sub: userId },
      { secret: this.config.get<string>('jwt.accessSecret'), expiresIn: accessTtl },
    );

    const refreshToken = randomBytes(48).toString('hex');
    await this.refreshTokens.create({
      userId,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshTtl * 1000),
    });

    return { user, accessToken, refreshToken, expiresIn: accessTtl };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
