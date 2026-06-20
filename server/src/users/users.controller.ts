import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PublicUser, SelfUser, UploadedFileLike } from './user.types';
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

  @Post('me/photo')
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: UploadedFileLike,
  ): Promise<SelfUser> {
    return this.users.updatePhoto(user.id, file);
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
