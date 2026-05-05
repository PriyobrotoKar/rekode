import { ProjectVisibility } from '@rekode/types/server/proto/project';
import { IsEnum, IsString, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MaxLength(100)
  slug: string;

  @IsString()
  templateId: string;

  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(ProjectVisibility)
  visibility: ProjectVisibility;
}
