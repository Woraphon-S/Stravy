import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PublicUser } from '../users/user.types';
import { FollowsService } from './follows.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(private readonly follows: FollowsService) {}

  @Post(':id/follow')
  follow(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ following: boolean }> {
    return this.follows.follow(user.id, id);
  }

  @Delete(':id/follow')
  unfollow(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ following: boolean }> {
    return this.follows.unfollow(user.id, id);
  }

  @Get(':id/followers')
  followers(@Param('id', ParseUUIDPipe) id: string): Promise<PublicUser[]> {
    return this.follows.listFollowers(id);
  }

  @Get(':id/following')
  following(@Param('id', ParseUUIDPipe) id: string): Promise<PublicUser[]> {
    return this.follows.listFollowing(id);
  }
}
