import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivitiesModule } from './activities/activities.module';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import configuration from './config/configuration';
import { DatabaseModule } from './db/database.module';
import { FeedModule } from './feed/feed.module';
import { FollowsModule } from './follows/follows.module';
import { HealthModule } from './health/health.module';
import { KudosModule } from './kudos/kudos.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['../.env', '.env'],
    }),
    DatabaseModule,
    StorageModule,
    AuthModule,
    UsersModule,
    ActivitiesModule,
    FollowsModule,
    KudosModule,
    CommentsModule,
    FeedModule,
    HealthModule,
  ],
})
export class AppModule {}
