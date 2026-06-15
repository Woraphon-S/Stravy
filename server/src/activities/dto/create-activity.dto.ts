import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ActivityType } from '../activity-metrics';
import { Privacy } from '../activity.types';

export class TrackPointDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsISO8601()
  recordedAt!: string;

  @IsOptional()
  @IsNumber()
  elevationM?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  heartRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  speedMps?: number;
}

export class CreateActivityDto {
  @IsIn(['run', 'ride', 'walk', 'hike', 'swim'])
  type!: ActivityType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsISO8601()
  startedAt!: string;

  @IsInt()
  @Min(0)
  elapsedSeconds!: number;

  @IsInt()
  @Min(0)
  movingSeconds!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  avgHeartRate?: number;

  @IsOptional()
  @IsIn(['public', 'followers', 'private'])
  privacy?: Privacy;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackPointDto)
  @ArrayMaxSize(200000)
  points!: TrackPointDto[];
}
