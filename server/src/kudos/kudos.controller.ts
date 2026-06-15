import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PublicUser } from '../users/user.types';
import { KudosService } from './kudos.service';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class KudosController {
  constructor(private readonly kudos: KudosService) {}

  @Post(':id/kudos')
  add(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ kudoed: boolean }> {
    return this.kudos.add(user.id, id);
  }

  @Delete(':id/kudos')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ kudoed: boolean }> {
    return this.kudos.remove(user.id, id);
  }

  @Get(':id/kudos')
  list(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PublicUser[]> {
    return this.kudos.list(id, user.id);
  }
}
