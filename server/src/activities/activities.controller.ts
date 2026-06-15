import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
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
import { ActivitiesService } from './activities.service';
import { ActivityDetail, PhotoOut, TrackPoint, UploadedFileLike } from './activity.types';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ListActivitiesDto } from './dto/list-activities.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateActivityDto): Promise<ActivityDetail> {
    return this.activities.create(user.id, dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListActivitiesDto,
  ): Promise<{ items: ActivityDetail[]; nextCursor: string | null }> {
    return this.activities.list(user.id, query);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ActivityDetail> {
    return this.activities.getDetail(id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityDto,
  ): Promise<ActivityDetail> {
    return this.activities.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.activities.remove(id, user.id);
  }

  @Get(':id/points')
  getPoints(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TrackPoint[]> {
    return this.activities.getPoints(id, user.id);
  }

  @Get(':id/gpx')
  @Header('Content-Type', 'application/gpx+xml')
  @Header('Content-Disposition', 'attachment; filename="activity.gpx"')
  exportGpx(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<string> {
    return this.activities.exportGpx(id, user.id);
  }

  @Post(':id/photos')
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedFileLike,
  ): Promise<PhotoOut> {
    return this.activities.addPhoto(id, user.id, file);
  }

  @Get(':id/photos')
  listPhotos(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PhotoOut[]> {
    return this.activities.listPhotos(id, user.id);
  }
}
