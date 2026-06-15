import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Privacy } from '../activity.types';

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsIn(['public', 'followers', 'private'])
  privacy?: Privacy;
}
