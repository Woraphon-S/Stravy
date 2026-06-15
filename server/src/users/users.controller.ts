import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PublicUser, SelfUser } from './user.types';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser): Promise<SelfUser> {
    return this.users.getSelf(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto): Promise<SelfUser> {
    return this.users.updateProfile(user.id, dto);
  }

  @Get('search')
  search(@Query('q') q: string): Promise<PublicUser[]> {
    return this.users.search(q ?? '');
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string): Promise<PublicUser> {
    return this.users.getPublic(id);
  }
}
