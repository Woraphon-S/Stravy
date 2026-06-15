import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { UsersModule } from '../users/users.module';
import { KudosController } from './kudos.controller';
import { KudosRepository } from './kudos.repository';
import { KudosService } from './kudos.service';

@Module({
  imports: [ActivitiesModule, UsersModule],
  controllers: [KudosController],
  providers: [KudosService, KudosRepository],
})
export class KudosModule {}
